'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createServer } = require('../server');
test('admin UI serves its login shell and health endpoint', async t => {
  const server = createServer(0); await new Promise(resolve => server.on('listening', resolve));
  t.after(() => server.close()); const port = server.address().port;
  const get = path => new Promise((resolve, reject) => http.get({ port, path }, res => { let body = ''; res.on('data', c => body += c); res.on('end', () => resolve({ status: res.statusCode, body })); }).on('error', reject));
  const page = await get('/'); assert.equal(page.status, 200); assert.match(page.body, /Conversational Workflow Admin/);
  assert.equal((await get('/health')).status, 200);
});
