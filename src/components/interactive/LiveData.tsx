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
              {isZh ? '日月出没' : 'Sun & Moon'}
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
