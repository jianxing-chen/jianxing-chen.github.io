import { SITE_CONFIG } from '@/config/site';

export interface ToolLocationPreset {
  name: { en: string; zh: string };
  lat: number;
  lng: number;
  timer7: { lat: number; lng: number };
  tz: string;
}

export interface ToolEntry {
  slug: string;
  icon: string;
  name: { en: string; zh: string };
  description: { en: string; zh: string };
  searchTerms: string;
  cover?: string;
}

/** Default location for tools (falls back to site config) */
export const DEFAULT_TOOL_LOCATION: ToolLocationPreset = {
  name: SITE_CONFIG.location.name,
  lat: SITE_CONFIG.location.lat,
  lng: SITE_CONFIG.location.lng,
  timer7: SITE_CONFIG.location.timer7,
  tz: 'Asia/Shanghai',
};

/** Predefined location presets for the Live Data tool */
export const LOCATION_PRESETS: ToolLocationPreset[] = [
  { name: { en: 'Beijing', zh: '北京' }, lat: 39.9, lng: 116.4, timer7: { lat: 39.96, lng: 116.36 }, tz: 'Asia/Shanghai' },
  { name: { en: 'Shanghai', zh: '上海' }, lat: 31.23, lng: 121.47, timer7: { lat: 31.23, lng: 121.47 }, tz: 'Asia/Shanghai' },
  { name: { en: 'Tokyo', zh: '东京' }, lat: 35.68, lng: 139.69, timer7: { lat: 35.68, lng: 139.69 }, tz: 'Asia/Tokyo' },
  { name: { en: 'Sydney', zh: '悉尼' }, lat: -33.87, lng: 151.21, timer7: { lat: -33.87, lng: 151.21 }, tz: 'Australia/Sydney' },
  { name: { en: 'London', zh: '伦敦' }, lat: 51.51, lng: -0.13, timer7: { lat: 51.51, lng: -0.13 }, tz: 'Europe/London' },
  { name: { en: 'New York', zh: '纽约' }, lat: 40.71, lng: -74.01, timer7: { lat: 40.71, lng: -74.01 }, tz: 'America/New_York' },
  { name: { en: 'La Palma', zh: '拉帕尔马' }, lat: 28.76, lng: -17.89, timer7: { lat: 28.76, lng: -17.89 }, tz: 'Atlantic/Canary' },
  { name: { en: 'Mauna Kea', zh: '莫纳克亚' }, lat: 19.82, lng: -155.68, timer7: { lat: 19.82, lng: -155.68 }, tz: 'Pacific/Honolulu' },
];

/** Estimate IANA Etc/GMT timezone from longitude (for manual input). Note: Etc/GMT sign is inverted. */
export function estimateTimezone(lng: number): string {
  const offset = Math.round(lng / 15);
  if (offset === 0) return 'UTC';
  return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
}

/** localStorage key for persisted location */
export const LOCATION_STORAGE_KEY = 'tools-live-data-location';

/** Tool registry — add new tools here */
export const tools: ToolEntry[] = [
  {
    slug: 'live-data',
    icon: 'satellite',
    name: { en: 'Live Data', zh: '实时数据' },
    description: {
      en: 'Real-time satellite tracking, astronomical weather forecasts, and sun & moon information for any location.',
      zh: '实时卫星追踪、天文气象预报以及任意地点的日月信息。',
    },
    searchTerms: 'live data satellite tracking n2yo 7timer weather forecast sun moon sunrise sunset lunar phase 实时数据 卫星追踪 气象预报 日出日落 月相',
    cover: '/images/tools-live-data-cover.png',
  },
];
