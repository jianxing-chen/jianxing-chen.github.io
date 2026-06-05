/**
 * 图库数据整形工具
 * 功能：统一国家 slug、本地化文本、国家/地区分组、首页摘录数据与深链路径。
 * 输入：gallery.json 中的照片数组与语言代码。
 * 输出：gallery 首页总览与国家详情页可直接消费的结构化数据。
 * 用法示例：
 * const countries = buildGalleryCountries(photos, 'zh', 10);
 * const detail = buildCountryDetail(photos, 'en');
 */

export interface GalleryPhoto {
  id: string;
  cloudinaryId: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  tags: string[];
  location: { en: string; zh: string };
  region: { en: string; zh: string };
  width: number;
  height: number;
  featured: boolean;
}

interface LocalizedText {
  en: string;
  zh: string;
}

export interface GalleryRegionGroup {
  key: string;
  display: string;
  items: GalleryPhoto[];
}

export interface GalleryCountryGroup {
  key: string;
  display: string;
  anchorId: string;
  countrySlug: string;
  total: number;
  previewPhotos: GalleryPhoto[];
  photos: GalleryPhoto[];
  regions: GalleryRegionGroup[];
}

export function getLocalizedText(value: LocalizedText, lang: string): string {
  return value[lang as keyof LocalizedText] || value.en;
}

export function slugifyCountry(countryName: string): string {
  return countryName.toLowerCase().trim().replace(/\s+/g, '-');
}

export function buildGalleryCountries(
  photos: GalleryPhoto[],
  lang: string,
  previewLimit = 10,
): GalleryCountryGroup[] {
  const countryMap = new Map<string, GalleryPhoto[]>();

  photos.forEach((photo) => {
    const countryKey = photo.location.en;
    const countryPhotos = countryMap.get(countryKey) || [];
    countryPhotos.push(photo);
    countryMap.set(countryKey, countryPhotos);
  });

  return Array.from(countryMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([countryKey, countryPhotos]) => {
      // 同一国家内按地区排序
      countryPhotos.sort((a, b) => a.region.en.localeCompare(b.region.en));
      const regionMap = new Map<string, GalleryPhoto[]>();

      countryPhotos.forEach((photo) => {
        const regionKey = photo.region.en;
        const regionPhotos = regionMap.get(regionKey) || [];
        regionPhotos.push(photo);
        regionMap.set(regionKey, regionPhotos);
      });

      const regions = Array.from(regionMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([regionKey, regionPhotos]) => ({
          key: regionKey,
          display: getLocalizedText(regionPhotos[0].region, lang),
          items: regionPhotos,
        }));

      return {
        key: countryKey,
        display: getLocalizedText(countryPhotos[0].location, lang),
        anchorId: `country-${slugifyCountry(countryKey)}`,
        countrySlug: slugifyCountry(countryKey),
        total: countryPhotos.length,
        previewPhotos: countryPhotos.slice(0, previewLimit),
        photos: countryPhotos,
        regions,
      };
    });
}

export function getGalleryCountryPath(countrySlug: string, lang: string): string {
  return `${lang === 'zh' ? '/zh' : ''}/gallery/country/${countrySlug}/`;
}

export function getGalleryPhotoDetailPath(photo: GalleryPhoto, lang: string): string {
  return `${getGalleryCountryPath(slugifyCountry(photo.location.en), lang)}#photo-${photo.id}`;
}

export function buildCountryDetail(photos: GalleryPhoto[], lang: string) {
  const sorted = [...photos].sort((a, b) => a.region.en.localeCompare(b.region.en));
  const regions = new Map<string, GalleryRegionGroup>();

  sorted.forEach((photo) => {
    const regionKey = photo.region.en;
    const region = regions.get(regionKey);
    if (region) {
      region.items.push(photo);
      return;
    }

    regions.set(regionKey, {
      key: regionKey,
      display: getLocalizedText(photo.region, lang),
      items: [photo],
    });
  });

  return {
    photos: sorted,
    regions: Array.from(regions.values()).sort((left, right) => left.key.localeCompare(right.key)),
  };
}