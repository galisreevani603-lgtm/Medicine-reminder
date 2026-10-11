import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { createServer } from 'node:http';

test('schedule API is protected without an access token', async () => {
  const server=createServer(app); await new Promise(resolve=>server.listen(0,resolve));
  try { const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/schedules`); const body=await res.json(); assert.equal(res.status,401); assert.equal(body.success,false); }
  finally { await new Promise(resolve=>server.close(resolve)); }
});
