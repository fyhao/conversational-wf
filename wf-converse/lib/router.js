
var router = function(app) {
	var controlModule = ProjRequire('lib/module/control');
	app.post('/control/deploy', controlModule.deploy);
	app.get('/control/health', controlModule.health);
	controlModule.registerRouting(app);
	
	var twilioModule = ProjRequire('lib/module/twilio');
	twilioModule.registerRouting(app);
}
module.exports = router;
