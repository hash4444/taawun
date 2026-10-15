import { describe, it, expect } from 'vitest';
import { assessAvailability, freeWorkWindows, localToInstant, validatePreferences, type AvailabilityPreferences } from '@/lib/availability';
const p: AvailabilityPreferences = { timezone: 'Asia/Dubai', weekly_windows: [{ weekday: 1, start: '09:00', end: '18:00' }], minimum_shift_minutes: 60, travel_buffer_minutes: 30 };
const shift = { start_at: '2026-10-19T06:00:00Z', end_at: '2026-10-19T08:00:00Z' };
describe('academic and preferred work availability', () => {
  it('does not claim availability beyond an imported timetable coverage horizon', () => {
    const covered = { ...p, calendar_checked_until: '2026-10-19T07:00:00Z' };
    expect(assessAvailability(shift, covered, []).status).toBe('unknown');
    expect(freeWorkWindows({ start_at: '2026-10-19T05:00:00Z', end_at: '2026-10-19T14:00:00Z' }, covered, [])).toEqual([{ start_at: '2026-10-19T05:00:00.000Z', end_at: '2026-10-19T06:30:00.000Z' }]);
  });
  it('accepts a shift inside preferred Dubai hours', () => expect(assessAvailability(shift, p, []).compatible).toBe(true));
  it('does not assume an empty calendar means willingness to work', () => expect(assessAvailability(shift, { ...p, weekly_windows: [] }, []).status).toBe('outside_preferences'));
  it('blocks class overlap and a chosen travel buffer', () => expect(assessAvailability(shift, p, [{ start_at: '2026-10-19T08:15:00Z', end_at: '2026-10-19T09:00:00Z' }]).status).toBe('conflict'));
  it('allows exact boundaries and ignores transparent calendar entries', () => expect(assessAvailability(shift, p, [{ start_at: shift.start_at, end_at: shift.end_at, busy: false }]).compatible).toBe(true));
  it('requires confirmation for missing schedule/preferences or corrupt calendar data', () => {
    expect(assessAvailability({}, p, []).status).toBe('unknown');
    expect(assessAvailability(shift, null, []).compatible).toBe(false);
    expect(assessAvailability(shift, p, [{ start_at: 'bad', end_at: 'bad' }]).compatible).toBe(false);
  });
  it('respects minimum duration', () => expect(assessAvailability({ ...shift, end_at: '2026-10-19T06:15:00Z' }, p, []).status).toBe('too_short'));
  it('calculates free windows only within preferred hours with class/travel subtraction', () => {
    expect(freeWorkWindows({ start_at: '2026-10-19T00:00:00Z', end_at: '2026-10-20T00:00:00Z' }, p, [{ start_at: '2026-10-19T08:00:00Z', end_at: '2026-10-19T09:00:00Z' }])).toEqual([
      { start_at: '2026-10-19T05:00:00.000Z', end_at: '2026-10-19T07:30:00.000Z' },
      { start_at: '2026-10-19T09:30:00.000Z', end_at: '2026-10-19T14:00:00.000Z' },
    ]);
  });
  it('uses IANA daylight-saving rules and rejects nonexistent local times', () => {
    expect(localToInstant('2026-03-27T10:00', 'Europe/London')).toBe('2026-03-27T10:00:00.000Z');
    expect(localToInstant('2026-03-30T10:00', 'Europe/London')).toBe('2026-03-30T09:00:00.000Z');
    expect(() => localToInstant('2026-03-29T01:30', 'Europe/London')).toThrow(/does not exist/);
    expect(localToInstant('2026-10-25T01:30', 'Europe/London')).toBe('2026-10-25T00:30:00.000Z');
  });
  it('rejects invalid dates, preferences and unbounded calculations', () => {
    expect(() => localToInstant('2026-02-31T10:00', 'Asia/Dubai')).toThrow();
    expect(() => validatePreferences({ ...p, weekly_windows: [{ weekday: 1, start: '22:00', end: '06:00' }] })).toThrow();
    expect(() => freeWorkWindows({ start_at: '2026-01-01T00:00Z', end_at: '2026-06-01T00:00Z' }, p, [])).toThrow();
  });
  it('unions adjacent preferences and supports overnight work across midnight', () => {
    const overnight = { ...p, weekly_windows: [{ weekday: 1, start: '22:00', end: '24:00' }, { weekday: 2, start: '00:00', end: '02:00' }] };
    expect(assessAvailability({ start_at: '2026-10-19T19:00:00Z', end_at: '2026-10-19T21:00:00Z' }, overnight, []).compatible).toBe(true);
    const adjacent = { ...p, weekly_windows: [{ weekday: 1, start: '09:00', end: '09:30' }, { weekday: 1, start: '09:30', end: '10:00' }] };
    expect(freeWorkWindows({ start_at: '2026-10-19T00:00:00Z', end_at: '2026-10-20T00:00:00Z' }, adjacent, [])).toHaveLength(1);
  });
});
