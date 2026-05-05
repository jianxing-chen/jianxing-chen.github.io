"""
批量压缩照片 — 适配 4K 屏 + Cloudinary 免费 10MB 限额

────────────────────────────────────────────────────────
  功能概述
────────────────────────────────────────────────────────
  1. 等比缩放到 4K 屏尺寸（长边 ≤ 3840px，保持原始宽高比）
  2. 自动降低 JPEG 质量，确保输出文件 ≤ 目标 MB
  3. 支持单个文件或整个文件夹批量处理

────────────────────────────────────────────────────────
  文件读写方式
────────────────────────────────────────────────────────
  读取：
    - 使用 Pillow (PIL) 以流式方式打开源图片，支持 JPEG / PNG /
      TIFF / WebP / BMP / HEIC / HEIF 格式
    - 非 RGB 模式（RGBA、P、LA、灰度）自动转为白底 RGB

  写入：
    - 统一输出为 JPEG 格式（无论原始格式）
    - 先写入临时文件（.q{quality}.tmp），验证大小合格后
      再 rename 到目标路径，避免残留不完整文件
    - 输出目标目录自动创建（mkdir -p 等效）

────────────────────────────────────────────────────────
  压缩流程
────────────────────────────────────────────────────────
  第一步：等比缩放
    若图片长边 > MAX_LONG_SIDE，按比例缩小至 4K 尺寸
    使用 LANCZOS 高质量重采样

  第二步：迭代降质量
    从 QUALITY_START (95) 开始保存，检查文件大小
    若 > 目标 MB，质量逐次降低 QUALITY_STEP (5)
    直到满足大小要求或触底 QUALITY_MIN (20)

────────────────────────────────────────────────────────
  可调参数（脚本顶部集中定义）
────────────────────────────────────────────────────────
  MAX_LONG_SIDE  = 3840   # 4K 屏长边像素
  TARGET_SIZE_MB = 5.0    # 目标文件大小上限 (MB)
  QUALITY_START  = 95     # 起始 JPEG 质量
  QUALITY_MIN    = 20     # 最低质量（低于此值放弃）
  QUALITY_STEP   = 5      # 每次降质量步长

────────────────────────────────────────────────────────
  用法示例
────────────────────────────────────────────────────────
  # 交互式选择源文件或文件夹
  python scripts/compress_photos.py

  # 压缩整个文件夹
  python scripts/compress_photos.py -s ~/photos

  # 压缩单个文件
  python scripts/compress_photos.py -s ~/photos/DSC0001.jpg

  # 目标 ≤ 3MB
  python scripts/compress_photos.py -s ~/photos -t 3

  # 指定输出目录
  python scripts/compress_photos.py -s ~/photos -o ~/cloudinary_ready

  # 天文摄影保留更多细节（5000px + 5MB）
  python scripts/compress_photos.py -s ~/astro -l 5000 -t 5

────────────────────────────────────────────────────────
  默认输出路径
────────────────────────────────────────────────────────
  源为文件夹 ~/photos        → ~/photos/compressed/
  源为单文件 ~/p/DSC0001.jpg → ~/p/compressed/
  指定 -o 参数               → 使用指定路径

────────────────────────────────────────────────────────
  依赖
────────────────────────────────────────────────────────
  pip install Pillow
"""

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("错误：请先安装 Pillow → pip install Pillow")
    sys.exit(1)

# ─── 可调参数 ────────────────────────────────────────────

MAX_LONG_SIDE = 3840       # 4K 屏长边像素（3840×2160 的宽）
TARGET_SIZE_MB = 5.0       # 目标文件大小上限 (MB)
QUALITY_START = 95         # 起始 JPEG 质量
QUALITY_MIN = 20           # 最低质量（低于此值放弃）
QUALITY_STEP = 5           # 每次降质量步长
SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp", ".bmp", ".heic", ".heif"}


# ─── 核心逻辑 ────────────────────────────────────────────

def compress_image(src: Path, dst: Path, max_long: int, target_mb: float) -> dict:
    """
    压缩单张图片，返回 {filename, original_mb, resized_px, final_mb, quality, ok}
    """
    try:
        img = Image.open(src)
    except Exception as e:
        return {"filename": src.name, "error": str(e), "ok": False}

    info = {"filename": src.name, "original_mb": src.stat().st_size / 1e6, "ok": False}

    # 转换为 RGB（处理 RGBA / P / 灰度等模式）
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
        img = background
    elif img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # 等比缩放
    w, h = img.size
    longest = max(w, h)
    if longest > max_long:
        ratio = max_long / longest
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
    else:
        new_size = (w, h)
    info["resized_px"] = f"{new_size[0]}×{new_size[1]}"

    # 迭代降质量直到满足目标大小
    quality = QUALITY_START
    target_bytes = target_mb * 1_000_000
    dst.parent.mkdir(parents=True, exist_ok=True)

    while quality >= QUALITY_MIN:
        # 用临时路径避免覆盖
        tmp_path = dst.with_suffix(f".q{quality}.tmp")
        img.save(tmp_path, "JPEG", quality=quality, optimize=True)
        size = tmp_path.stat().st_size

        if size <= target_bytes or quality <= QUALITY_MIN:
            shutil.move(str(tmp_path), str(dst))
            info["quality"] = quality
            info["final_mb"] = size / 1e6
            info["ok"] = True
            break

        tmp_path.unlink()
        quality -= QUALITY_STEP

    # 清理残留临时文件
    for leftover in dst.parent.glob(f"{dst.stem}.q*.tmp"):
        leftover.unlink(missing_ok=True)

    return info


def main():
    parser = argparse.ArgumentParser(
        description="压缩照片至 4K 屏 + Cloudinary 限额",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
默认参数：
  长边上限: {MAX_LONG_SIDE} px (4K)
  目标大小: ≤ {TARGET_SIZE_MB} MB
  支持格式: {', '.join(SUPPORTED_EXTS)}
        """,
    )
    parser.add_argument("-s", "--source", help="源文件或文件夹路径（支持单个文件）")
    parser.add_argument("-o", "--output", help="输出文件夹路径（默认为 source 同目录下的 compressed/）")
    parser.add_argument("-t", "--target", type=float, default=TARGET_SIZE_MB, help=f"目标大小上限 MB（默认 {TARGET_SIZE_MB})")
    parser.add_argument("-l", "--long", type=int, default=MAX_LONG_SIDE, help=f"长边像素上限（默认 {MAX_LONG_SIDE})")
    args = parser.parse_args()

    # 确定源路径
    if args.source:
        src_path = Path(args.source).expanduser()
    else:
        src_path = Path(input("请输入源文件或文件夹路径: ")).expanduser()

    if not src_path.exists():
        print(f"错误：路径不存在 → {src_path}")
        sys.exit(1)

    # 收集图片：单文件 或 文件夹内所有
    if src_path.is_file():
        if src_path.suffix.lower() not in SUPPORTED_EXTS:
            print(f"错误：不支持的文件格式 → {src_path.suffix}")
            sys.exit(1)
        image_files = [src_path]
    else:
        image_files = sorted(
            f for f in src_path.iterdir()
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTS
        )
    if not image_files:
        print(f"未找到支持的图片文件（{', '.join(SUPPORTED_EXTS)}）")
        sys.exit(1)

    # 确定输出文件夹
    if args.output:
        out_dir = Path(args.output).expanduser()
    else:
        out_dir = src_path.parent / "compressed" if src_path.is_file() else src_path / "compressed"

    print(f"\n{'='*60}")
    print(f"源路径:     {src_path}")
    print(f"输出文件夹: {out_dir}")
    print(f"图片数量:   {len(image_files)}")
    print(f"长边上限:   {args.long} px")
    print(f"目标大小:   ≤ {args.target} MB")
    print(f"{'='*60}\n")

    # 逐个处理
    results = []
    for f in image_files:
        dst = out_dir / f"{f.stem}.jpg"
        print(f"处理中: {f.name} ({f.stat().st_size / 1e6:.1f} MB) ...", end=" ")
        result = compress_image(f, dst, args.long, args.target)
        results.append(result)
        if result["ok"]:
            print(f"→ {result.get('resized_px', '?')}, {result['final_mb']:.1f} MB (q={result['quality']})  ✓")
        else:
            print(f"✗ {result.get('error', '未知错误')}")

    # 汇总
    ok_count = sum(1 for r in results if r["ok"])
    fail_count = len(results) - ok_count
    total_original = sum(r.get("original_mb", 0) for r in results)
    total_final = sum(r.get("final_mb", 0) for r in results if r["ok"])

    print(f"\n{'='*60}")
    print(f"完成: {ok_count} 成功, {fail_count} 失败")
    if ok_count > 0:
        print(f"总体积: {total_original:.1f} MB → {total_final:.1f} MB (节省 {total_original - total_final:.1f} MB)")
    print(f"输出目录: {out_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
