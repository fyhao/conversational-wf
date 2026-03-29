var DataStore = ProjRequire('./lib/data-store.js');
var dataStore = new DataStore();
var runtime = require('./runtime');

var createHandler = function(eventMgr, appItem, appLi) {
	
	return function(req, res) {
		// get all flows definition and execute
		//appItem.flows
		//appLi.flow (string)
		createContext(appItem.app, req, res).then(function(ctx) {
			ctx.createFlowEngine(appLi.flow).execute(function() {
				eventMgr.trigger('flowExecutedDone', {ctx:ctx});
				if(typeof analytic.flows[appLi.flow] == 'undefined') {
					analytic.flows[appLi.flow] = 0;
				}
				analytic.flows[appLi.flow]++;
				analytic.requestCount++;
			});
		});
	}
}
var dataStore_getApps = dataStore.getApps;
var createContext = function(app, req, res) {
	return new Promise(function(resolve,reject) {
		dataStore_getApps().then(function(apps) {
			apps.forEach(function(appItem) {
				if(appItem.app == app) {
					resolve(runtime.createContext({
						req : req,
						res : res,
						flows : appItem.flows
					}));
				}
			});
		});
	});
}
var _injectUnitTest = function(opts) {
	dataStore_getApps = function() {
		return new Promise(function(resolve,reject) {
			var apps = opts.apps
			resolve(apps);
		});
	}
}
var analytic = {
	flows : {},
	requestCount : 0
};
module.exports.analytic = analytic;
module.exports.createHandler = createHandler;
module.exports._injectUnitTest = _injectUnitTest;
