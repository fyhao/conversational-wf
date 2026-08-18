function createServer(opts) {
	if(typeof opts == 'undefined') opts = {};
	var port = 8081; // default port
	if(typeof opts['port'] != 'undefined') port = opts['port'];
	const express = require('express')
	const app = express()
	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())

	var path = require('path');
	global.ProjRequire = function(module) {
		return require(path.join(__dirname, '/' + module)); 
	}
	app.get('/', (req, res) => res.send('Hello World!'))

	const router = ProjRequire('./lib/router');
	router(app);

	var server = app.listen(port, () => console.log('wf-converse server listening on port ' + port + '!'))
	return server;

}

module.exports = createServer;
