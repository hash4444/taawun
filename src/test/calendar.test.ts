import { describe, expect, it } from 'vitest';
import { buildCalendarInvite, parseAcademicCalendar } from '@/lib/calendar';
const options = { timezone: 'Asia/Dubai', rangeStart: new Date('2026-03-01Z'), rangeEnd: new Date('2026-04-30Z') };
const calendar = (event: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${event}\r\nEND:VCALENDAR`;
const event = (props: string) => `BEGIN:VEVENT\r\nUID:lecture-1\r\n${props}\r\nEND:VEVENT`;
describe('private academic calendar imports', () => {
  it('expands weekly recurrence and excludes cancelled lecture dates without retaining titles', () => {
    const events = parseAcademicCalendar(calendar(event('DTSTART;TZID=Asia/Dubai:20260302T100000\r\nDTEND;TZID=Asia/Dubai:20260302T110000\r\nRRULE:FREQ=WEEKLY;COUNT=3\r\nEXDATE;TZID=Asia/Dubai:20260309T100000\r\nSUMMARY:Private medical lecture')), options);
    expect(events.map(e => e.start_at)).toEqual(['2026-03-02T06:00:00.000Z', '2026-03-16T06:00:00.000Z']);
    expect(JSON.stringify(events)).not.toContain('Private medical lecture');
  });
  it('resolves recurring IANA times across daylight saving', () => {
    const events = parseAcademicCalendar(calendar(event('DTSTART;TZID=Europe/London:20260327T100000\r\nDTEND;TZID=Europe/London:20260327T110000\r\nRRULE:FREQ=DAILY;COUNT=4')), options);
    expect(events[0].start_at).toBe('2026-03-27T10:00:00.000Z');
    expect(events[3].start_at).toBe('2026-03-30T09:00:00.000Z');
  });
  it('handles all-day examinations and floating times in the chosen timezone', () => {
    const events = parseAcademicCalendar(calendar(event('DTSTART;VALUE=DATE:20260310\r\nDTEND;VALUE=DATE:20260312')), options);
    expect(events[0]).toMatchObject({ start_at: '2026-03-09T20:00:00.000Z', end_at: '2026-03-11T20:00:00.000Z' });
  });
  it('ignores transparent and cancelled events', () => {
    expect(parseAcademicCalendar(calendar(event('DTSTART:20260310T100000Z\r\nDTEND:20260310T110000Z\r\nTRANSP:TRANSPARENT')), options)).toEqual([]);
    expect(parseAcademicCalendar(calendar(event('DTSTART:20260310T100000Z\r\nDTEND:20260310T110000Z\r\nSTATUS:CANCELLED')), options)).toEqual([]);
  });
  it('honors recurrence exceptions and uses repeatable identifiers', () => {
    const text = calendar(event('DTSTART:20260302T100000Z\r\nDTEND:20260302T110000Z\r\nRRULE:FREQ=WEEKLY;COUNT=2') + '\r\n' + event('RECURRENCE-ID:20260309T100000Z\r\nDTSTART:20260309T120000Z\r\nDTEND:20260309T130000Z'));
    const parsed = parseAcademicCalendar(text, options);
    expect(parsed[1].start_at).toBe('2026-03-09T12:00:00.000Z');
    expect(parseAcademicCalendar(text, options)).toEqual(parsed);
  });
  it('keeps opaque recurrence exceptions to transparent series and standalone overrides', () => {
    const overridden = calendar(event('DTSTART:20260302T100000Z\r\nDTEND:20260302T110000Z\r\nRRULE:FREQ=WEEKLY;COUNT=2\r\nTRANSP:TRANSPARENT') + '\r\n' + event('RECURRENCE-ID:20260309T100000Z\r\nDTSTART:20260309T120000Z\r\nDTEND:20260309T130000Z\r\nTRANSP:OPAQUE'));
    expect(parseAcademicCalendar(overridden, options).map(e => e.start_at)).toEqual(['2026-03-09T12:00:00.000Z']);
    const orphan = calendar(event('RECURRENCE-ID:20260309T100000Z\r\nDTSTART:20260309T120000Z\r\nDTEND:20260309T130000Z'));
    expect(parseAcademicCalendar(orphan, options)).toHaveLength(1);
  });
  it('rejects invalid, oversized and high-frequency imports', () => {
    expect(() => parseAcademicCalendar('broken', options)).toThrow();
    expect(() => parseAcademicCalendar('x'.repeat(2 * 1024 * 1024 + 1), options)).toThrow(/2 MB/);
    expect(() => parseAcademicCalendar(calendar(event('DTSTART:20260302T100000Z\r\nDTEND:20260302T110000Z\r\nRRULE:FREQ=SECONDLY')), options)).toThrow(/recurrences/);
  });
  it('exports stable calendar UID and escapes injected fields', () => {
    const input = { id: 'interview-123', title: 'Interview, TAAWUN\nDetails', start_at: '2026-03-10T10:00Z', end_at: '2026-03-10T11:00Z' };
    expect(buildCalendarInvite(input)).toContain('UID:interview-123@taawun');
    expect(buildCalendarInvite(input)).toContain('SUMMARY:Interview\\, TAAWUN\\nDetails');
    expect(buildCalendarInvite(input)).toBe(buildCalendarInvite(input));
  });
});
