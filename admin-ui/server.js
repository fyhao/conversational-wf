'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');

function createServer(port) {
  return http.createServer((req, res) => {
    if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"status":0,"service":"admin-ui"}'); }
    const filename = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
    const file = path.join(__dirname, 'public', filename);
    if (!file.startsWith(path.join(__dirname, 'public'))) { res.writeHead(400); return res.end(); }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': filename.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8' });
      res.end(data);
    });
  }).listen(port || process.env.PORT || 8080);
}
if (require.main === module) createServer();
module.exports = { createServer };
