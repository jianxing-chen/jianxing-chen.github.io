import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CHINA_LOCATION_PRESETS,
  INTERNATIONAL_LOCATION_PRESETS,
  DEFAULT_TOOL_LOCATION,
  LOCATION_STORAGE_KEY,
  estimateTimezone,
  type ToolLocationPreset,
} from '@/config/tools';

interface Props {
  lang: string;
}

// ── 生肖中英文映射表 ──
const SHENGXIAO_EN: Record<string, string> = {
  '鼠': 'Rat', '牛': 'Ox', '虎': 'Tiger', '兔': 'Rabbit', '龙': 'Dragon',
  '蛇': 'Snake', '马': 'Horse', '羊': 'Goat', '猴': 'Monkey', '鸡': 'Rooster',
  '狗': 'Dog', '猪': 'Pig',
};
const JIEQI_EN: Record<string, string> = {
  '立春': 'Beginning of Spring', '雨水': 'Rain Water', '惊蛰': 'Awakening of Insects',
  '春分': 'Spring Equinox', '清明': 'Pure Brightness', '谷雨': 'Grain Rain',
  '立夏': 'Beginning of Summer', '小满': 'Grain Buds', '芒种': 'Grain in Ear',
  '夏至': 'Summer Solstice', '小暑': 'Minor Heat', '大暑': 'Major Heat',
  '立秋': 'Beginning of Autumn', '处暑': 'End of Heat', '白露': 'White Dew',
  '秋分': 'Autumn Equinox', '寒露': 'Cold Dew', '霜降': "Frost's Descent",
  '立冬': 'Beginning of Winter', '小雪': 'Minor Snow', '大雪': 'Major Snow',
  '冬至': 'Winter Solstice', '小寒': 'Minor Cold', '大寒': 'Major Cold',
};
const MP_ZH = ['朔', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
const MP_EN = ['New', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

/** Compute a human-readable UTC offset string for a given IANA timezone (e.g. "UTC+8", "UTC-5") */
function getUtcOffset(tz: string): string {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'longOffset',
    }).formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
    const match = tzPart.match(/GMT([+-])0?(\d{1,2})(?::\d{2})?/);
    if (!match) return tzPart.includes('GMT') ? 'UTC' : tz;
    return `UTC${match[1]}${match[2]}`;
  } catch {
    return tz;
  }
}

/** Map WMO weather codes (Open-Meteo) to emoji icons */
const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};
function getWeatherEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌤️';
}

/** Convert wind direction degrees to compass direction string */
function windDirCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** WMO weather code short descriptions (en, zh) */
const WMO_DESC: Record<number, [string, string]> = {
  0: ['Clear sky', '晴'], 1: ['Mainly clear', '晴间多云'], 2: ['Partly cloudy', '多云'], 3: ['Overcast', '阴'],
  45: ['Fog', '雾'], 48: ['Rime fog', '雾凇'],
  51: ['Light drizzle', '小毛毛雨'], 53: ['Drizzle', '毛毛雨'], 55: ['Dense drizzle', '密毛毛雨'],
  56: ['Freezing drizzle', '冻毛毛雨'], 57: ['Freezing drizzle', '冻毛毛雨'],
  61: ['Light rain', '小雨'], 63: ['Rain', '中雨'], 65: ['Heavy rain', '大雨'],
  66: ['Freezing rain', '冻雨'], 67: ['Freezing rain', '冻雨'],
  71: ['Light snow', '小雪'], 73: ['Snow', '中雪'], 75: ['Heavy snow', '大雪'], 77: ['Snow grains', '雪粒'],
  80: ['Light showers', '小阵雨'], 81: ['Showers', '阵雨'], 82: ['Violent showers', '暴雨'],
  85: ['Snow showers', '阵雪'], 86: ['Heavy snow showers', '大阵雪'],
  95: ['Thunderstorm', '雷暴'], 96: ['Thunderstorm + hail', '雷暴+冰雹'], 99: ['Severe thunderstorm', '强雷暴'],
};
function getWeatherDesc(code: number, isZh: boolean): string {
  const d = WMO_DESC[code];
  return d ? d[isZh ? 1 : 0] : '';
}

function loadSavedLocation(): ToolLocationPreset | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!saved) return null;
    const loc = JSON.parse(saved) as ToolLocationPreset;
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      // Backward compat: old saves may lack tz field
      if (!loc.tz) loc.tz = estimateTimezone(loc.lng);
      return loc;
    }
  } catch { /* ignore */ }
  return null;
}

function saveLocation(loc: ToolLocationPreset) {
  try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
}

export default function LiveData({ lang }: Props) {
  const isZh = lang === 'zh';

  const [location, setLocation] = useState<ToolLocationPreset>(() =>
    loadSavedLocation() || DEFAULT_TOOL_LOCATION
  );
  const [manualLat, setManualLat] = useState(location.lat.toString());
  const [manualLng, setManualLng] = useState(location.lng.toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: number; name: string; latitude: number; longitude: number;
    country?: string; admin1?: string; timezone?: string; feature_code?: string;
  }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const n2yoRef = useRef<HTMLDivElement>(null);
  const n2yoLoaded = useRef(false);

  // ── Weather state (Open-Meteo) ──
  const [weather, setWeather] = useState<{
    temp: number; feelsLike: number; humidity: number;
    windSpeed: number; windDir: string; uvIndex: number;
    visibility: number; pressure: number;
    dewPoint: number; cloudCover: number; windGusts: number; precipitation: number;
    desc: string; code: number;
    forecast: { date: string; maxTemp: number; minTemp: number; code: number; rainChance: number }[];
    yesterday: { maxTemp: number; minTemp: number; code: number; precipitation: number } | null;
  } | null>(null);

  // ── Air Quality state (Open-Meteo AQ API) ──
  const [aqi, setAqi] = useState<{
    index: number; pm25: number; pm10: number;
    o3: number; no2: number; so2: number; co: number;
  } | null>(null);

  // ── Sun & Moon Position state (SunCalc) ──
  const [sunPos, setSunPos] = useState<{ alt: number; az: number; dayProg: number; maxAlt: number; moonAlt: number; moonProg: number; moonMaxAlt: number } | null>(null);

  // ── Glow forecast state (sunrise/sunset glow prediction) ──
  const [glowForecast, setGlowForecast] = useState<Array<{
    date: string;
    sunrise: { time: string; score: number } | null;
    sunset: { time: string; score: number } | null;
  }>>([]);

  // ── Location change handler ──
  const selectLocation = useCallback((loc: ToolLocationPreset) => {
    setLocation(loc);
    saveLocation(loc);
    setManualLat(loc.lat.toString());
    setManualLng(loc.lng.toString());
  }, []);

  const handleManualSave = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    const loc: ToolLocationPreset = {
      name: { en: `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`, zh: `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E` },
      lat, lng,
      timer7: { lat, lng },
      tz: estimateTimezone(lng),
    };
    selectLocation(loc);
  }, [manualLat, manualLng, selectLocation]);

  const resetToDefault = useCallback(() => {
    selectLocation(DEFAULT_TOOL_LOCATION);
    setManualLat(DEFAULT_TOOL_LOCATION.lat.toString());
    setManualLng(DEFAULT_TOOL_LOCATION.lng.toString());
  }, [selectLocation]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); setSearchError(null); setSearchDone(false); return; }
    setSearchLoading(true);
    setSearchError(null);
    setSearchDone(false);
    try {
      // Auto-detect CJK characters to pick the right API language
      const hasCJK = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(query);
      const apiLang = hasCJK ? 'zh' : (isZh ? 'zh' : 'en');

      // For CJK queries without admin suffix, also try with 市 appended
      // e.g. 安庆 → also search 安庆市 to find the real city
      const needsCitySuffix = hasCJK && !/[市区县省]$/.test(query.trim());
      const queries = needsCitySuffix ? [query, query.trim() + '市'] : [query];

      const responses = await Promise.all(
        queries.map(q =>
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=${apiLang}`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
        )
      );

      // Merge, deduplicate by id, sort by city-level feature codes first
      const featurePriority: Record<string, number> = {
        PPLC: 0, PPLA: 1, PPLA2: 2, PPLA4: 3, PPL: 4,
      };
      const merged = new Map<number, any>();
      for (const data of responses) {
        for (const r of (data.results || [])) {
          if (!merged.has(r.id)) merged.set(r.id, r);
        }
      }
      const results = Array.from(merged.values())
        .sort((a, b) => (featurePriority[a.feature_code] ?? 5) - (featurePriority[b.feature_code] ?? 5))
        .slice(0, 8);

      setSearchResults(results);
      setSearchDone(true);
    } catch (err) {
      setSearchResults([]);
      setSearchError(err instanceof Error ? err.message : 'Unknown error');
      setSearchDone(false);
    } finally {
      setSearchLoading(false);
    }
  }, [isZh]);

  const applySearchResult = useCallback((r: { name: string; latitude: number; longitude: number; timezone?: string }) => {
    setManualLng(r.longitude.toString());
    setManualLat(r.latitude.toString());
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSearchDone(false);
  }, []);

  // ── N2YO Widget loader ──
  useEffect(() => {
    if (!n2yoRef.current || n2yoLoaded.current) return;
    n2yoLoaded.current = true;

    const wrapper = n2yoRef.current;
    (window as any).norad_n2yo = '48274|CSS,25544|ISS,20580|HST';
    (window as any).size_n2yo = 'small';
    (window as any).allpasses_n2yo = '0';
    (window as any).map_n2yo = '4';

    const origWrite = document.write.bind(document);
    document.write = function (...args: any[]) {
      wrapper.insertAdjacentHTML('beforeend', args.join(''));
      return undefined as any;
    };

    const s = document.createElement('script');
    s.src = 'https://www.n2yo.com/js/widget-tracker.js';
    s.onload = s.onerror = () => { document.write = origWrite; };
    document.body.appendChild(s);
  }, []);

  // ── Weather data fetching (Open-Meteo) ──
  useEffect(() => {
    const lat = location.lat;
    const lng = location.lng;
    const cacheKey = `weather-om-${lat.toFixed(2)}-${lng.toFixed(2)}`;

    async function fetchWeather() {
      try {
        // Current weather + 3-day forecast
        const fUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,uv_index,dew_point_2m,cloud_cover,wind_gusts_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,visibility,precipitation,precipitation_probability,weather_code&timezone=auto&forecast_days=3&forecast_hours=72`;
        const fRes = await fetch(fUrl);
        const fData = await fRes.json();
        if (!fData?.current || !fData?.daily?.time?.length) return;

        const c = fData.current;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yDate = yesterday.toISOString().split('T')[0];

        setWeather({
          temp: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          windDir: windDirCompass(c.wind_direction_10m),
          uvIndex: Math.round(c.uv_index),
          visibility: Math.round(c.visibility / 1000),
          pressure: Math.round(c.surface_pressure),
          dewPoint: Math.round(c.dew_point_2m),
          cloudCover: Math.round(c.cloud_cover),
          windGusts: Math.round(c.wind_gusts_10m),
          precipitation: c.precipitation || 0,
          desc: '',
          code: c.weather_code,
          forecast: fData.daily.time.map((date: string, i: number) => ({
            date,
            maxTemp: Math.round(fData.daily.temperature_2m_max[i]),
            minTemp: Math.round(fData.daily.temperature_2m_min[i]),
            code: fData.daily.weather_code[i],
            rainChance: fData.daily.precipitation_probability_max?.[i] || 0,
          })),
          yesterday: null,
        });

        // ── Glow forecast computation (cloud layers + SunCalc sunrise/sunset) ──
        if (fData?.hourly?.time?.length) {
          const h = fData.hourly;
          const aqiIdx = aqi ? aqi.index : 50; // fallback if AQI not yet loaded

          // Open-Meteo hourly.time strings are LOCAL wall-clock times with no offset
          // suffix (e.g. "2026-06-29T06:00"). Parsing with `new Date(str)` would
          // interpret them in the *browser's* timezone, misaligning them from
          // SunCalc's UTC Date objects. Convert each to a true UTC moment using the
          // response's utc_offset_seconds so both reference frames agree.
          //   parsed = wallclock - browser_offset_east
          //   location_utc = wallclock - location_offset_east
          //   => location_utc = parsed + browser_offset_east - location_offset_east
          // where *_offset_east is positive east of UTC:
          //   browser_offset_east = -getTimezoneOffset()*60  (getTimezoneOffset is UTC-local)
          //   location_offset_east = utc_offset_seconds (POSIX convention, e.g. NY=-14400, Beijing=+28800)
          const tzOffsetSec = (fData.utc_offset_seconds as number) || 0;
          const browserOffsetEastMs = -new Date().getTimezoneOffset() * 60000;
          const toUtc = (s: string): Date => {
            const local = new Date(s); // parsed as browser-local → stored as UTC
            return new Date(local.getTime() + browserOffsetEastMs - tzOffsetSec * 1000);
          };
          const hourUtc = (h.time as string[]).map(toUtc);

          // Find the hourly index whose UTC instant is closest to `target` (a UTC Date).
          const findIdx = (target: Date): number => {
            const t = target.getTime();
            let bestIdx = 0, bestDiff = Infinity;
            for (let i = 0; i < hourUtc.length; i++) {
              const diff = Math.abs(hourUtc[i].getTime() - t);
              if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
            }
            return bestIdx;
          };

          import('suncalc').then((SC: any) => {
            const predictions: Array<{ date: string; sunrise: { time: string; score: number } | null; sunset: { time: string; score: number } | null }> = [];

            for (let d = 0; d < Math.min(fData.daily.time.length, 3); d++) {
              const dateStr = fData.daily.time[d];
              // Build the day's local noon as a true UTC Date (same conversion).
              const dayDate = toUtc(dateStr + 'T12:00:00');
              const times = SC.getTimes(dayDate, lat, lng);

              // Weighted multi-point sampling across the glow "golden window".
              // Samples closer to peak glow carry more weight so a transient
              // cloud hole far from the peak doesn't dominate. Returns weighted
              // averages of the relevant hourly fields.
              const sampleWindow = (peak: Date, offsetsMin: number[], weights: number[]) => {
                let wSum = 0;
                const acc: Record<string, number> = { cLow: 0, cMid: 0, cHigh: 0, hum: 0, vis: 0, precip: 0, precipProb: 0 };
                for (let k = 0; k < offsetsMin.length; k++) {
                  const t = new Date(peak.getTime() + offsetsMin[k] * 60000);
                  if (t.getTime() < hourUtc[0].getTime() || t.getTime() > hourUtc[hourUtc.length - 1].getTime()) continue;
                  const idx = findIdx(t);
                  const w = weights[k];
                  wSum += w;
                  acc.cLow += (h.cloud_cover_low?.[idx] ?? 0) * w;
                  acc.cMid += (h.cloud_cover_mid?.[idx] ?? 0) * w;
                  acc.cHigh += (h.cloud_cover_high?.[idx] ?? 0) * w;
                  acc.hum += (h.relative_humidity_2m?.[idx] ?? 50) * w;
                  acc.vis += (h.visibility?.[idx] ?? 10000) * w;
                  acc.precip += (h.precipitation?.[idx] ?? 0) * w;
                  acc.precipProb += (h.precipitation_probability?.[idx] ?? 0) * w;
                }
                if (wSum === 0) return null;
                for (const key of Object.keys(acc)) acc[key] /= wSum;
                return acc;
              };

              const computeGlow = (sunTime: Date | undefined, isSunrise: boolean): { time: string; score: number } | null => {
                if (!sunTime || isNaN(sunTime.getTime())) return null;

                // Golden window offsets (minutes relative to sunrise/sunset), peak-weighted.
                // Sunrise glow builds before sunrise; sunset glow peaks after sunset.
                const offsets = isSunrise
                  ? [-60, -30, 0, 20]
                  : [-30, 0, 20, 45];
                const weights = [0.2, 0.3, 0.3, 0.2];
                const win = sampleWindow(sunTime, offsets, weights);
                if (!win) return null;

                const cLow = win.cLow, cMid = win.cMid, cHigh = win.cHigh;
                const hum = win.hum, visKm = win.vis / 1000;
                const precipNow = win.precip;

                let score = 0;

                // High cloud cHigh (25 pts) — cirrus ice clouds are the best glow canvas.
                // Ideal 20–60%, peak ~40%.
                const cloudPts = (cover: number, lo: number, hi: number, peak: number, max: number) => {
                  if (cover >= lo && cover <= hi) return max * (1 - Math.abs(cover - peak) / ((hi - lo) / 2) * 0.25);
                  if (cover >= lo * 0.5 && cover <= hi + 20) return max * 0.4 * (1 - Math.abs(cover - peak) / (hi - lo) * 0.5);
                  return Math.max(0, max * 0.1);
                };
                score += cloudPts(cHigh, 20, 60, 40, 25);

                // Mid cloud cMid (15 pts) — altostratus, secondary canvas. Ideal 25–55%.
                score += cloudPts(cMid, 25, 55, 40, 15);

                // Low cloud cLow (20 pts) — clear horizon is essential. Smooth decay.
                if (cLow < 15) score += 20 - (cLow / 15) * 2;
                else if (cLow < 40) score += 18 - ((cLow - 15) / 25) * 13;
                else if (cLow < 70) score += 5 - ((cLow - 40) / 30) * 5;
                else score += 0;

                // Visibility (15 pts) — higher is better, full mark at >=20km.
                if (visKm >= 20) score += 15;
                else if (visKm >= 10) score += 5 + (visKm - 10) / 10 * 10;
                else score += Math.max(0, visKm / 10 * 5);

                // Humidity (10 pts) — 40–70% ideal; >85% (fog) decays fast.
                if (hum >= 40 && hum <= 70) score += 10;
                else if (hum < 40) score += 4 + (hum / 40) * 6;
                else if (hum <= 85) score += 10 - ((hum - 70) / 15) * 6;
                else score += Math.max(1, 4 - ((hum - 85) / 15) * 3);

                // Precipitation context (10 pts) — clearing rain (post-frontal) boosts glow.
                if (precipNow > 1) {
                  score += 0; // heavy rain ongoing → clouds pressing the horizon
                } else {
                  // Look back ~3h for recent rain that has cleared.
                  const peakIdx = findIdx(sunTime);
                  let recentRain = 0;
                  for (let j = Math.max(0, peakIdx - 3); j < peakIdx; j++) {
                    recentRain += h.precipitation?.[j] ?? 0;
                  }
                  if (recentRain > 0.5) score += 7 + Math.min(3, recentRain); // clearing storm glow
                  else if (win.precipProb > 40) score += 3; // unstable, some chance
                  else score += 5; // stable clear-ish
                }

                // AQI (5 pts) — current value as an auxiliary factor (not time-matched to future days).
                if (aqiIdx < 30) score += 5;
                else if (aqiIdx < 50) score += 4;
                else if (aqiIdx < 100) score += 2.5;
                else score += 1;

                // Display the sunrise/sunset time in the *location's* timezone,
                // consistent with the rest of the card (not the browser timezone).
                const hhmm = new Intl.DateTimeFormat('en-GB', {
                  timeZone: location.tz, hour: '2-digit', minute: '2-digit', hour12: false,
                }).format(sunTime);
                return { time: hhmm, score: Math.round(Math.min(100, Math.max(0, score))) };
              };

              predictions.push({
                date: dateStr,
                sunrise: computeGlow(times.sunrise, true),
                sunset: computeGlow(times.sunset, false),
              });
            }

            setGlowForecast(predictions);
          }).catch(() => {});
        }

        // Fetch yesterday's weather from archive
        const aUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${yDate}&end_date=${yDate}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto`;
        const aRes = await fetch(aUrl);
        const aData = await aRes.json();
        if (aData?.daily?.time?.length) {
          setWeather(prev => prev ? {
            ...prev,
            yesterday: {
              maxTemp: Math.round(aData.daily.temperature_2m_max[0]),
              minTemp: Math.round(aData.daily.temperature_2m_min[0]),
              code: aData.daily.weather_code[0],
              precipitation: aData.daily.precipitation_sum[0] || 0,
            },
          } : prev);
        }
      } catch { /* ignore */ }
    }

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (Date.now() - obj.ts < 1800000) {
          fetchWeather(); // still refresh, but show cached first
          return;
        }
      } catch { /* ignore */ }
    }

    fetchWeather().then(() => {
      sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now() }));
    });

    const interval = setInterval(() => {
      fetchWeather().then(() => {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now() }));
      });
    }, 1800000);

    return () => clearInterval(interval);
  }, [location.lat, location.lng]);

  // ── Air Quality fetch (Open-Meteo AQ API) ──
  useEffect(() => {
    const lat = location.lat;
    const lng = location.lng;
    const cacheKey = `aqi-${lat.toFixed(2)}-${lng.toFixed(2)}`;

    async function fetchAqi() {
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data?.current) return;
        const c = data.current;
        setAqi({
          index: c.us_aqi ?? 0,
          pm25: c.pm2_5 ?? 0,
          pm10: c.pm10 ?? 0,
          o3: c.ozone ?? 0,
          no2: c.nitrogen_dioxide ?? 0,
          so2: c.sulphur_dioxide ?? 0,
          co: c.carbon_monoxide ?? 0,
        });
      } catch { /* ignore */ }
    }

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (Date.now() - obj.ts < 1800000) {
          fetchAqi();
          return;
        }
      } catch { /* ignore */ }
    }

    fetchAqi().then(() => {
      sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now() }));
    });
    const interval = setInterval(() => {
      fetchAqi().then(() => {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now() }));
      });
    }, 1800000);
    return () => clearInterval(interval);
  }, [location.lat, location.lng]);

  // ── Sun position (SunCalc) ──
  useEffect(() => {
    const lat = location.lat;
    const lng = location.lng;

    function compute() {
      import('suncalc').then((SC: any) => {
        const now = new Date();
        const pos = SC.getPosition(now, lat, lng);
        const times = SC.getTimes(now, lat, lng);
        const altDeg = pos.altitude;
        const azDeg = (pos.azimuth + 360) % 360;
        let dayProg = 0.5;
        if (times.sunrise && times.sunset) {
          const sr = times.sunrise.getTime();
          const ss = times.sunset.getTime();
          const nt = now.getTime();
          if (ss > sr) dayProg = Math.max(0, Math.min(1, (nt - sr) / (ss - sr)));
        }
        // Max altitude at solar noon
        let maxAlt = 45;
        if (times.solarNoon) {
          const noonPos = SC.getPosition(times.solarNoon, lat, lng);
          maxAlt = noonPos.altitude;
        }
        // Moon position
        const moonPos = SC.getMoonPosition(now, lat, lng);
        const moonAlt = moonPos.altitude;
        const moonTimes = SC.getMoonTimes(now, lat, lng);
        let moonProg = 0.5;
        let moonMaxAlt = 45;
        if (moonTimes.rise && moonTimes.set) {
          const mr = moonTimes.rise.getTime();
          const ms = moonTimes.set.getTime();
          const nt = now.getTime();
          if (ms > mr) {
            moonProg = Math.max(0, Math.min(1, (nt - mr) / (ms - mr)));
            const midTime = new Date((mr + ms) / 2);
            moonMaxAlt = SC.getMoonPosition(midTime, lat, lng).altitude;
          } else if (nt < ms) {
            moonProg = Math.max(0, Math.min(1, (nt + 86400000 - mr) / (ms + 86400000 - mr)));
            const midTime = new Date((mr + ms + 86400000) / 2);
            moonMaxAlt = SC.getMoonPosition(midTime, lat, lng).altitude;
          }
        } else if (moonTimes.alwaysUp) {
          moonProg = 0.5;
          moonMaxAlt = SC.getMoonPosition(now, lat, lng).altitude;
        } else {
          moonProg = -1; // moon never rises today
        }
        setSunPos({ alt: altDeg, az: azDeg, dayProg, maxAlt, moonAlt, moonProg, moonMaxAlt });
      }).catch(() => {});
    }

    compute();
    const interval = setInterval(compute, 300_000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [location.lat, location.lng]);

  // ── Sun & Moon card data fetching ──
  useEffect(() => {
    const lat = location.lat;
    const lng = location.lng;
    const cacheKey = `sun-v3-${lat}-${lng}-${new Date().toDateString()}`;

    const tz = location.tz;
    function fmt(t: string | number) {
      if (!t) return '--:--';
      const d = new Date(typeof t === 'string' ? t : t);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(d);
    }
    function fmtMoon(t: any) {
      if (!t) return '--:--';
      const d = new Date(t);
      const hhmm = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(d);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, month: 'numeric', day: 'numeric',
      }).formatToParts(d);
      const month = parts.find(p => p.type === 'month')?.value || '1';
      const day = parts.find(p => p.type === 'day')?.value || '1';
      if (isZh) return `${month}月${day}日 ${hhmm}`;
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[+month]} ${day} ${hhmm}`;
    }

    function displaySun(d: any) {
      if (!d) return;
      const el = (id: string) => document.getElementById(id);
      el('ld-sun-rise')!.textContent = fmt(d.sunrise);
      el('ld-sun-set')!.textContent = fmt(d.sunset);
      const daySec = d.day_length || 0;
      el('ld-sun-noon')!.textContent = fmt(d.solar_noon) + ' · ' + Math.floor(daySec / 3600) + 'h ' + Math.floor((daySec % 3600) / 60) + 'm';
      el('ld-sun-civil')!.textContent = fmt(d.civil_twilight_begin) + ' → ' + fmt(d.civil_twilight_end);
      el('ld-sun-naut')!.textContent = fmt(d.nautical_twilight_begin) + ' → ' + fmt(d.nautical_twilight_end);
      el('ld-sun-astro')!.textContent = fmt(d.astronomical_twilight_begin) + ' → ' + fmt(d.astronomical_twilight_end);
      const now = new Date();
      el('ld-date')!.textContent = isZh
        ? new Intl.DateTimeFormat('zh-CN', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' }).format(now)
        : new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    }

    // Sunrise-sunset API
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) displaySun(JSON.parse(cached));
    fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`)
      .then(r => r.json())
      .then(d => { if (d.status === 'OK') { sessionStorage.setItem(cacheKey, JSON.stringify(d.results)); displaySun(d.results); } })
      .catch(() => {});

    // Lunar calendar (lunar-javascript)
    import('lunar-javascript').then((m: any) => {
      const Lunar = m.Lunar || (m.default && m.default.Lunar) || m.default;
      if (!Lunar) return;
      const el = document.getElementById('ld-lunar');
      if (!el) return;
      // Build a Date whose local components match the location's current date
      const now = new Date();
      const dateParts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(now);
      const y = +(dateParts.find(p => p.type === 'year')?.value || '2026');
      const mo = +(dateParts.find(p => p.type === 'month')?.value || '1');
      const da = +(dateParts.find(p => p.type === 'day')?.value || '1');
      const localDate = new Date(y, mo - 1, da);
      const lunar = Lunar.fromDate(localDate);
      if (isZh) {
        el.textContent = lunar.getYearInGanZhi() + '年' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese();
      } else {
        const mNum = lunar.getMonth();
        const isLeap = mNum < 0;
        const sx = SHENGXIAO_EN[lunar.getYearShengXiao()] || lunar.getYearShengXiao();
        el.textContent = sx + ' · ' + (isLeap ? 'Leap ' : '') + 'M' + Math.abs(mNum) + ' D' + lunar.getDay();
      }
      // 节气
      const jqEl = document.getElementById('ld-jieqi');
      if (jqEl) {
        const next = lunar.getNextJieQi();
        if (next) {
          const ns = next.getSolar();
          const nextDate = new Date(ns.getYear(), ns.getMonth() - 1, ns.getDay());
          const today = new Date(y, mo - 1, da);
          const days = Math.round((nextDate.getTime() - today.getTime()) / 86400000);
          const jqNameZh = next.getName();
          const jqName = isZh ? jqNameZh : (JIEQI_EN[jqNameZh] || jqNameZh);
          jqEl.textContent = days === 0
            ? (isZh ? '今日 ' + jqName : 'Today: ' + jqName)
            : (isZh ? '距' + jqName + ' ' + days + '天' : jqName + ' in ' + days + 'd');
        }
      }
    }).catch(() => {});

    // Moon data (SunCalc)
    import('suncalc').then((SunCalc: any) => {
      function updateMoon() {
        const now = new Date();
        const times = SunCalc.getMoonTimes(now, lat, lng);
        const illum = SunCalc.getMoonIllumination(now);
        const phaseIdx = Math.round(illum.phase * 8) % 8;
        const el = (id: string) => document.getElementById(id);
        if (!times.alwaysUp) {
          el('ld-moon-rise')!.textContent = fmtMoon(times.rise);
        } else {
          el('ld-moon-rise')!.textContent = isZh ? '不落' : 'Up all day';
        }
        if (!times.alwaysDown) {
          el('ld-moon-set')!.textContent = fmtMoon(times.set);
        } else {
          el('ld-moon-set')!.textContent = isZh ? '不升' : 'None';
        }
        el('ld-moon-phase')!.textContent = isZh ? MP_ZH[phaseIdx] : MP_EN[phaseIdx];
        el('ld-moon-illum')!.textContent = (illum.fraction * 100).toFixed(1);
      }
      updateMoon();
      const interval = setInterval(updateMoon, 3_600_000);
      return () => clearInterval(interval);
    }).catch(() => {});
  }, [location, isZh]);

  const locName = location.name[isZh ? 'zh' : 'en'];

  // ── Observation condition score (0-100) ──
  const obsScore = (() => {
    if (!weather) return null;
    let score = 0;
    // Cloud cover (35 pts) — lower is better
    const cc = weather.cloudCover;
    score += cc <= 5 ? 35 : cc <= 15 ? 30 : cc <= 30 ? 24 : Math.max(0, 35 - (cc / 100) * 35);
    // Humidity (20 pts) — lower is better
    const rh = weather.humidity;
    score += rh <= 30 ? 20 : rh <= 60 ? 20 - ((rh - 30) / 30) * 8 : Math.max(0, 12 - ((rh - 60) / 40) * 12);
    // Visibility (20 pts) — higher is better
    score += Math.min(weather.visibility, 25) / 25 * 20;
    // AQI (15 pts) — lower is better
    if (aqi) score += Math.max(0, 15 - (aqi.index / 150) * 15);
    else score += 8;
    // Wind (5 pts) — lower is better
    score += Math.max(0, 5 - (weather.windSpeed / 40) * 5);
    // Precipitation (5 pts) — none is ideal
    score += weather.precipitation === 0 ? 5 : 0;
    return Math.round(Math.min(100, Math.max(0, score)));
  })();

  return (
    <div>
      {/* ── Location Selector (fixed in left margin on xl+) ── */}
      <div className="mb-8 xl:mb-0 xl:fixed xl:left-[calc(50%_-_38.5rem)] xl:top-32 xl:w-40 xl:z-10">
        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-3">
          {isZh ? '选择地点' : 'Select Location'}
        </h3>
        <div className="space-y-2 mb-3">
          <select
            value={CHINA_LOCATION_PRESETS.find(p => p.name.en === location.name.en)?.name.en ?? ''}
            onChange={(e) => {
              const preset = CHINA_LOCATION_PRESETS.find(p => p.name.en === e.target.value);
              if (preset) selectLocation(preset);
            }}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200/80 dark:border-white/[0.08]
                       bg-white/50 dark:bg-white/[0.03] text-text-light dark:text-text-dark
                       cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-light/30 dark:focus:ring-primary-dark/30"
          >
            <option value="" disabled>{isZh ? '中国城市' : 'China Cities'}</option>
            {CHINA_LOCATION_PRESETS.map(preset => (
              <option key={preset.name.en} value={preset.name.en}>
                {preset.name[isZh ? 'zh' : 'en']} ({getUtcOffset(preset.tz)})
              </option>
            ))}
          </select>
          <select
            value={INTERNATIONAL_LOCATION_PRESETS.find(p => p.name.en === location.name.en)?.name.en ?? ''}
            onChange={(e) => {
              const preset = INTERNATIONAL_LOCATION_PRESETS.find(p => p.name.en === e.target.value);
              if (preset) selectLocation(preset);
            }}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200/80 dark:border-white/[0.08]
                       bg-white/50 dark:bg-white/[0.03] text-text-light dark:text-text-dark
                       cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-light/30 dark:focus:ring-primary-dark/30"
          >
            <option value="" disabled>{isZh ? '国际城市' : 'International Cities'}</option>
            {INTERNATIONAL_LOCATION_PRESETS.map(preset => (
              <option key={preset.name.en} value={preset.name.en}>
                {preset.name[isZh ? 'zh' : 'en']} ({getUtcOffset(preset.tz)})
              </option>
            ))}
          </select>
        </div>

          {/* Location search */}
          <div className="mb-3">
            <div className="flex gap-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchQuery); }}
                placeholder={isZh ? '搜索地名' : 'Search place'}
                className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/10
                           bg-white dark:bg-white/5 text-text-light dark:text-text-dark
                           focus:outline-none focus:ring-1 focus:ring-primary-light/30 dark:focus:ring-primary-dark/30"
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/10
                           bg-white/50 dark:bg-white/[0.03] text-text-light/70 dark:text-text-dark/70
                           hover:text-text-light dark:hover:text-text-dark
                           hover:border-primary-light/20 dark:hover:border-primary-dark/20
                           transition-all cursor-pointer flex-shrink-0"
              >
                🔍
              </button>
            </div>
            {searchLoading && (
              <p className="text-xs text-text-light/40 dark:text-text-dark/40 mt-1">{isZh ? '搜索中…' : 'Searching…'}</p>
            )}
            {!searchLoading && searchError && (
              <p className="text-xs text-rose-500/70 dark:text-rose-400/70 mt-1">
                {isZh ? '⚠ 无法连接搜索服务，请检查网络后重试' : '⚠ Search service unavailable, check your network'}
              </p>
            )}
            {!searchLoading && !searchError && searchDone && searchResults.length === 0 && (
              <p className="text-xs text-text-light/40 dark:text-text-dark/40 mt-1">
                {isZh ? '未找到匹配地点' : 'No matching places found'}
              </p>
            )}
            {searchResults.length > 0 && (
              <ul className="mt-1 space-y-1">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => applySearchResult(r)}
                      className="w-full text-left px-2 py-1 text-xs rounded-md border border-slate-200/80 dark:border-white/[0.08]
                                 bg-white/50 dark:bg-white/[0.03] hover:border-primary-light/20 dark:hover:border-primary-dark/20
                                 text-text-light/70 dark:text-text-dark/70 hover:text-text-light dark:hover:text-text-dark
                                 cursor-pointer transition-all"
                    >
                      {r.name}
                      {r.admin1 && <span className="opacity-50">, {r.admin1}</span>}
                      {r.country && <span className="opacity-50">, {r.country}</span>}
                      <span className="opacity-40 ml-1">{r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap xl:flex-col items-end xl:items-stretch gap-3 p-4 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.02]">
              <div>
                <label className="block text-xs text-text-light/50 dark:text-text-dark/50 mb-1">
                  {isZh ? '经度' : 'Longitude'} (-180 ~ 180)
                </label>
                <input
                  type="number"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  step="0.01"
                  min="-180"
                  max="180"
                  className="w-28 px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/10
                             bg-white dark:bg-white/5 text-text-light dark:text-text-dark
                             focus:outline-none focus:ring-1 focus:ring-primary-light/30 dark:focus:ring-primary-dark/30"
                />
              </div>
              <div>
                <label className="block text-xs text-text-light/50 dark:text-text-dark/50 mb-1">
                  {isZh ? '纬度' : 'Latitude'} (-90 ~ 90)
                </label>
                <input
                  type="number"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  step="0.01"
                  min="-90"
                  max="90"
                  className="w-28 px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/10
                             bg-white dark:bg-white/5 text-text-light dark:text-text-dark
                             focus:outline-none focus:ring-1 focus:ring-primary-light/30 dark:focus:ring-primary-dark/30"
                />
              </div>
              <button
                onClick={handleManualSave}
                className="px-4 py-1.5 text-sm rounded-md bg-primary-light text-white dark:bg-primary-dark
                           hover:opacity-90 transition-opacity cursor-pointer"
              >
                {isZh ? '保存' : 'Save'}
              </button>
              <button
                onClick={resetToDefault}
                className="px-4 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/10
                           text-text-light/60 dark:text-text-dark/60
                           hover:text-text-light dark:hover:text-text-dark transition-colors cursor-pointer"
              >
                {isZh ? '重置' : 'Reset'}
              </button>
            </div>
        </div>

      {/* ── Live Data Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Windy + Sun Position + Glow Forecast + N2YO */}
        <div className="space-y-6">
          {/* Windy Weather Map */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-2 tracking-wide uppercase text-center">
              {locName} · {isZh ? '实时气象' : 'Live Weather'} · Windy
            </p>
            <iframe
              key={`windy-${location.lat}-${location.lng}`}
              src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=m/s&zoom=5&overlay=wind&product=ecmwf&level=surface&lat=${location.lat}&lon=${location.lng}&detailLat=${location.lat}&detailLon=${location.lng}&detail=true&message=true`}
              width="100%"
              height="450"
              frameBorder="0"
              className="rounded-lg"
              loading="lazy"
              title="Windy weather map"
            />
          </div>

          {/* Sun Position Diagram */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-1.5 tracking-wide uppercase text-center">
              {locName} · {isZh ? '太阳位置' : 'Sun Position'} · SunCalc
            </p>
            <div className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-4">
              {sunPos ? (() => {
                const W = 300, H = 155;
                const horY = 82, padX = 28;
                const skyH = horY;
                const belowH = H - horY - 22;
                const civilH = belowH / 3;
                const altToY = (alt: number) => {
                  if (alt >= 0) return Math.max(15, horY - Math.min(alt / 90, 1) * (skyH - 15));
                  if (alt >= -6) return horY + ((-alt) / 6) * civilH;
                  if (alt >= -12) return horY + civilH + ((-alt - 6) / 6) * civilH;
                  if (alt >= -18) return horY + 2 * civilH + ((-alt - 12) / 6) * civilH;
                  return horY + belowH;
                };
                const sunX = padX + sunPos.dayProg * (W - 2 * padX);
                const sunY = altToY(sunPos.alt);
                const peakY = altToY(sunPos.maxAlt);
                const arcControlY = 2 * peakY - horY;
                const srX = padX, ssX = W - padX, noonX = W / 2;
                const azDir = (az: number) => {
                  if (az >= 337.5 || az < 22.5) return isZh ? '北' : 'N';
                  if (az < 67.5) return isZh ? '东北' : 'NE';
                  if (az < 112.5) return isZh ? '东' : 'E';
                  if (az < 157.5) return isZh ? '东南' : 'SE';
                  if (az < 202.5) return isZh ? '南' : 'S';
                  if (az < 247.5) return isZh ? '西南' : 'SW';
                  if (az < 292.5) return isZh ? '西' : 'W';
                  return isZh ? '西北' : 'NW';
                };
                const nowLabel = new Intl.DateTimeFormat('en-GB', {
                  timeZone: location.tz, hour: '2-digit', minute: '2-digit', hour12: false,
                }).format(new Date());
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="sp-sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#7dd3fc" stopOpacity={0.15} />
                      </linearGradient>
                      <filter id="sp-glow">
                        <feGaussianBlur stdDeviation="3.5" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="sp-moon-glow">
                        <feGaussianBlur stdDeviation="2" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    {/* Sky */}
                    <rect x={0} y={0} width={W} height={horY} fill="url(#sp-sky)" />
                    {/* Civil twilight band */}
                    <rect x={0} y={horY} width={W} height={civilH} fill="#d97706" opacity={0.12} />
                    {/* Nautical twilight band */}
                    <rect x={0} y={horY + civilH} width={W} height={civilH} fill="#1e3a5f" opacity={0.25} />
                    {/* Astronomical twilight band */}
                    <rect x={0} y={horY + 2 * civilH} width={W} height={civilH} fill="#0c0a3e" opacity={0.35} />
                    {/* Horizon line */}
                    <line x1={0} y1={horY} x2={W} y2={horY} stroke="currentColor" strokeWidth={0.8} opacity={0.2} />
                    {/* Zone dividers */}
                    <line x1={0} y1={horY + civilH} x2={W} y2={horY + civilH} stroke="currentColor" strokeWidth={0.4} opacity={0.08} strokeDasharray="4 3" />
                    <line x1={0} y1={horY + 2 * civilH} x2={W} y2={horY + 2 * civilH} stroke="currentColor" strokeWidth={0.4} opacity={0.08} strokeDasharray="4 3" />
                    {/* Altitude labels (left) */}
                    <text x={4} y={8} fontSize={7} fill="currentColor" opacity={0.2}>90°</text>
                    <text x={4} y={horY - 3} fontSize={7} fill="currentColor" opacity={0.25}>0°</text>
                    <text x={4} y={horY + civilH - 2} fontSize={7} fill="currentColor" opacity={0.18}>-6°</text>
                    <text x={4} y={horY + 2 * civilH - 2} fontSize={7} fill="currentColor" opacity={0.18}>-12°</text>
                    <text x={4} y={horY + 3 * civilH - 2} fontSize={7} fill="currentColor" opacity={0.18}>-18°</text>
                    {/* Zone labels (right) */}
                    <text x={W - 4} y={horY + civilH / 2 + 2} textAnchor="end" fontSize={7} fill="currentColor" opacity={0.2}>{isZh ? '民用' : 'Civil'}</text>
                    <text x={W - 4} y={horY + civilH * 1.5 + 2} textAnchor="end" fontSize={7} fill="currentColor" opacity={0.2}>{isZh ? '航海' : 'Naut.'}</text>
                    <text x={W - 4} y={horY + civilH * 2.5 + 2} textAnchor="end" fontSize={7} fill="currentColor" opacity={0.2}>{isZh ? '天文' : 'Astro'}</text>
                    {/* Sun arc path (dashed) */}
                    <path d={`M${srX},${horY} Q${noonX},${arcControlY} ${ssX},${horY}`} fill="none"
                      stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 4" opacity={0.3} />
                    {/* Sun orb with glow */}
                    <circle cx={sunX} cy={sunY} r={sunPos.alt >= 0 ? 8 : 6}
                      fill="#fbbf24" filter="url(#sp-glow)"
                      opacity={sunPos.alt >= 0 ? 0.9 : 0.45} />
                    {/* Sun altitude label */}
                    <text x={sunX + 12} y={sunY + 3} fontSize={8} fontWeight={600}
                      fill="#f59e0b" opacity={0.7}>☀ {sunPos.alt.toFixed(1)}° {azDir(sunPos.az)}</text>
                    {/* Moon arc path (dashed) */}
                    {sunPos.moonProg >= 0 && (() => {
                      const moonPeakY = altToY(sunPos.moonMaxAlt);
                      const moonControlY = 2 * moonPeakY - horY;
                      return (
                        <path d={`M${padX},${horY} Q${noonX},${moonControlY} ${W - padX},${horY}`} fill="none"
                          stroke="#a78bfa" strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
                      );
                    })()}
                    {/* Moon marker */}
                    {sunPos.moonProg >= 0 && (() => {
                      const moonX = padX + sunPos.moonProg * (W - 2 * padX);
                      const moonY = altToY(sunPos.moonAlt);
                      return (
                        <>
                          <circle cx={moonX} cy={moonY} r={sunPos.moonAlt >= 0 ? 6 : 4.5}
                            fill="#c4b5fd" filter="url(#sp-moon-glow)"
                            opacity={sunPos.moonAlt >= 0 ? 0.8 : 0.35} />
                          <text x={moonX - 12} y={moonY + 3} textAnchor="end" fontSize={8} fontWeight={600}
                            fill="#a78bfa" opacity={0.6}>🌙 {sunPos.moonAlt.toFixed(1)}°</text>
                        </>
                      );
                    })()}
                    {/* Current time marker line */}
                    <line x1={sunX} y1={horY + 1} x2={sunX} y2={horY + belowH}
                      stroke="#f59e0b" strokeWidth={0.5} opacity={0.12} strokeDasharray="2 2" />
                    {/* Time labels at bottom */}
                    <text x={srX} y={H - 5} fontSize={7} textAnchor="start" fill="currentColor" opacity={0.3}>{isZh ? '日出' : 'SR'}</text>
                    <text x={noonX} y={H - 5} fontSize={7} textAnchor="middle" fill="currentColor" opacity={0.35}>{nowLabel}</text>
                    <text x={ssX} y={H - 5} fontSize={7} textAnchor="end" fill="currentColor" opacity={0.3}>{isZh ? '日落' : 'SS'}</text>
                  </svg>
                );
              })() : (
                <div className="text-center py-8 opacity-30 text-sm">{isZh ? '计算太阳位置…' : 'Computing sun position…'}</div>
              )}
            </div>
          </div>

          {/* Glow Forecast Card (Sunrise/Sunset) */}
          {glowForecast.length > 0 && (
            <div>
              <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-1.5 tracking-wide uppercase text-center">
                {locName} · {isZh ? '朝霞晚霞预报' : 'Sunrise/Sunset Glow'} · Open-Meteo
              </p>
              <div className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-4">
                <div className="space-y-3">
                  {glowForecast.map((day, i) => {
                    const dayLabel = i === 0
                      ? (isZh ? '今天' : 'Today')
                      : i === 1
                        ? (isZh ? '明天' : 'Tomorrow')
                        : (() => { const d = new Date(day.date + 'T12:00:00'); return d.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { weekday: 'short' }); })();

                    const glowRating = (s: number) =>
                      s >= 75 ? { label: isZh ? '极佳' : 'Excellent', color: '#f97316' }
                      : s >= 55 ? { label: isZh ? '良好' : 'Good', color: '#22c55e' }
                      : s >= 35 ? { label: isZh ? '一般' : 'Fair', color: '#eab308' }
                      : { label: isZh ? '较差' : 'Poor', color: '#94a3b8' };

                    const renderRow = (type: 'sunrise' | 'sunset', data: { time: string; score: number } | null) => {
                      if (!data) return null;
                      const rating = glowRating(data.score);
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-base flex-shrink-0">{type === 'sunrise' ? '🌅' : '🌇'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-text-light/80 dark:text-text-dark/80">
                                {dayLabel} {data.time}
                              </span>
                              <span className="text-xs font-medium" style={{ color: rating.color }}>
                                {rating.label} {data.score}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200/50 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${data.score}%`,
                                  background: `linear-gradient(90deg, #94a3b8, #eab308, #22c55e, #f97316)`,
                                  backgroundSize: '150% 100%',
                                  backgroundPosition: `${100 - data.score}% 0`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div key={day.date} className="space-y-2">
                        {renderRow('sunrise', day.sunrise)}
                        {renderRow('sunset', day.sunset)}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-text-light/30 dark:text-text-dark/30 mt-3 text-center">
                  {isZh ? '基于高/中/低云层、能见度、湿度、降水与 AQI 综合评分' : 'Scored by high/mid/low cloud, visibility, humidity, precipitation & AQI'}
                </p>
              </div>
            </div>
          )}

          {/* N2YO Satellite Tracker */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-2 tracking-wide uppercase text-center">
              {isZh ? '航天器 · 实时轨道追踪' : 'Spacecraft · Live Tracking'}
            </p>
            <div
              ref={n2yoRef}
              className="n2yo-widget-wrapper w-full rounded-lg overflow-hidden border border-black/[0.06] dark:border-white/[0.08]"
            />
          </div>
        </div>

        {/* Right column: Sun & Moon + Weather + AQI + 7Timer */}
        <div className="space-y-6">
          {/* Sun & Moon Card */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-1.5 tracking-wide uppercase text-center">
              {isZh ? '日月出没' : 'Sun & Moon'} · {getUtcOffset(location.tz)}
            </p>
            <div
              className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-3 text-xs text-text-light/70 dark:text-text-dark/95"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between col-span-2">
                  <span className="opacity-50 font-bold">{locName} {location.lat}°N {location.lng}°E</span>
                  <span id="ld-date" className="tabular-nums"></span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>📜 {isZh ? '农历' : 'Lunar'}</span>
                  <span id="ld-lunar" className="tabular-nums">---</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>🌿 {isZh ? '节气' : 'Solar Term'}</span>
                  <span id="ld-jieqi" className="tabular-nums">---</span>
                </div>
                <div className="flex justify-between col-span-2 border-t border-black/[0.04] dark:border-white/[0.04] pt-1 mt-0.5">
                  <span>🌅 {isZh ? '日出日落' : 'Sunrise-Sunset'}</span>
                  <span className="tabular-nums"><span id="ld-sun-rise">--:--</span> - <span id="ld-sun-set">--:--</span></span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>☀️ {isZh ? '正午 · 昼长' : 'Noon · Day'}</span>
                  <span id="ld-sun-noon" className="tabular-nums">--:-- · --h --m</span>
                </div>
                <div className="flex justify-between col-span-2 border-t border-black/[0.04] dark:border-white/[0.04] pt-1 mt-0.5">
                  <span>🌆 {isZh ? '民用晨光' : 'Civil Dawn'}</span>
                  <span id="ld-sun-civil" className="tabular-nums">--:-- → --:--</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>🌃 {isZh ? '航海晨光' : 'Nautical'}</span>
                  <span id="ld-sun-naut" className="tabular-nums">--:-- → --:--</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>🌌 {isZh ? '天文晨光' : 'Astro'}</span>
                  <span id="ld-sun-astro" className="tabular-nums">--:-- → --:--</span>
                </div>
                {/* Moon info */}
                <div className="flex justify-between col-span-2 border-t border-black/[0.04] dark:border-white/[0.04] pt-1 mt-0.5">
                  <span>🌙 {isZh ? '月出' : 'Moonrise'}</span>
                  <span id="ld-moon-rise" className="tabular-nums">--:--</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>🌑 {isZh ? '月落' : 'Moonset'}</span>
                  <span id="ld-moon-set" className="tabular-nums">--:--</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span>🌔 {isZh ? '月相' : 'Phase'}</span>
                  <span><span id="ld-moon-phase" className="tabular-nums">---</span> · <span id="ld-moon-illum" className="tabular-nums">--</span>%</span>
                </div>
              </div>
              <p className="text-right mt-1.5 text-[10px] opacity-30">
                <a href="https://sunrise-sunset.org/api" target="_blank" rel="noopener noreferrer">sunrise-sunset.org</a>
              </p>
            </div>
          </div>

          {/* Weather Detail Card */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-1.5 tracking-wide uppercase text-center">
              {locName} · {isZh ? '天气详情' : 'Weather'} · Open-Meteo
            </p>
            <div className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-5 text-xs text-text-light/70 dark:text-text-dark/95">
              {weather ? (
                <>
                  {/* Hero: horizontal layout */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="text-6xl leading-none flex-shrink-0">{getWeatherEmoji(weather.code)}</div>
                    <div className="flex-1 min-w-0 flex items-center gap-6">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extralight tracking-tighter tabular-nums text-text-light dark:text-text-dark">{weather.temp}</span>
                          <span className="text-lg text-text-light/40 dark:text-text-dark/40 font-light">°C</span>
                        </div>
                        <div className="text-sm text-text-light/50 dark:text-text-dark/50 mt-0.5">{getWeatherDesc(weather.code, isZh)}</div>
                        {weather.forecast[0] && (
                          <div className="text-[11px] text-text-light/35 dark:text-text-dark/35 mt-1 tabular-nums">
                            <span className="text-orange-400">{weather.forecast[0].maxTemp}°</span>
                            <span className="mx-1">/</span>
                            <span className="text-blue-400">{weather.forecast[0].minTemp}°</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 flex-shrink-0">
                        {[
                          { label: isZh ? '露点' : 'Dew', val: `${weather.dewPoint}°` },
                          { label: isZh ? '云量' : 'Cloud', val: `${weather.cloudCover}%` },
                          { label: isZh ? '阵风' : 'Gust', val: `${weather.windGusts}`, unit: 'km/h' },
                          { label: isZh ? '降水' : 'Precip', val: `${weather.precipitation}`, unit: 'mm' },
                        ].map((m, i) => (
                          <div key={i}>
                            <div className="text-[9px] uppercase tracking-wider leading-tight text-text-light/30 dark:text-text-dark/30">{m.label}</div>
                            <div className="text-[11px] font-medium tabular-nums text-text-light/50 dark:text-text-dark/50">
                              {m.val}{m.unit && <span className="text-[8px] font-normal opacity-50 ml-0.5">{m.unit}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metric cards with accent colors */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: isZh ? '体感' : 'Feels', value: `${weather.feelsLike}°` },
                      { label: isZh ? '湿度' : 'Humidity', value: `${weather.humidity}%` },
                      { label: isZh ? '风' : 'Wind', value: `${weather.windSpeed}`, unit: 'km/h' },
                      { label: 'UV', value: `${weather.uvIndex}` },
                      { label: isZh ? '能见度' : 'Vis.', value: `${weather.visibility}`, unit: 'km' },
                      { label: isZh ? '气压' : 'hPa', value: `${weather.pressure}` },
                    ].map((m, i) => (
                      <div key={i} className="rounded-md bg-white/50 dark:bg-white/[0.04] p-2 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-medium mb-0.5 text-text-light/40 dark:text-text-dark/40">{m.label}</div>
                        <div className="font-semibold tabular-nums text-text-light dark:text-text-dark">
                          {m.value}
                          {m.unit && <span className="text-[10px] font-normal opacity-40 ml-0.5">{m.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observation Condition Score */}
                  {obsScore !== null && (() => {
                    const grades = [
                      { min: 85, color: '#22c55e', label: isZh ? '极佳' : 'Excellent', desc: isZh ? '晴朗通透，非常适合观测' : 'Clear & transparent, ideal for observing' },
                      { min: 70, color: '#14b8a6', label: isZh ? '良好' : 'Good', desc: isZh ? '条件不错，可以出摊' : 'Decent conditions, worth setting up' },
                      { min: 55, color: '#eab308', label: isZh ? '一般' : 'Fair', desc: isZh ? '有些限制，碰运气' : 'Some limitations, try your luck' },
                      { min: 40, color: '#f97316', label: isZh ? '较差' : 'Poor', desc: isZh ? '不太理想' : 'Not ideal for observing' },
                      { min: 0, color: '#ef4444', label: isZh ? '不宜' : 'Bad', desc: isZh ? '建议改天' : 'Better wait for another night' },
                    ];
                    const g = grades.find(gr => obsScore >= gr.min) || grades[grades.length - 1];
                    return (
                      <div className="border-t border-black/[0.04] dark:border-white/[0.04] pt-3 mb-4">
                        <div className="text-[10px] uppercase tracking-wider text-text-light/40 dark:text-text-dark/40 mb-2">
                          {isZh ? '🔭 今晚观测条件' : '🔭 Observing Conditions Tonight'}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-extralight tabular-nums" style={{ color: g.color }}>{obsScore}</span>
                          <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${obsScore}%`, background: `linear-gradient(90deg, #ef4444, #eab308, #22c55e)` }} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-medium" style={{ color: g.color }}>{g.label}</span>
                              <span className="text-[10px] text-text-light/35 dark:text-text-dark/35">{g.desc}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Forecast Chart */}
                  <div className="border-t border-black/[0.04] dark:border-white/[0.04] pt-3">
                    {(() => {
                      const days: { label: string; maxTemp: number; minTemp: number; code: number; rain: number; isYesterday: boolean }[] = [];
                      if (weather.yesterday) {
                        days.push({ label: isZh ? '昨' : 'Y', maxTemp: weather.yesterday.maxTemp, minTemp: weather.yesterday.minTemp, code: weather.yesterday.code, rain: weather.yesterday.precipitation, isYesterday: true });
                      }
                      weather.forecast.forEach((f, i) => {
                        const d = new Date(f.date);
                        const label = d.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { weekday: 'short' });
                        days.push({ label, maxTemp: f.maxTemp, minTemp: f.minTemp, code: f.code, rain: f.rainChance, isYesterday: false });
                      });

                      const W = 300, H = 170;
                      const padT = 22, padB = 55, padX = 28;
                      const chartH = H - padT - padB;
                      const temps = days.flatMap(d => [d.maxTemp, d.minTemp]);
                      const dataMin = Math.min(...temps);
                      const dataMax = Math.max(...temps);
                      const dataRange = Math.max(dataMax - dataMin, 4);
                      const tMin = dataMin - dataRange * 0.30;
                      const tMax = dataMax + dataRange * 0.15;
                      const tRange = tMax - tMin;
                      const stepX = days.length > 1 ? (W - 2 * padX) / (days.length - 1) : 0;
                      const xOf = (i: number) => padX + i * stepX;
                      const yOf = (t: number) => padT + chartH - ((t - tMin) / tRange) * chartH;

                      const maxPts = days.map((d, i) => `${xOf(i)},${yOf(d.maxTemp)}`).join(' ');
                      const minPts = days.map((d, i) => `${xOf(i)},${yOf(d.minTemp)}`).join(' ');

                      // Grid lines at 5° intervals
                      const gridStep = 5;
                      const gridStart = Math.ceil(tMin / gridStep) * gridStep;
                      const gridLines: number[] = [];
                      for (let t = gridStart; t <= tMax; t += gridStep) gridLines.push(t);

                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="wm-fill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.06" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          {gridLines.map(t => (
                            <g key={`g${t}`}>
                              <line x1={padX - 8} y1={yOf(t)} x2={W - padX + 8} y2={yOf(t)}
                                stroke="currentColor" strokeWidth={0.5} opacity={0.06} />
                              <text x={padX - 12} y={yOf(t) + 3} textAnchor="end" fontSize={7} fill="currentColor" opacity={0.18}>{t}°</text>
                            </g>
                          ))}

                          {/* Area fill between max and min lines */}
                          <polygon
                            points={[...days.map((d, i) => `${xOf(i)},${yOf(d.maxTemp)}`), ...days.map((d, i) => `${xOf(days.length - 1 - i)},${yOf(days[days.length - 1 - i].minTemp)}`)].join(' ')}
                            fill="url(#wm-fill)" />

                          {/* Yesterday→Today dashed connector */}
                          {days.length >= 2 && days[0].isYesterday && (
                            <>
                              <line x1={xOf(0)} y1={yOf(days[0].maxTemp)} x2={xOf(1)} y2={yOf(days[1].maxTemp)}
                                stroke="#f97316" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.25} />
                              <line x1={xOf(0)} y1={yOf(days[0].minTemp)} x2={xOf(1)} y2={yOf(days[1].minTemp)}
                                stroke="#3b82f6" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.25} />
                            </>
                          )}

                          {/* Max temp line + dots */}
                          <polyline points={maxPts} fill="none" stroke="#f97316" strokeWidth={2.2}
                            strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
                          {days.map((d, i) => (
                            <circle key={`mx${i}`} cx={xOf(i)} cy={yOf(d.maxTemp)} r={4}
                              fill="#f97316" stroke="white" strokeWidth={1.5} opacity={0.9} />
                          ))}

                          {/* Min temp line + dots */}
                          <polyline points={minPts} fill="none" stroke="#3b82f6" strokeWidth={2.2}
                            strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
                          {days.map((d, i) => (
                            <circle key={`mn${i}`} cx={xOf(i)} cy={yOf(d.minTemp)} r={4}
                              fill="#3b82f6" stroke="white" strokeWidth={1.5} opacity={0.9} />
                          ))}

                          {/* Temperature labels */}
                          {days.map((d, i) => (
                            <g key={`l${i}`}>
                              <text x={xOf(i)} y={yOf(d.maxTemp) - 9} textAnchor="middle" fontSize={9} fontWeight={600}
                                fill="#f97316" opacity={d.isYesterday ? 0.45 : 0.9}>{d.maxTemp}°</text>
                              <text x={xOf(i)} y={yOf(d.minTemp) + 14} textAnchor="middle" fontSize={9} fontWeight={600}
                                fill="#3b82f6" opacity={d.isYesterday ? 0.45 : 0.9}>{d.minTemp}°</text>
                            </g>
                          ))}

                          {/* Date labels + emojis */}
                          {days.map((d, i) => (
                            <g key={`d${i}`}>
                              <text x={xOf(i)} y={H - padB + 17} textAnchor="middle" fontSize={14}
                                opacity={d.isYesterday ? 0.5 : 1}>{getWeatherEmoji(d.code)}</text>
                              <text x={xOf(i)} y={H - padB + 30} textAnchor="middle" fontSize={8} fontWeight={400}
                                fill="currentColor" opacity={d.isYesterday ? 0.3 : 0.45}>{d.label}</text>
                              {d.rain > 0 && (
                                <text x={xOf(i)} y={H - padB + 41} textAnchor="middle" fontSize={7}
                                  fill="#3b82f6" opacity={0.45}>
                                  {d.isYesterday ? `${d.rain}mm` : `💧${d.rain}%`}
                                </text>
                              )}
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 opacity-30 text-sm">{isZh ? '加载天气数据…' : 'Loading weather…'}</div>
              )}
            </div>
          </div>

          {/* Air Quality Card */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-1.5 tracking-wide uppercase text-center">
              {locName} · {isZh ? '空气质量' : 'Air Quality'} · Open-Meteo
            </p>
            <div className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-5">
              {aqi ? (() => {
                const aqiLevel = (v: number) =>
                  v <= 50 ? { color: '#22c55e', label: isZh ? '优' : 'Good' } :
                  v <= 100 ? { color: '#eab308', label: isZh ? '良' : 'Moderate' } :
                  v <= 150 ? { color: '#f97316', label: isZh ? '轻度' : 'USG' } :
                  v <= 200 ? { color: '#ef4444', label: isZh ? '中度' : 'Unhealthy' } :
                  v <= 300 ? { color: '#a855f7', label: isZh ? '重度' : 'Very Unhealthy' } :
                  { color: '#7c2d12', label: isZh ? '严重' : 'Hazardous' };
                const level = aqiLevel(aqi.index);
                const pollutants = [
                  { label: 'PM2.5', val: aqi.pm25, unit: 'µg/m³' },
                  { label: 'PM10', val: aqi.pm10, unit: 'µg/m³' },
                  { label: 'O₃', val: aqi.o3, unit: 'µg/m³' },
                  { label: 'NO₂', val: aqi.no2, unit: 'µg/m³' },
                  { label: 'SO₂', val: aqi.so2, unit: 'µg/m³' },
                  { label: 'CO', val: aqi.co, unit: 'µg/m³' },
                ];
                return (
                  <div>
                    {/* AQI hero */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-shrink-0 text-center">
                        <div className="text-4xl font-extralight tabular-nums" style={{ color: level.color }}>{aqi.index}</div>
                        <div className="text-[10px] uppercase tracking-wider mt-0.5 font-medium" style={{ color: level.color }}>{level.label}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-text-light/40 dark:text-text-dark/40 mb-1.5">{isZh ? 'US AQI 指数' : 'US AQI Index'}</div>
                        {/* AQI scale bar */}
                        <div className="h-1.5 rounded-full flex overflow-hidden">
                          {[
                            { w: '10%', c: '#22c55e' }, { w: '10%', c: '#eab308' },
                            { w: '10%', c: '#f97316' }, { w: '10%', c: '#ef4444' },
                            { w: '20%', c: '#a855f7' }, { w: '40%', c: '#7c2d12' },
                          ].map((s, i) => (
                            <div key={i} style={{ width: s.w, background: s.c, opacity: 0.5 }} />
                          ))}
                        </div>
                        {/* Indicator triangle */}
                        <div className="relative h-2 mt-0.5">
                          <div
                            className="absolute text-[8px] leading-none"
                            style={{
                              left: `${Math.min(aqi.index / 500 * 100, 100)}%`,
                              transform: 'translateX(-50%)',
                              color: level.color,
                            }}
                          >▲</div>
                        </div>
                      </div>
                    </div>
                    {/* Pollutant grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {pollutants.map((p, i) => (
                        <div key={i} className="rounded-md bg-white/50 dark:bg-white/[0.04] p-2 text-center">
                          <div className="text-[10px] uppercase tracking-wider font-medium mb-0.5 text-text-light/40 dark:text-text-dark/40">{p.label}</div>
                          <div className="font-semibold tabular-nums text-text-light dark:text-text-dark text-sm">
                            {Math.round(p.val)}
                            <span className="text-[9px] font-normal opacity-40 ml-0.5">{p.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-8 opacity-30 text-sm">{isZh ? '加载空气质量…' : 'Loading air quality…'}</div>
              )}
            </div>
          </div>

          {/* 7Timer Astro Forecast */}
          <div>
            <p className="text-xs text-text-light/40 dark:text-text-dark/70 mb-2 tracking-wide uppercase text-center">
              {locName} · {isZh ? '天文气象预报' : 'Astro Forecast'} · 7Timer
            </p>
            <img
              key={`timer7-${location.lat}-${location.lng}`}
              src={`https://www.7timer.info/bin/astro.php?lon=${location.timer7.lng}&lat=${location.timer7.lat}&lang=${isZh ? 'zh' : 'en'}&ac=0&unit=metric&tzshift=0`}
              alt={isZh ? '天文气象预报' : 'Astro weather forecast'}
              className="forecast-img w-full rounded-lg"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>

      {/* ── Right sidebar: Quick Links (fixed in right margin on xl+) ── */}
      <div className="mt-8 xl:mt-0 xl:fixed xl:right-[calc(50%_-_38.5rem)] xl:top-32 xl:w-40 xl:z-10">
        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-3">
          {isZh ? '常用链接' : 'Quick Links'}
        </h3>
        <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
          {[
            {
              icon: '🛰️',
              name: { en: 'Heavens Above', zh: 'Heavens Above' },
              url: `https://www.heavens-above.com/PassSummary.aspx?lat=${location.lat}&lng=${location.lng}&loc=${encodeURIComponent(location.name[isZh ? 'zh' : 'en'])}&alt=0`,
            },
            {
              icon: '☀️',
              name: { en: 'Clear Outside', zh: 'Clear Outside' },
              url: `https://clearoutside.com/forecast/${location.lat.toFixed(2)}/${location.lng.toFixed(2)}`,
            },
            {
              icon: '💡',
              name: { en: 'Light Pollution', zh: '光污染地图' },
              url: `https://lightpollutionmap.info/#zoom=10.00&lat=${location.lat}&lon=${location.lng}`,
            },
            {
              icon: '🌐',
              name: { en: 'Time and Date', zh: 'Time and Date' },
              url: 'https://www.timeanddate.com/astronomy/',
            },
            {
              icon: '⭐',
              name: { en: 'Stellarium Web', zh: 'Stellarium 星图' },
              url: 'https://stellarium-web.org/',
            },
            {
              icon: '🌌',
              name: { en: 'SpaceWeatherLive', zh: '太阳活动' },
              url: 'https://www.spaceweatherlive.com/',
            },
            {
              icon: '🎇',
              name: { en: 'Aurora Forecast', zh: '极光预报' },
              url: 'https://www.spaceweather.gov/products/aurora-30-minute-forecast',
            },
            {
              icon: '📷',
              name: { en: 'Skyline Webcams', zh: '实景摄像头' },
              url: 'https://www.skylinewebcams.com/',
            },
            {
              icon: '🔭',
              name: { en: 'Nova Astrometry', zh: '星图解析' },
              url: 'https://nova.astrometry.net/upload',
            },
            {
              icon: '☄️',
              name: { en: 'Astro vanbuitenen', zh: '彗星追踪' },
              url: 'https://astro.vanbuitenen.nl/home',
            },
          ].map((link) => (
            <a
              key={link.name.en}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all duration-150
                         bg-white/50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08]
                         hover:border-primary-light/20 dark:hover:border-primary-dark/20
                         text-text-light/70 dark:text-text-dark/70
                         hover:text-text-light dark:hover:text-text-dark"
            >
              <span className="text-base">{link.icon}</span>
              <span className="truncate">{link.name[isZh ? 'zh' : 'en']}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
