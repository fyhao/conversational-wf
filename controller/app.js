'use strict';
const { createServer } = require('./server');
createServer({ port: process.env.PORT || 8082 });
