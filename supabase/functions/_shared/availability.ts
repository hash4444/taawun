/** Pure schedule rules shared by the browser and Edge Functions. No calendar titles or provider tokens. */
export interface WeeklyWindow { weekday: number; start: string; end: string }
export interface AvailabilityPreferences {
  timezone: string;
  weekly_windows: WeeklyWindow[];
  minimum_shift_minutes: number;
  travel_buffer_minutes: number;
  share_with_employers?: boolean;
  /** Derived from private connection metadata; never editable/persisted as a preference. */
  calendar_checked_until?: string | null;
}
export interface BusyEvent { start_at: string; end_at: string; busy?: boolean }
export interface InstantWindow { start_at: string; end_at: string }
export interface AvailabilityAssessment {
  compatible: boolean;
  status: 'compatible' | 'conflict' | 'outside_preferences' | 'unknown' | 'too_short';
  reasons: string[];
}
type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };
const minute = 60_000;

export function isValidTimezone(timezone: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); return true; } catch { return false; }
}
export function zonedParts(value: Date | number, timezone: string): Parts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  const get = (name: string) => Number(parts.find(p => p.type === name)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}
const wall = (p: Parts) => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
const same = (a: Parts, b: Parts) => a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.minute === b.minute && a.second === b.second;

/** Converts a local wall time using IANA rules. Nonexistent DST times are rejected; repeated times use earliest instant. */
export function localToInstant(value: string, timezone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match || !isValidTimezone(timezone)) throw new Error('Use a valid date and IANA time zone.');
  const p: Parts = { year: +match[1], month: +match[2], day: +match[3], hour: +match[4], minute: +match[5], second: +(match[6] || 0) };
  const base = wall(p);
  if (!same(zonedParts(base, 'UTC'), p)) throw new Error('Invalid calendar date or time.');
  const offsets = new Set([-36, -12, 0, 12, 36].map(hours => {
    const sample = base + hours * 3_600_000;
    return wall(zonedParts(sample, timezone)) - sample;
  }));
  const candidates = [...offsets].map(offset => base - offset).filter(t => same(zonedParts(t, timezone), p)).sort((a, b) => a - b);
  if (!candidates.length) throw new Error('This local time does not exist because of a daylight-saving change.');
  return new Date(candidates[0]).toISOString();
}
export function validatePreferences(p: AvailabilityPreferences): void {
  if (!isValidTimezone(p.timezone)) throw new Error('Select a valid time zone.');
  if (!Number.isInteger(p.minimum_shift_minutes) || p.minimum_shift_minutes < 15 || p.minimum_shift_minutes > 1440) throw new Error('Minimum shift length must be 15–1440 minutes.');
  if (!Number.isInteger(p.travel_buffer_minutes) || p.travel_buffer_minutes < 0 || p.travel_buffer_minutes > 240) throw new Error('Travel buffer must be 0–240 minutes.');
  if (!Array.isArray(p.weekly_windows) || p.weekly_windows.length > 28) throw new Error('Use at most 28 preferred work windows.');
  for (const w of p.weekly_windows) {
    if (!Number.isInteger(w.weekday) || w.weekday < 0 || w.weekday > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(w.start) || !/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(w.end) || w.start >= w.end) {
      throw new Error('Each work window needs a weekday and an end time after its start time. Split overnight preferences across days.');
    }
  }
}
function preferencesForRange(start: number, end: number, p: AvailabilityPreferences): [number, number][] {
  const first = zonedParts(start, p.timezone);
  const last = zonedParts(end, p.timezone);
  const from = Date.UTC(first.year, first.month - 1, first.day);
  const until = Date.UTC(last.year, last.month - 1, last.day);
  if (until - from > 32 * 86_400_000) throw new Error('Choose a schedule range of at most 31 days.');
  const windows: [number, number][] = [];
  for (let day = from; day <= until; day += 86_400_000) {
    const date = new Date(day);
    const dateString = date.toISOString().slice(0, 10);
    for (const w of p.weekly_windows.filter(w => w.weekday === date.getUTCDay())) {
      const endDate = w.end === '24:00' ? new Date(day + 86_400_000).toISOString().slice(0, 10) : dateString;
      windows.push([Date.parse(localToInstant(`${dateString}T${w.start}`, p.timezone)), Date.parse(localToInstant(`${endDate}T${w.end === '24:00' ? '00:00' : w.end}`, p.timezone))]);
    }
  }
  return windows.sort((a, b) => a[0] - b[0]);
}
export function assessAvailability(shift: { start_at?: string | null; end_at?: string | null }, p: AvailabilityPreferences | null | undefined, busyEvents: BusyEvent[]): AvailabilityAssessment {
  const result = (status: AvailabilityAssessment['status'], reason: string): AvailabilityAssessment => ({ compatible: status === 'compatible', status, reasons: [reason] });
  const start = Date.parse(shift.start_at || '');
  const end = Date.parse(shift.end_at || '');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !p) return result('unknown', 'Schedule or work preferences need confirmation.');
  if (p.calendar_checked_until && (!Number.isFinite(Date.parse(p.calendar_checked_until)) || end + Math.max(0, p.travel_buffer_minutes || 0) * minute > Date.parse(p.calendar_checked_until))) return result('unknown', 'Refresh your imported timetable before confirming dates outside its coverage.');
  try {
    validatePreferences(p);
    if ((end - start) / minute < p.minimum_shift_minutes) return result('too_short', 'Shorter than your preferred minimum shift.');
    const windows = preferencesForRange(start, end, p);
    let coveredUntil = start;
    for (const [a, b] of windows) {
      if (a <= coveredUntil && b > coveredUntil) coveredUntil = b;
    }
    if (coveredUntil < end) return result('outside_preferences', 'Outside your preferred working hours.');
    const buffer = p.travel_buffer_minutes * minute;
    for (const e of busyEvents.filter(e => e.busy !== false)) {
      const a = Date.parse(e.start_at), b = Date.parse(e.end_at);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return result('unknown', 'A calendar entry needs correction before availability can be confirmed.');
      if (start < b + buffer && end > a - buffer) return result('conflict', 'Conflicts with a busy period or your travel buffer.');
    }
    return result('compatible', 'Fits your preferred hours and has no calendar conflict.');
  } catch { return result('unknown', 'Schedule or time-zone settings need confirmation.'); }
}

/** Free time is always the intersection with stated work preferences, never all empty calendar time. */
export function freeWorkWindows(range: InstantWindow, p: AvailabilityPreferences, busyEvents: BusyEvent[]): InstantWindow[] {
  validatePreferences(p);
  const start = Date.parse(range.start_at);
  let end = Date.parse(range.end_at);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('Invalid schedule range.');
  if (p.calendar_checked_until) {
    const coverage = Date.parse(p.calendar_checked_until);
    if (!Number.isFinite(coverage)) throw new Error('Calendar coverage needs confirmation.');
    end = Math.min(end, coverage - p.travel_buffer_minutes * minute);
    if (end <= start) return [];
  }
  const buffer = p.travel_buffer_minutes * minute;
  const busy = busyEvents.filter(e => e.busy !== false).map(e => [Date.parse(e.start_at) - buffer, Date.parse(e.end_at) + buffer]);
  if (busy.some(([a, b]) => !Number.isFinite(a) || !Number.isFinite(b) || b <= a)) throw new Error('Invalid busy period.');
  const available: [number, number][] = [];
  for (const [a, b] of preferencesForRange(start, end, p)) {
    let pieces: [number, number][] = [[Math.max(a, start), Math.min(b, end)]];
    for (const [c, d] of busy) pieces = pieces.flatMap(([x, y]) => c >= y || d <= x ? [[x, y]] : [[x, Math.min(c, y)], [Math.max(d, x), y]]).filter(([x, y]) => y > x) as [number, number][];
    available.push(...pieces);
  }
  const merged: [number, number][] = [];
  for (const interval of available.sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]); else merged.push(interval);
  }
  return merged.filter(([a, b]) => b - a >= p.minimum_shift_minutes * minute).map(([a, b]) => ({ start_at: new Date(a).toISOString(), end_at: new Date(b).toISOString() }));
}
