/** Prepared server-only calendar readers. OAuth setup, refresh-token storage and sync persistence are intentionally separate. */
import type { BusyEvent } from './availability.ts';

export type CalendarProvider = 'google' | 'microsoft';
export type CalendarBusyInterval = Required<BusyEvent>;
export const CALENDAR_PROVIDER_LIMITS = { horizonDays: 120, calendars: 20, graphPages: 20, rawIntervals: 5000, busyIntervals: 2000, requestTimeoutMs: 10000, totalTimeoutMs: 30000, responseBytes: 2 * 1024 * 1024 } as const;
export const CALENDAR_PROVIDER_SETUP = {
  google: {
    status: 'requires_setup', readOnly: true,
    scopes: ['https://www.googleapis.com/auth/calendar.freebusy'],
    endpoint: 'https://www.googleapis.com/calendar/v3/freeBusy',
    documentation: 'https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query',
  },
  microsoft: {
    status: 'requires_setup', readOnly: true,
    scopes: ['Calendars.ReadBasic'],
    endpoint: 'https://graph.microsoft.com/v1.0/me/calendar/calendarView',
    documentation: 'https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0',
  },
} as const;

type ErrorCode = 'not_configured' | 'invalid_request' | 'unauthorized' | 'forbidden' | 'rate_limited' | 'provider_error' | 'invalid_response' | 'too_many_events' | 'pagination_limit' | 'network_error' | 'request_timeout' | 'aborted';
export class CalendarProviderError extends Error {
  constructor(public code: ErrorCode, message: string, public status?: number, public retryAfterSeconds?: number) { super(message); this.name = 'CalendarProviderError'; }
}
export interface CalendarReadRequest {
  accessToken: string;
  timeMin: string;
  timeMax: string;
  /** Already authorized, explicitly selected Google calendar IDs; default is the account's primary calendar. */
  calendarIds?: string[];
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}
type Range = { start: number; end: number; timeMin: string; timeMax: string };
type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject => !!value && typeof value === 'object' && !Array.isArray(value);
function absoluteInstant(value: unknown): number {
  return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
}
function requestRange(request: CalendarReadRequest): Range {
  const start = absoluteInstant(request.timeMin), end = absoluteInstant(request.timeMax);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > CALENDAR_PROVIDER_LIMITS.horizonDays * 86400000) throw new CalendarProviderError('invalid_request', 'Select an absolute time range of at most 120 days.');
  if (!request.accessToken || /[\r\n]/.test(request.accessToken)) throw new CalendarProviderError('unauthorized', 'Calendar authorization is required.');
  return { start, end, timeMin: new Date(start).toISOString(), timeMax: new Date(end).toISOString() };
}
function retryAfter(response: Response): number | undefined {
  const header = response.headers.get('Retry-After');
  if (!header) return undefined;
  const seconds = /^\d+$/.test(header) ? Number(header) : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  return Number.isFinite(seconds) ? Math.max(0, Math.min(3600, seconds)) : undefined;
}
async function jsonRequest(url: string, init: RequestInit, request: CalendarReadRequest, deadline: number): Promise<JsonObject> {
  if (request.signal?.aborted) throw new CalendarProviderError('aborted', 'Calendar request was cancelled.');
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new CalendarProviderError('request_timeout', 'Calendar synchronization took too long. Try a smaller range.');
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  request.signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, Math.min(remaining, CALENDAR_PROVIDER_LIMITS.requestTimeoutMs));
  try {
    const response = await (request.fetcher || fetch)(url, { ...init, signal: controller.signal, redirect: 'error' });
    if (!response.ok) {
      const code = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : response.status === 429 ? 'rate_limited' : 'provider_error';
      const message = code === 'unauthorized' ? 'Calendar authorization expired. Reconnect your calendar.' : code === 'forbidden' ? 'Calendar access was denied. Check the read-only permission and selected calendar.' : code === 'rate_limited' ? 'Calendar provider request limit reached. Retry later.' : 'Calendar provider is unavailable. Retry later.';
      // Never echo provider response bodies: they can contain private data or credentials.
      throw new CalendarProviderError(code, message, response.status, retryAfter(response));
    }
    const declaredBytes = Number(response.headers.get('Content-Length') || 0);
    if (declaredBytes > CALENDAR_PROVIDER_LIMITS.responseBytes) throw new CalendarProviderError('too_many_events', 'Calendar response is too large. Select a smaller range.');
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > CALENDAR_PROVIDER_LIMITS.responseBytes) throw new CalendarProviderError('too_many_events', 'Calendar response is too large. Select a smaller range.');
    let data: unknown;
    try { data = JSON.parse(text); } catch { throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid response.'); }
    if (!object(data)) throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid response.');
    return data;
  } catch (error) {
    if (error instanceof CalendarProviderError) throw error;
    if (request.signal?.aborted) throw new CalendarProviderError('aborted', 'Calendar request was cancelled.');
    if (timedOut) throw new CalendarProviderError('request_timeout', 'Calendar synchronization timed out. Try again.');
    throw new CalendarProviderError('network_error', 'Calendar provider could not be reached. Try again.');
  } finally {
    clearTimeout(timeout);
    request.signal?.removeEventListener('abort', onAbort);
  }
}
function interval(start: unknown, end: unknown, range: Range): [number, number] | null {
  const a = absoluteInstant(start), b = absoluteInstant(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) throw new CalendarProviderError('invalid_response', 'Calendar provider returned invalid busy times.');
  const clipped: [number, number] = [Math.max(a, range.start), Math.min(b, range.end)];
  return clipped[1] > clipped[0] ? clipped : null;
}
function mergeBusy(intervals: [number, number][]): CalendarBusyInterval[] {
  const merged: [number, number][] = [];
  for (const current of intervals.sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && current[0] <= last[1]) last[1] = Math.max(last[1], current[1]); else merged.push([...current]);
  }
  if (merged.length > CALENDAR_PROVIDER_LIMITS.busyIntervals) throw new CalendarProviderError('too_many_events', 'Calendar contains more than 2,000 busy periods. Select a smaller range.');
  return merged.map(([a, b]) => ({ start_at: new Date(a).toISOString(), end_at: new Date(b).toISOString(), busy: true }));
}

/** Google FreeBusy returns no event titles or descriptions. Any per-calendar error fails the entire snapshot closed. */
export async function fetchGoogleBusyTime(request: CalendarReadRequest): Promise<CalendarBusyInterval[]> {
  const range = requestRange(request);
  const ids = [...new Set(request.calendarIds || ['primary'])];
  if (!ids.length || ids.length > CALENDAR_PROVIDER_LIMITS.calendars || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 512)) throw new CalendarProviderError('invalid_request', 'Select between 1 and 20 authorized calendars.');
  const data = await jsonRequest(CALENDAR_PROVIDER_SETUP.google.endpoint, {
    method: 'POST', headers: { Authorization: `Bearer ${request.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: range.timeMin, timeMax: range.timeMax, timeZone: 'UTC', calendarExpansionMax: 20, items: ids.map(id => ({ id })) }),
  }, request, Date.now() + CALENDAR_PROVIDER_LIMITS.totalTimeoutMs);
  if (!object(data.calendars) || absoluteInstant(data.timeMin) > range.start || absoluteInstant(data.timeMax) < range.end || !Number.isFinite(absoluteInstant(data.timeMin)) || !Number.isFinite(absoluteInstant(data.timeMax))) throw new CalendarProviderError('invalid_response', 'Calendar provider returned an incomplete time range.');
  if (object(data.groups) && Object.keys(data.groups).length) throw new CalendarProviderError('invalid_response', 'Calendar groups require a separate permission and selection workflow.');
  const intervals: [number, number][] = [];
  let raw = 0;
  for (const id of ids) {
    const calendar = data.calendars[id];
    if (!object(calendar) || !Array.isArray(calendar.busy) || (calendar.errors !== undefined && (!Array.isArray(calendar.errors) || calendar.errors.length > 0))) throw new CalendarProviderError('forbidden', 'A selected calendar could not be read. Check its access permission.');
    for (const block of calendar.busy) {
      if (++raw > CALENDAR_PROVIDER_LIMITS.rawIntervals) throw new CalendarProviderError('too_many_events', 'Calendar contains too many busy periods. Select a smaller range.');
      if (!object(block)) throw new CalendarProviderError('invalid_response', 'Calendar provider returned invalid busy times.');
      const value = interval(block.start, block.end, range); if (value) intervals.push(value);
    }
  }
  return mergeBusy(intervals);
}

function graphInstant(value: unknown): string {
  if (!object(value) || typeof value.dateTime !== 'string') throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid event time.');
  if (Number.isFinite(absoluteInstant(value.dateTime))) return value.dateTime;
  // The request explicitly asks Graph for UTC. Do not guess Windows/IANA zones on unexpected responses.
  if (!['UTC', 'Etc/UTC', 'GMT'].includes(String(value.timeZone))) throw new CalendarProviderError('invalid_response', 'Calendar provider did not return the requested UTC times.');
  return `${value.dateTime}Z`;
}
function graphNextLink(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid page link.');
  let url: URL;
  try { url = new URL(value); } catch { throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid page link.'); }
  if (url.origin !== 'https://graph.microsoft.com' || url.username || url.password || url.hash || !['/v1.0/me/calendar/calendarView', '/v1.0/me/calendarView'].includes(url.pathname)) throw new CalendarProviderError('invalid_response', 'Calendar provider returned an untrusted page link.');
  return url.toString();
}

/** Delegated Calendars.ReadBasic, default calendar only; expanded recurring instances and all-day events come from calendarView. */
export async function fetchMicrosoftBusyTime(request: CalendarReadRequest): Promise<CalendarBusyInterval[]> {
  const range = requestRange(request);
  if (request.calendarIds?.length) throw new CalendarProviderError('invalid_request', 'Microsoft currently supports the connected account primary calendar.');
  const initial = new URL(CALENDAR_PROVIDER_SETUP.microsoft.endpoint);
  initial.searchParams.set('startDateTime', range.timeMin); initial.searchParams.set('endDateTime', range.timeMax);
  initial.searchParams.set('$select', 'start,end,showAs,isCancelled'); initial.searchParams.set('$top', '250');
  const seen = new Set<string>(); const intervals: [number, number][] = [];
  const deadline = Date.now() + CALENDAR_PROVIDER_LIMITS.totalTimeoutMs;
  let next: string | null = initial.toString(), pages = 0, raw = 0;
  while (next) {
    if (++pages > CALENDAR_PROVIDER_LIMITS.graphPages || seen.has(next)) throw new CalendarProviderError('pagination_limit', 'Calendar pagination exceeded its safe limit. Select a smaller range.');
    seen.add(next);
    const data = await jsonRequest(next, { method: 'GET', headers: { Authorization: `Bearer ${request.accessToken}`, Prefer: 'outlook.timezone="UTC"' } }, request, deadline);
    if (!Array.isArray(data.value)) throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid event list.');
    for (const event of data.value) {
      if (++raw > CALENDAR_PROVIDER_LIMITS.rawIntervals) throw new CalendarProviderError('too_many_events', 'Calendar contains too many events. Select a smaller range.');
      if (!object(event)) throw new CalendarProviderError('invalid_response', 'Calendar provider returned an invalid event.');
      if (event.isCancelled === true || event.showAs === 'free') continue;
      // Unknown/tentative/out-of-office/working-elsewhere are conservatively treated as busy.
      const value = interval(graphInstant(event.start), graphInstant(event.end), range); if (value) intervals.push(value);
    }
    next = graphNextLink(data['@odata.nextLink']);
  }
  return mergeBusy(intervals);
}

/** Not an HTTP endpoint. A future authenticated server wrapper must opt providers in only after consent and credential setup. */
export function createCalendarBusyReader(configuration: Partial<Record<CalendarProvider, { enabled: boolean }>> = {}) {
  return async (provider: CalendarProvider, request: CalendarReadRequest): Promise<CalendarBusyInterval[]> => {
    if (configuration[provider]?.enabled !== true) throw new CalendarProviderError('not_configured', 'Direct calendar connection is awaiting provider and consent setup. Use an ICS import for now.');
    return provider === 'google' ? fetchGoogleBusyTime(request) : fetchMicrosoftBusyTime(request);
  };
}
