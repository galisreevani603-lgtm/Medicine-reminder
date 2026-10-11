import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app.js';
import { createServer } from 'node:http';

test('health endpoint reports the API online', async () => {
  const server=createServer(app); await new Promise(resolve=>server.listen(0,resolve));
  try { const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/health`); const body=await res.json(); assert.equal(res.status,200); assert.equal(body.data.status,'ONLINE'); }
  finally { await new Promise(resolve=>server.close(resolve)); }
});
test('auth rejects malformed registration input', async () => {
  const server=createServer(app); await new Promise(resolve=>server.listen(0,resolve));
  try { const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/register`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'A',email:'bad',password:'x'})}); assert.equal(res.status,422); }
  finally { await new Promise(resolve=>server.close(resolve)); }
});
