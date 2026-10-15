import { handleEdge } from '../_shared/runtime.ts';
Deno.serve((req) => handleEdge(req, 'job_hunter'));
