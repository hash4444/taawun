import ICAL from 'ical.js';
import { isValidTimezone, localToInstant, type BusyEvent } from '@/lib/availability';
export interface ImportedBusyEvent extends BusyEvent { external_uid: string }
export interface CalendarImportOptions { timezone: string; rangeStart?: Date; rangeEnd?: Date }
type IcalTime = InstanceType<typeof ICAL.Time>;

function toInstant(time: IcalTime, timezone: string): string {
  if (!time.isDate && time.zone.tzid === 'UTC') return time.toJSDate().toISOString();
  if (!time.isDate && time.zone.tzid !== 'floating' && time.zone.tzid !== 'local') return time.toJSDate().toISOString();
  const wall = `${String(time.year).padStart(4, '0')}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}T${String(time.hour || 0).padStart(2, '0')}:${String(time.minute || 0).padStart(2, '0')}:${String(time.second || 0).padStart(2, '0')}`;
  return localToInstant(wall, timezone);
}

/** Bounded RFC5545 import: recurrences/exclusions/overrides, date-only events, IANA/embedded timezones. Titles never leave this parser. */
export function parseAcademicCalendar(text: string, options: CalendarImportOptions): ImportedBusyEvent[] {
  if (new TextEncoder().encode(text).byteLength > 2 * 1024 * 1024) throw new Error('Calendar files must be smaller than 2 MB.');
  if (!isValidTimezone(options.timezone)) throw new Error('Choose a valid time zone before importing.');
  const rangeStart = options.rangeStart || new Date();
  const rangeEnd = options.rangeEnd || new Date(rangeStart.getTime() + 120 * 86_400_000);
  if (!Number.isFinite(+rangeStart) || !Number.isFinite(+rangeEnd) || +rangeEnd <= +rangeStart || +rangeEnd - +rangeStart > 185 * 86_400_000) throw new Error('Import up to six months at a time.');
  let calendar: InstanceType<typeof ICAL.Component>;
  try { calendar = new ICAL.Component(ICAL.parse(text)); } catch { throw new Error('This is not a valid ICS calendar file.'); }
  if (calendar.name !== 'vcalendar') throw new Error('This is not a valid ICS calendar file.');
  const components = calendar.getAllSubcomponents('vevent');
  if (components.length > 2000) throw new Error('Import at most 2,000 calendar events.');
  const result = new Map<string, ImportedBusyEvent>();
  const masterUids = new Set(components.filter(c => !c.hasProperty('recurrence-id')).map(c => String(c.getFirstPropertyValue('uid'))));
  let iterations = 0;
  for (const component of components) {
    if (component.hasProperty('recurrence-id') && masterUids.has(String(component.getFirstPropertyValue('uid')))) continue; // Related overrides are applied through the parent; orphan overrides remain individual busy events.
    if (!component.hasProperty('dtstart')) throw new Error('A calendar event has no start time.');
    const event = new ICAL.Event(component);
    if (!event.uid || event.uid.length > 400) throw new Error('Every calendar event needs a valid identifier of at most 400 characters.');
    const tzid = String(component.getFirstProperty('dtstart')?.getParameter('tzid') || options.timezone);
    const fallback = event.startDate.isDate ? options.timezone : tzid;
    if (!isValidTimezone(fallback) && event.startDate.zone.tzid === 'floating') throw new Error(`Unsupported time zone: ${fallback}. Export with time-zone definitions or use an IANA time zone.`);
    const add = (start: IcalTime, end: IcalTime, item: InstanceType<typeof ICAL.Event>, recurrence: string) => {
      if (item.component.getFirstPropertyValue('status') === 'CANCELLED' || item.component.getFirstPropertyValue('transp') === 'TRANSPARENT') return;
      const itemTimezone = String(item.component.getFirstProperty('dtstart')?.getParameter('tzid') || fallback);
      const start_at = toInstant(start, itemTimezone), end_at = toInstant(end, itemTimezone);
      if (Date.parse(end_at) <= Date.parse(start_at)) throw new Error('A calendar event must end after it starts.');
      if (Date.parse(end_at) <= +rangeStart || Date.parse(start_at) >= +rangeEnd) return;
      const external_uid = `${event.uid || 'event'}:${recurrence}`.slice(0, 512);
      result.set(external_uid, { external_uid, start_at, end_at, busy: true });
      if (result.size > 2000) throw new Error('Calendar expansion exceeds 2,000 events. Choose a smaller timetable.');
    };
    if (!event.isRecurring()) add(event.startDate, event.endDate, event, event.startDate.toString());
    else {
      const frequencies = event.getRecurrenceTypes();
      if (frequencies.SECONDLY || frequencies.MINUTELY || frequencies.HOURLY) throw new Error('Import daily or less frequent timetable recurrences.');
      const iterator = event.iterator();
      let next: IcalTime | null;
      while ((next = iterator.next())) {
        if (++iterations > 20_000) throw new Error('Timetable recurrence is too large. Export a recent semester only.');
        if (Date.parse(toInstant(next, fallback)) >= +rangeEnd) break;
        const details = event.getOccurrenceDetails(next);
        add(details.startDate, details.endDate, details.item, next.toString());
      }
    }
  }
  return [...result.values()].sort((a, b) => a.start_at.localeCompare(b.start_at));
}

const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function calendarDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(+date)) throw new Error('A valid event time is required.');
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
/** Stable UID lets calendar clients update a previously imported confirmed appointment. Explicit download only. */
export function buildCalendarInvite(input: { id: string; title: string; start_at: string; end_at: string; location?: string; updated_at?: string }): string {
  if (Date.parse(input.end_at) <= Date.parse(input.start_at)) throw new Error('Event must end after its start.');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TAAWUN//Student Calendar//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${escapeText(input.id.replace(/[\r\n]/g, ''))}@taawun`, `DTSTAMP:${calendarDate(input.updated_at || input.start_at)}`,
    `DTSTART:${calendarDate(input.start_at)}`, `DTEND:${calendarDate(input.end_at)}`, `SUMMARY:${escapeText(input.title)}`,
    `LOCATION:${escapeText(input.location || '')}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'];
  return lines.join('\r\n') + '\r\n';
}
export function downloadCalendarInvite(input: Parameters<typeof buildCalendarInvite>[0]): void {
  const url = URL.createObjectURL(new Blob([buildCalendarInvite(input)], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'taawun-appointment.ics'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
