import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LOCATION_PRESETS,
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
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState(location.lat.toString());
  const [manualLng, setManualLng] = useState(location.lng.toString());
  const n2yoRef = useRef<HTMLDivElement>(null);
  const n2yoLoaded = useRef(false);

  // ── Weather state (Open-Meteo) ──
  const [weather, setWeather] = useState<{
    temp: number; feelsLike: number; humidity: number;
    windSpeed: number; windDir: string; uvIndex: number;
    visibility: number; pressure: number;
    desc: string; code: number;
    forecast: { date: string; maxTemp: number; minTemp: number; code: number; rainChance: number }[];
    yesterday: { maxTemp: number; minTemp: number; code: number; precipitation: number } | null;
  } | null>(null);

  // ── Location change handler ──
  const selectLocation = useCallback((loc: ToolLocationPreset) => {
    setLocation(loc);
    saveLocation(loc);
    setShowManual(false);
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
        const fUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`;
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

  return (
    <div>
      {/* ── Location Selector ── */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-heading-light dark:text-heading-dark mb-3">
          {isZh ? '选择地点' : 'Select Location'}
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {LOCATION_PRESETS.map((preset) => (
            <button
              key={preset.name.en}
              onClick={() => selectLocation(preset)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-150 cursor-pointer ${
                location.name.en === preset.name.en
                  ? 'bg-primary-light/10 dark:bg-primary-dark/15 border-primary-light/30 dark:border-primary-dark/30 text-primary-light dark:text-primary-dark font-medium'
                  : 'bg-white/50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] hover:border-primary-light/20 dark:hover:border-primary-dark/20 text-text-light/70 dark:text-text-dark/70'
              }`}
            >
              {preset.name[isZh ? 'zh' : 'en']}{' '}
              <span className="opacity-50 text-xs">{getUtcOffset(preset.tz)}</span>
            </button>
          ))}
          <button
            onClick={() => setShowManual(!showManual)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-150 cursor-pointer ${
              showManual
                ? 'bg-primary-light/10 dark:bg-primary-dark/15 border-primary-light/30 dark:border-primary-dark/30 text-primary-light dark:text-primary-dark'
                : 'bg-white/50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] hover:border-primary-light/20 dark:hover:border-primary-dark/20 text-text-light/70 dark:text-text-dark/70'
            }`}
          >
            {isZh ? '手动输入' : 'Manual Input'}
          </button>
        </div>

        {showManual && (
          <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.02]">
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
              {isZh ? '恢复默认' : 'Reset to Default'}
            </button>
          </div>
        )}
      </div>

      {/* ── Live Data Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Windy + N2YO */}
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

        {/* Right column: Sun & Moon + 7Timer */}
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
                    <div className="flex-1 min-w-0">
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
                  </div>

                  {/* Metric cards with accent colors */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: isZh ? '体感' : 'Feels', value: `${weather.feelsLike}°`, color: 'text-amber-500' },
                      { label: isZh ? '湿度' : 'Humidity', value: `${weather.humidity}%`, color: 'text-sky-400' },
                      { label: isZh ? '风' : 'Wind', value: `${weather.windSpeed}`, unit: 'km/h', color: 'text-teal-500' },
                      { label: 'UV', value: `${weather.uvIndex}`, color: weather.uvIndex >= 6 ? 'text-rose-400' : 'text-yellow-400' },
                      { label: isZh ? '能见度' : 'Vis.', value: `${weather.visibility}`, unit: 'km', color: 'text-indigo-400' },
                      { label: isZh ? '气压' : 'hPa', value: `${weather.pressure}`, color: 'text-purple-400' },
                    ].map((m, i) => (
                      <div key={i} className="rounded-md bg-white/50 dark:bg-white/[0.04] p-2 text-center">
                        <div className={`text-[10px] uppercase tracking-wider font-medium mb-0.5 ${m.color}`}>{m.label}</div>
                        <div className="font-semibold tabular-nums text-text-light dark:text-text-dark">
                          {m.value}
                          {m.unit && <span className="text-[10px] font-normal opacity-40 ml-0.5">{m.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Forecast Chart */}
                  <div className="border-t border-black/[0.04] dark:border-white/[0.04] pt-3">
                    {(() => {
                      const days: { label: string; maxTemp: number; minTemp: number; code: number; rain: number; isYesterday: boolean }[] = [];
                      if (weather.yesterday) {
                        days.push({ label: isZh ? '昨' : 'Y', maxTemp: weather.yesterday.maxTemp, minTemp: weather.yesterday.minTemp, code: weather.yesterday.code, rain: weather.yesterday.precipitation, isYesterday: true });
                      }
                      weather.forecast.forEach((f, i) => {
                        const d = new Date(f.date);
                        const label = i === 0 ? (isZh ? '今' : 'T')
                          : i === 1 ? (isZh ? '明' : 'T+1')
                          : d.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { weekday: 'narrow' });
                        days.push({ label, maxTemp: f.maxTemp, minTemp: f.minTemp, code: f.code, rain: f.rainChance, isYesterday: false });
                      });

                      const W = 300, H = 170;
                      const padT = 20, padB = 56, padX = 28;
                      const chartH = H - padT - padB;
                      const temps = days.flatMap(d => [d.maxTemp, d.minTemp]);
                      const tMin = Math.min(...temps) - 3;
                      const tMax = Math.max(...temps) + 3;
                      const tRange = Math.max(tMax - tMin, 1);
                      const stepX = days.length > 1 ? (W - 2 * padX) / (days.length - 1) : 0;
                      const xOf = (i: number) => padX + i * stepX;
                      const yOf = (t: number) => padT + chartH - ((t - tMin) / tRange) * chartH;

                      const maxPts = days.map((d, i) => `${xOf(i)},${yOf(d.maxTemp)}`).join(' ');
                      const minPts = days.map((d, i) => `${xOf(i)},${yOf(d.minTemp)}`).join(' ');
                      const maxPrecip = Math.max(...days.map(d => d.rain), 1);

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

                          {/* Precipitation bars */}
                          {days.map((d, i) => {
                            if (d.rain <= 0) return null;
                            const barH = (d.rain / maxPrecip) * 22;
                            return (
                              <rect key={`p${i}`} x={xOf(i) - 9} y={H - padB + 1} width={18} height={barH} rx={2.5}
                                fill="#3b82f6" opacity={d.isYesterday ? 0.08 : 0.14} />
                            );
                          })}

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
                              fill="#f97316" stroke="white" strokeWidth={1.5}
                              opacity={d.isYesterday ? 0.4 : 0.9} />
                          ))}

                          {/* Min temp line + dots */}
                          <polyline points={minPts} fill="none" stroke="#3b82f6" strokeWidth={2.2}
                            strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
                          {days.map((d, i) => (
                            <circle key={`mn${i}`} cx={xOf(i)} cy={yOf(d.minTemp)} r={4}
                              fill="#3b82f6" stroke="white" strokeWidth={1.5}
                              opacity={d.isYesterday ? 0.4 : 0.9} />
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
                              <text x={xOf(i)} y={H - padB + 15} textAnchor="middle" fontSize={8.5} fontWeight={d.isYesterday ? 400 : 500}
                                fill="currentColor" opacity={d.isYesterday ? 0.28 : 0.45}>{d.label}</text>
                              <text x={xOf(i)} y={H - padB + 33} textAnchor="middle" fontSize={14}
                                opacity={d.isYesterday ? 0.5 : 1}>{getWeatherEmoji(d.code)}</text>
                              {d.rain > 0 && (
                                <text x={xOf(i)} y={H - padB + 1 + (d.rain / maxPrecip) * 22 + 10}
                                  textAnchor="middle" fontSize={7} fill="#3b82f6" opacity={0.5}>
                                  {d.isYesterday ? `${d.rain}mm` : `${d.rain}%`}
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
    </div>
  );
}
