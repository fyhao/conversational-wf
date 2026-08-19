'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createServer } = require('../server');

function request(port, path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body && JSON.stringify(body);
    const req = http.request({ port, path, method, headers: Object.assign(
      { 'content-type': 'application/json' }, data ? { 'content-length': Buffer.byteLength(data) } : {},
      token ? { authorization: 'Bearer ' + token } : {}
    ) }, res => {
      let result = ''; res.on('data', c => { result += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: result ? JSON.parse(result) : {} }));
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

test('controller authenticates, provisions, updates, and publishes an app', async t => {
  const engine = http.createServer((req, res) => { res.writeHead(200); res.end('{"status":0}'); });
  await new Promise(resolve => engine.listen(0, resolve));
  const controller = createServer({ listen: false, username: 'user', password: 'pass', secret: 'test-secret', engineUrl: 'http://127.0.0.1:' + engine.address().port });
  await new Promise(resolve => controller.listen(0, resolve));
  t.after(() => { controller.close(); engine.close(); });
  const port = controller.address().port;
  assert.equal((await request(port, '/apps', 'GET')).status, 401);
  const login = await request(port, '/auth/login', 'POST', { username: 'user', password: 'pass' });
  assert.equal(login.status, 200);
  const token = login.body.token;
  const created = await request(port, '/apps', 'POST', { id: 'pizza', flows: { start: { steps: [] } } }, token);
  assert.equal(created.status, 201);
  const updated = await request(port, '/apps/pizza', 'PUT', { listeners: [] }, token);
  assert.equal(updated.status, 200);
  assert.equal((await request(port, '/apps/pizza/publish', 'POST', null, token)).body.status, 'published');
  assert.equal((await request(port, '/apps/pizza', 'DELETE', null, token)).status, 204);
});
