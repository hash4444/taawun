export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function requireRole(roles: string[], allowed: string[]) {
  if (!roles.some(role => allowed.includes(role))) throw new HttpError(403, 'This account cannot use this feature');
}
export function requireCron(secret: string | undefined, supplied: string | null, enabled: boolean) {
  if (!enabled || !secret || secret.length < 32 || !supplied || !constantTimeEqual(secret, supplied)) throw new HttpError(401, 'Unauthorized scheduler');
}
export function constantTimeEqual(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}
export function boundedLimit(value: unknown, maximum: number) {
  if (value === undefined) return maximum;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > maximum) throw new HttpError(400, `Limit must be between 1 and ${maximum}`);
  return value;
}
export async function readBody(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'JSON content required');
  if (Number(req.headers.get('content-length')) > 32768) throw new HttpError(413, 'Request is too large');
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body required');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 32768) { await reader.cancel(); throw new HttpError(413, 'Request is too large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new HttpError(400, 'Invalid JSON object'); }
}
export function validateMessages(value: unknown): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new HttpError(400, 'Provide 1 to 20 messages');
  let size = 0;
  const messages = value.map((message: unknown) => {
    const m = message as { role?: unknown; content?: unknown };
    if (!m || !['user', 'assistant'].includes(String(m.role)) || typeof m.content !== 'string' || !m.content.trim()) throw new HttpError(400, 'Invalid message');
    size += m.content.length;
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });
  if (size > 16000) throw new HttpError(413, 'Conversation is too long');
  return messages;
}
