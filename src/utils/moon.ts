/**
 * moon.ts — 月相共享工具
 *
 * 所有月相 path 生成、名称映射统一于此，避免 CoverSection / Header / Favicon 重复定义。
 * 路> 径生成算法经像素采样验证——面积（rx = R·|1-2f|）和 sweep 方向均正确。
 */

/** 月相中文名称（8 段，按 SunCalc phase 索引） */
export const MOON_PHASE_NAMES_ZH = [
  '新月',
  '蛾眉月',
  '上弦月',
  '盈凸月',
  '满月',
  '亏凸月',
  '下弦月',
  '残月',
] as const;

/** 月相英文名称（8 段，按 SunCalc phase 索引） */
export const MOON_PHASE_NAMES_EN = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const;

/**
 * 根据 SunCalc phase（0~1）返回月相名称索引（0~7）
 */
export function moonPhaseNameIndex(phase: number): number {
  return Math.floor(phase * 8) % 8;
}

/**
 * 生成月相亮面 SVG path（北半球标准月相）
 *
 * @param fraction - SunCalc 照明比例 0~1（0=新月, 1=满月）
 * @param waxing    - true=盈月(新→满,亮面在右), false=亏月(满→新,亮面在左)
 * @param r         - 月盘半径，默认 10（SVG viewBox 24×24）
 *
 * 原理：亮面 path = 亮侧半圆轮廓 + 交界椭圆弧
 *   - rx = R·|1-2f|（通过椭圆弧控制亮面面积）
 *   - contourSweep 决定轮廓半圆在亮侧（waxing→0=右, waning→1=左）
 *   - termSweep 决定交界弧凸向（f<0.5 月牙凸亮侧, f>0.5 凸月凸暗侧）
 *   最终 SVG 需配合 scaleX(-1) 镜像，使盈月亮面显示在右侧。
 */
export function moonPhaseLitPath(
  fraction: number,
  waxing: boolean,
  r = 10,
): string {
  const rx = Math.max(Math.abs(r * (1 - 2 * fraction)), 1e-6);
  const contourSweep = waxing ? 0 : 1;
  const termSweep = waxing
    ? fraction < 0.5
      ? 1
      : 0
    : fraction < 0.5
      ? 0
      : 1;
  return [
    `M 12 ${12 - r}`,
    `A ${r} ${r} 0 0 ${contourSweep} 12 ${12 + r}`,
    `A ${rx} ${r} 0 0 ${termSweep} 12 ${12 - r}`,
    'Z',
  ].join(' ');
}
