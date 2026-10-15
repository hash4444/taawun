import { describe, expect, it, vi } from 'vitest';
import { CALENDAR_PROVIDER_SETUP, CalendarProviderError, createCalendarBusyReader, fetchGoogleBusyTime, fetchMicrosoftBusyTime } from '../../supabase/functions/_shared/calendar-providers';

const timeMin = '2026-10-15T00:00:00Z', timeMax = '2026-10-17T00:00:00Z';
const request = (fetcher: typeof fetch) => ({ accessToken: 'private-access-token', timeMin, timeMax, fetcher });
const json = (data: unknown, status = 200, headers?: HeadersInit) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const google = (calendars: unknown) => ({ timeMin, timeMax, calendars });
const block = (start: string, end: string) => ({ start, end });
const event = (start: string, end: string, extra: Record<string, unknown> = {}) => ({ start: { dateTime: start, timeZone: 'UTC' }, end: { dateTime: end, timeZone: 'UTC' }, showAs: 'busy', isCancelled: false, ...extra });

describe('prepared calendar provider connections', () => {
  it('is disabled by default and documents only read-only delegated permissions', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(createCalendarBusyReader()('google', request(fetcher))).rejects.toMatchObject({ code: 'not_configured' });
    expect(fetcher).not.toHaveBeenCalled();
    expect(CALENDAR_PROVIDER_SETUP.google.scopes).toEqual(['https://www.googleapis.com/auth/calendar.freebusy']);
    expect(CALENDAR_PROVIDER_SETUP.microsoft.scopes).toEqual(['Calendars.ReadBasic']);
  });
  it('rejects unbounded, backwards or timezone-less requests before any HTTP call', async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const input of [{ timeMax: '2028-01-01T00:00:00Z' }, { timeMax: timeMin }, { timeMin: '2026-10-15T00:00:00' }]) await expect(fetchGoogleBusyTime({ ...request(fetcher), ...input })).rejects.toMatchObject({ code: 'invalid_request' });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('fails before fetching if cancelled and never returns private token text on network errors', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('private-access-token private calendar title'));
    const controller = new AbortController(); controller.abort();
    await expect(fetchGoogleBusyTime({ ...request(fetcher), signal: controller.signal })).rejects.toMatchObject({ code: 'aborted' });
    expect(fetcher).not.toHaveBeenCalled();
    const error = await fetchGoogleBusyTime(request(fetcher)).catch(value => value);
    expect(error).toBeInstanceOf(CalendarProviderError); expect(error.code).toBe('network_error');
    expect(error.message).not.toContain('private-access-token'); expect(error.message).not.toContain('private calendar title');
  });
});

describe('Google read-only FreeBusy', () => {
  it('posts an explicit range, clips and merges busy intervals, and returns no titles or credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(google({ primary: { busy: [block('2026-10-14T23:00:00Z', '2026-10-15T02:00:00Z'), block('2026-10-15T01:00:00Z', '2026-10-15T03:00:00Z')] } })));
    const result = await fetchGoogleBusyTime(request(fetcher));
    expect(result).toEqual([{ start_at: '2026-10-15T00:00:00.000Z', end_at: '2026-10-15T03:00:00.000Z', busy: true }]);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://www.googleapis.com/calendar/v3/freeBusy');
    expect(init?.method).toBe('POST'); expect(init?.redirect).toBe('error');
    expect(JSON.parse(String(init?.body))).toMatchObject({ timeMin: '2026-10-15T00:00:00.000Z', timeZone: 'UTC', items: [{ id: 'primary' }] });
    expect(JSON.stringify(result)).not.toContain('private-access-token');
  });
  it('fails closed on missing calendars, partial errors and invalid busy times', async () => {
    for (const calendars of [{}, { primary: { busy: [], errors: [{ reason: 'notFound' }] } }, { primary: { busy: [block('invalid', '2026-10-15T03:00:00Z')] } }]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(google(calendars)));
      await expect(fetchGoogleBusyTime(request(fetcher))).rejects.toBeInstanceOf(CalendarProviderError);
    }
  });
  it('rejects incomplete response horizons instead of implying unsynchronized time is free', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ ...google({ primary: { busy: [] } }), timeMax: '2026-10-16T00:00:00Z' }));
    await expect(fetchGoogleBusyTime(request(fetcher))).rejects.toMatchObject({ code: 'invalid_response' });
  });
  it.each([[401, 'unauthorized'], [403, 'forbidden'], [429, 'rate_limited'], [503, 'provider_error']] as const)('handles HTTP %s without retries or raw response disclosure', async (status, code) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ secret: 'private-access-token' }, status, { 'Retry-After': '60' }));
    const error = await fetchGoogleBusyTime(request(fetcher)).catch(value => value);
    expect(error).toMatchObject({ code, status, retryAfterSeconds: 60 });
    expect(error.message).not.toContain('private-access-token'); expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('Microsoft delegated calendarView', () => {
  it('follows bounded pages, requests only required fields and treats tentative periods as busy', async () => {
    const next = 'https://graph.microsoft.com/v1.0/me/calendar/calendarView?$skiptoken=page2';
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ value: [event('2026-10-15T10:00:00.0000000', '2026-10-15T11:00:00.0000000', { subject: 'Private class', body: 'Never save this' })], '@odata.nextLink': next }))
      .mockResolvedValueOnce(json({ value: [event('2026-10-15T11:00:00', '2026-10-15T12:00:00', { showAs: 'tentative' }), event('2026-10-16T10:00:00', '2026-10-16T11:00:00', { showAs: 'free' }), event('2026-10-16T11:00:00', '2026-10-16T12:00:00', { isCancelled: true })] }));
    const result = await fetchMicrosoftBusyTime(request(fetcher));
    expect(result).toEqual([{ start_at: '2026-10-15T10:00:00.000Z', end_at: '2026-10-15T12:00:00.000Z', busy: true }]);
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get('$select')).toBe('start,end,showAs,isCancelled');
    expect(fetcher.mock.calls[1][0]).toBe(next);
    expect(JSON.stringify(result)).not.toContain('Private class'); expect(JSON.stringify(result)).not.toContain('Never save');
  });
  it('includes all-day busy periods and clips them to the requested range', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ value: [event('2026-10-14T00:00:00', '2026-10-16T00:00:00', { isAllDay: true })] }));
    expect(await fetchMicrosoftBusyTime(request(fetcher))).toEqual([{ start_at: '2026-10-15T00:00:00.000Z', end_at: '2026-10-16T00:00:00.000Z', busy: true }]);
  });
  it('rejects token-exfiltration, other-account and insecure next-page links', async () => {
    for (const next of ['https://evil.example/steal', 'http://graph.microsoft.com/v1.0/me/calendar/calendarView', 'https://graph.microsoft.com/v1.0/users/another-user/calendarView']) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ value: [], '@odata.nextLink': next }));
      await expect(fetchMicrosoftBusyTime(request(fetcher))).rejects.toMatchObject({ code: 'invalid_response' });
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it('detects pagination cycles and returns no partial success when a later page fails', async () => {
    const next = 'https://graph.microsoft.com/v1.0/me/calendar/calendarView?$skiptoken=repeat';
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ value: [], '@odata.nextLink': next }));
    await expect(fetchMicrosoftBusyTime(request(fetcher))).rejects.toMatchObject({ code: 'pagination_limit' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const denied = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ value: [event('2026-10-15T10:00:00', '2026-10-15T11:00:00')], '@odata.nextLink': next })).mockResolvedValueOnce(json({}, 401));
    await expect(fetchMicrosoftBusyTime(request(denied))).rejects.toMatchObject({ code: 'unauthorized' });
  });
  it('fails on unexpected response timezones and malformed JSON', async () => {
    const unexpected = vi.fn<typeof fetch>().mockResolvedValue(json({ value: [{ start: { dateTime: '2026-10-15T10:00:00', timeZone: 'Pacific Standard Time' }, end: { dateTime: '2026-10-15T11:00:00', timeZone: 'Pacific Standard Time' } }] }));
    await expect(fetchMicrosoftBusyTime(request(unexpected))).rejects.toMatchObject({ code: 'invalid_response' });
    const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response('not json'));
    await expect(fetchMicrosoftBusyTime(request(malformed))).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
