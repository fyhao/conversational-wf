'use strict';

const crypto = require('crypto');
const http = require('http');
const { URL } = require('url');

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (error) { reject(error); }
    });
  });
}

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': process.env.ADMIN_UI_ORIGIN || 'http://localhost:8080',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(body));
}

function createController(options) {
  options = options || {};
  const apps = new Map();
  const username = options.username || process.env.CONTROLLER_USERNAME || 'admin';
  const password = options.password || process.env.CONTROLLER_PASSWORD || 'change-me';
  const secret = options.secret || process.env.CONTROLLER_TOKEN_SECRET || 'development-only-secret';
  const engineUrl = options.engineUrl || process.env.WORKFLOW_ENGINE_URL || 'http://workflow-engine:8081';

  function createToken() {
    return crypto.createHmac('sha256', secret).update(username).digest('base64url');
  }
  function authorized(req) {
    return req.headers.authorization === 'Bearer ' + createToken();
  }
  function publish(app) {
    const endpoint = new URL('/control/deploy', engineUrl);
    const body = JSON.stringify({ conf: {
      action: 'deployApp', app: app.id, flows: app.flows || {}, listeners: app.listeners || []
    } });
    return new Promise((resolve, reject) => {
      const request = http.request({
        protocol: endpoint.protocol, hostname: endpoint.hostname, port: endpoint.port,
        path: endpoint.pathname, method: 'POST', headers: {
          'content-type': 'application/json', 'content-length': Buffer.byteLength(body)
        }
      }, response => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) return resolve();
          reject(new Error('Workflow engine returned ' + response.statusCode + ': ' + data));
        });
      });
      request.on('error', reject);
      request.end(body);
    });
  }

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, { status: 0, service: 'controller' });
    }
    if (req.method === 'POST' && url.pathname === '/auth/login') {
      try {
        const credentials = await readJson(req);
        if (credentials.username !== username || credentials.password !== password) {
          return send(res, 401, { error: 'invalid credentials' });
        }
        return send(res, 200, { token: createToken(), tokenType: 'Bearer' });
      } catch (_) { return send(res, 400, { error: 'invalid JSON' }); }
    }
    if (!authorized(req)) return send(res, 401, { error: 'authorization required' });

    if (req.method === 'GET' && url.pathname === '/apps') {
      return send(res, 200, { apps: Array.from(apps.values()) });
    }
    if (req.method === 'POST' && url.pathname === '/apps') {
      try {
        const app = await readJson(req);
        if (!app.id || typeof app.id !== 'string') return send(res, 400, { error: 'app.id is required' });
        if (apps.has(app.id)) return send(res, 409, { error: 'app already exists' });
        apps.set(app.id, { id: app.id, flows: app.flows || {}, listeners: app.listeners || [] });
        return send(res, 201, { app: apps.get(app.id) });
      } catch (_) { return send(res, 400, { error: 'invalid JSON' }); }
    }
    const match = url.pathname.match(/^\/apps\/([^/]+)(\/publish)?$/);
    if (!match) return send(res, 404, { error: 'not found' });
    const id = decodeURIComponent(match[1]);
    const app = apps.get(id);
    if (!app) return send(res, 404, { error: 'app not found' });
    if (match[2] && req.method === 'POST') {
      try { await publish(app); return send(res, 200, { status: 'published', app: app }); }
      catch (error) { return send(res, 502, { error: error.message }); }
    }
    if (req.method === 'GET') return send(res, 200, { app: app });
    if (req.method === 'PUT') {
      try {
        const update = await readJson(req);
        const next = { id: id, flows: update.flows || {}, listeners: update.listeners || [] };
        apps.set(id, next);
        return send(res, 200, { app: next });
      } catch (_) { return send(res, 400, { error: 'invalid JSON' }); }
    }
    if (req.method === 'DELETE') { apps.delete(id); return send(res, 204, {}); }
    return send(res, 405, { error: 'method not allowed' });
  };
}

function createServer(options) {
  const server = http.createServer(createController(options));
  if (options && options.listen === false) return server;
  server.listen((options && options.port) || process.env.PORT || 8082);
  return server;
}

module.exports = { createController, createServer };
