/**
 * Masonry 瀑布流布局计算引擎
 * 功能：基于贪心算法的 JS 布局计算，按照片宽高比将照片分配到各列，使列间高度尽可能接近。
 *       复刻 react-photo-album masonry 的核心逻辑，在 Astro SSG 服务端计算，零客户端开销。
 * 输入：GalleryPhoto 数组 + 目标列数
 * 输出：按列分组的结果（每列包含照片列表和累计高度比率）
 * 用法示例：
 *   const columns = computeMasonryLayout(photos, 3);
 *   // columns[0].items → 第一列的照片列表
 *
 * 参考：https://react-photo-album.com/examples/masonry
 */

import type { GalleryPhoto } from './gallery';

export interface MasonryColumn {
  /** 该列包含的照片（保持插入顺序） */
  items: GalleryPhoto[];
  /** 累计高度比率之和（height / width），用于贪心比较 */
  totalHeight: number;
}

/**
 * 使用贪心算法将照片分配到各列
 * 算法：遍历每张照片，将其放入当前累计高度最小的列（模拟"最短列优先"）
 * 这确保各列最终高度尽可能接近，照片保持原始宽高比、不被裁切
 *
 * @param photos  照片列表
 * @param columns 目标列数（桌面端 3 列，详情页 4 列）
 * @returns 分列结果数组，长度为 columns
 */
export function computeMasonryLayout(
  photos: GalleryPhoto[],
  columns: number,
): MasonryColumn[] {
  const cols: MasonryColumn[] = Array.from({ length: columns }, () => ({
    items: [],
    totalHeight: 0,
  }));

  for (const photo of photos) {
    // 以宽高比作为该照片在列中的"高度成本"
    const ratio = photo.height / photo.width;

    // 贪心：找出当前累计高度最小的列
    let shortestIdx = 0;
    for (let i = 1; i < cols.length; i++) {
      if (cols[i].totalHeight < cols[shortestIdx].totalHeight) {
        shortestIdx = i;
      }
    }

    cols[shortestIdx].items.push(photo);
    cols[shortestIdx].totalHeight += ratio;
  }

  return cols;
}

/**
 * 使用行流轮询算法将照片分配到各列（左→右，上→下）
 * 算法：照片按原始顺序依次填入各列（第 i 张 → 第 i % columns 列），
 *       保证视觉上从左到右、从上到下的阅读顺序。
 *
 * @param photos  照片列表
 * @param columns 目标列数
 * @returns 分列结果数组
 */
export function computeRowLayout(
  photos: GalleryPhoto[],
  columns: number,
): MasonryColumn[] {
  const cols: MasonryColumn[] = Array.from({ length: columns }, () => ({
    items: [],
    totalHeight: 0,
  }));

  // 按地区分组，每组内顺序不变
  const regionGroups: GalleryPhoto[][] = [];
  let lastRegion = '';
  for (const photo of photos) {
    if (photo.region.en !== lastRegion) {
      regionGroups.push([]);
      lastRegion = photo.region.en;
    }
    regionGroups[regionGroups.length - 1].push(photo);
  }

  // 逐组填入：每组内按贪心（最短列优先），兼顾宽高比平衡
  for (const group of regionGroups) {
    for (const photo of group) {
      let shortest = cols.reduce((min, c, i) => c.totalHeight < cols[min].totalHeight ? i : min, 0);
      cols[shortest].items.push(photo);
      cols[shortest].totalHeight += photo.height / photo.width;
    }
  }

  return cols;
}
