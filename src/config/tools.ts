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

/** Compact preset factory — timer7 grid defaults to same lat/lng */
const loc = (en: string, zh: string, lat: number, lng: number, tz: string): ToolLocationPreset => ({
  name: { en, zh }, lat, lng, timer7: { lat, lng }, tz,
});

/** China city presets — provincial capitals + major cities */
export const CHINA_LOCATION_PRESETS: ToolLocationPreset[] = [
  loc('Beijing', '北京', 39.90, 116.40, 'Asia/Shanghai'),
  loc('Shanghai', '上海', 31.23, 121.47, 'Asia/Shanghai'),
  loc('Tianjin', '天津', 39.13, 117.20, 'Asia/Shanghai'),
  loc('Chongqing', '重庆', 29.56, 106.55, 'Asia/Shanghai'),
  loc('Guangzhou', '广州', 23.13, 113.27, 'Asia/Shanghai'),
  loc('Shenzhen', '深圳', 22.54, 114.06, 'Asia/Shanghai'),
  loc('Zhuhai', '珠海', 22.27, 113.58, 'Asia/Shanghai'),
  loc('Zhanjiang', '湛江', 21.27, 110.36, 'Asia/Shanghai'),
  loc('Hangzhou', '杭州', 30.27, 120.15, 'Asia/Shanghai'),
  loc('Ningbo', '宁波', 29.87, 121.54, 'Asia/Shanghai'),
  loc('Nanjing', '南京', 32.06, 118.80, 'Asia/Shanghai'),
  loc('Suzhou', '苏州', 31.30, 120.62, 'Asia/Shanghai'),
  loc('Jinan', '济南', 36.65, 117.00, 'Asia/Shanghai'),
  loc('Qingdao', '青岛', 36.07, 120.38, 'Asia/Shanghai'),
  loc('Wuhan', '武汉', 30.59, 114.31, 'Asia/Shanghai'),
  loc('Chengdu', '成都', 30.67, 104.07, 'Asia/Shanghai'),
  loc("Xi'an", '西安', 34.27, 108.95, 'Asia/Shanghai'),
  loc('Changsha', '长沙', 28.23, 112.94, 'Asia/Shanghai'),
  loc('Zhengzhou', '郑州', 34.75, 113.65, 'Asia/Shanghai'),
  loc('Hefei', '合肥', 31.82, 117.27, 'Asia/Shanghai'),
  loc('Anqing', '安庆', 30.53, 117.06, 'Asia/Shanghai'),
  loc('Nanchang', '南昌', 28.68, 115.86, 'Asia/Shanghai'),
  loc('Fuzhou', '福州', 26.07, 119.30, 'Asia/Shanghai'),
  loc('Xiamen', '厦门', 24.48, 118.09, 'Asia/Shanghai'),
  loc('Taiyuan', '太原', 37.87, 112.55, 'Asia/Shanghai'),
  loc('Shijiazhuang', '石家庄', 38.04, 114.51, 'Asia/Shanghai'),
  loc('Hohhot', '呼和浩特', 40.84, 111.65, 'Asia/Shanghai'),
  loc('Shenyang', '沈阳', 41.80, 123.43, 'Asia/Shanghai'),
  loc('Dalian', '大连', 38.91, 121.60, 'Asia/Shanghai'),
  loc("Changchun", '长春', 43.88, 125.32, 'Asia/Shanghai'),
  loc('Harbin', '哈尔滨', 45.80, 126.53, 'Asia/Shanghai'),
  loc('Urumqi', '乌鲁木齐', 43.83, 87.62, 'Asia/Shanghai'),
  loc('Lhasa', '拉萨', 29.65, 91.13, 'Asia/Shanghai'),
  loc('Lanzhou', '兰州', 36.06, 103.83, 'Asia/Shanghai'),
  loc('Xining', '西宁', 36.62, 101.78, 'Asia/Shanghai'),
  loc('Yinchuan', '银川', 38.49, 106.23, 'Asia/Shanghai'),
  loc('Kunming', '昆明', 25.04, 102.72, 'Asia/Shanghai'),
  loc('Guiyang', '贵阳', 26.65, 106.71, 'Asia/Shanghai'),
  loc('Nanning', '南宁', 22.82, 108.37, 'Asia/Shanghai'),
  loc('Haikou', '海口', 20.04, 110.20, 'Asia/Shanghai'),
  loc('Sanya', '三亚', 18.25, 109.51, 'Asia/Shanghai'),
];

/** International location presets — major cities + observatory sites */
export const INTERNATIONAL_LOCATION_PRESETS: ToolLocationPreset[] = [
  loc('Tokyo', '东京', 35.68, 139.69, 'Asia/Tokyo'),
  loc('Seoul', '首尔', 37.57, 126.98, 'Asia/Seoul'),
  loc('Singapore', '新加坡', 1.35, 103.82, 'Asia/Singapore'),
  loc('Bangkok', '曼谷', 13.76, 100.50, 'Asia/Bangkok'),
  loc('Delhi', '德里', 28.61, 77.21, 'Asia/Kolkata'),
  loc('Dubai', '迪拜', 25.20, 55.27, 'Asia/Dubai'),
  loc('Sydney', '悉尼', -33.87, 151.21, 'Australia/Sydney'),
  loc('London', '伦敦', 51.51, -0.13, 'Europe/London'),
  loc('Paris', '巴黎', 48.86, 2.35, 'Europe/Paris'),
  loc('Berlin', '柏林', 52.52, 13.41, 'Europe/Berlin'),
  loc('Madrid', '马德里', 40.42, -3.70, 'Europe/Madrid'),
  loc('Rome', '罗马', 41.90, 12.50, 'Europe/Rome'),
  loc('Bologna', '博洛尼亚', 44.49, 11.34, 'Europe/Rome'),
  loc('Moscow', '莫斯科', 55.76, 37.62, 'Europe/Moscow'),
  loc('Reykjavik', '雷克雅未克', 64.13, -21.94, 'Atlantic/Reykjavik'),
  loc('New York', '纽约', 40.71, -74.01, 'America/New_York'),
  loc('Toronto', '多伦多', 43.65, -79.38, 'America/Toronto'),
  loc('Los Angeles', '洛杉矶', 34.05, -118.24, 'America/Los_Angeles'),
  loc('San Francisco', '旧金山', 37.77, -122.42, 'America/Los_Angeles'),
  loc('Santiago', '圣地亚哥', -33.45, -70.67, 'America/Santiago'),
  loc('Cape Town', '开普敦', -33.92, 18.42, 'Africa/Johannesburg'),
  loc('Cairo', '开罗', 30.04, 31.24, 'Africa/Cairo'),
  loc('La Palma', '拉帕尔马', 28.76, -17.89, 'Atlantic/Canary'),
  loc('Mauna Kea', '莫纳克亚', 19.82, -155.68, 'Pacific/Honolulu'),
];

/** All predefined location presets (combined, for backward compatibility) */
export const LOCATION_PRESETS: ToolLocationPreset[] = [...CHINA_LOCATION_PRESETS, ...INTERNATIONAL_LOCATION_PRESETS];

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
