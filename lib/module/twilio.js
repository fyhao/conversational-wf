var fs = require('fs');

var sessions = {};
var mod = {
	registerRouting : function(app) {
		console.log('register routing for type twilio')
		
		app.post('/twilio/entry', function(req, res) {
			if(typeof req.query.app == 'undefined') {
				return res.status(404).send('App not found');
			}
			
			triggerFlow(flows, 'entryFlow', function(ctx) {
				var sessionid = new Date().getTime();
				ctx.vars.sessionid = sessionid;
				ctx.vars.app = req.query.app;
				ctx.sendResponse = function(data) {
					console.log('entry ctx.sendResponse');
					res.status(200).send(data);
				};
				sessions[sessionid] = {response:'',ctx:ctx};
				/*
				fs.readFile('lib/module/twiliotemplate/entry.xml', 'utf8', function(err, data) {
					data = data.replace('CALLBACKPARAM', 'app=' + req.query.app + '&amp;sessionid=' + sessionid);
					loadTemplateIntoSession(sessionid, 'mainmenu', function() {
						res.status(200).send(data);
					});				
				});
				*/
			});
		});
		app.post('/twilio/callback', function(req, res) {
			if(typeof req.query.app == 'undefined') {
				return res.status(404).send('App not found');
			}
			if(typeof req.query.sessionid == 'undefined') {
				return res.status(404).send('sessionid not found');
			}
			var data = sessions[req.query.sessionid].response;
			var ctx = sessions[req.query.sessionid].ctx;
			console.log('Received twilio callback before ctx.sendResponse');
			ctx.sendResponse = function(data) {
				console.log('callback ctx.sendResponse');
				res.status(200).send(data);
			};
			ctx.goNext();
			/*
			data = data.replace('CALLBACKPARAM', 'app=' + req.query.app + '&amp;sessionid=' + req.query.sessionid);
			var laststate = sessions[req.query.sessionid].ctx.state;
			var nextstate = '';
			if(laststate == 'mainmenu') {
				nextstate = 'gather';
			}
			else if(laststate == 'gather') {
				nextstate = 'aftergather';
			}
			else {
				nextstate = 'gather';
			}
			console.log('laststate:' + laststate + ';nextstate=' + nextstate);
			loadTemplateIntoSession(req.query.sessionid, nextstate, function() {
				res.status(200).send(data);
			});	
			*/
		});
		app.post('/twilio/gather', function(req, res) {
			if(typeof req.query.app == 'undefined') {
				return res.status(404).send('App not found');
			}
			if(typeof req.query.sessionid == 'undefined') {
				return res.status(404).send('sessionid not found');
			}
			sessions[req.query.sessionid].ctx.gatheredDigits = req.body.Digits;
			var data = sessions[req.query.sessionid].response;
			var ctx = sessions[req.query.sessionid].ctx;
			console.log('Received twilio gather before ctx.sendResponse');
			ctx.sendResponse = function(data) {
				console.log('gather ctx.sendResponse');
				res.status(200).send(data);
			};
			ctx.goNext({req});
			/*
			var data = sessions[req.query.sessionid].response;
			data = data.replace('CALLBACKPARAM', 'app=' + req.query.app + '&amp;sessionid=' + req.query.sessionid);
			loadTemplateIntoSession(req.query.sessionid, 'mainmenu', function() {
				res.status(200).send(data);
			});
			*/
		});
		app.get('/twilio/testctx', function(req, res) {
			if(typeof req.query.sessionid == 'undefined') {
				return res.status(404).send('sessionid not found');
			}
			res.status(200).json(sessions[req.query.sessionid].ctx);
		});
	}
}

var loadTemplateIntoSession = function(sessionid, template, done) {
	fs.readFile('lib/module/twiliotemplate/' + template + '.xml', 'utf8', function(err, data) {
		sessions[sessionid].response = data;
		sessions[sessionid].ctx.state = template;
		done();
	});
}

var modFlow = ProjRequire('./lib/module/engine/modFlow');
var triggerFlow = function(flows, flow, fn) {
	var ctx = {}; // context object
	ctx.vars = {};
	ctx.flows = flows;
	ctx._logs = [];
	ctx.props = {};
	ctx.FLOW_ENGINE_CANCELED_notification_queues = [];
	
	ctx.enable_FLOW_ENGINE_CANCELLED = function() {
		var queues = ctx.FLOW_ENGINE_CANCELED_notification_queues;
		if(queues && queues.length) {
			for(var i = 0; i < queues.length; i++) {
				queues[i]();
			}
		}
	}
	ctx.createFlowEngine = function(flow) {
		if(typeof flow != 'undefined') {
			if(typeof flow == 'object') {
				// flow object
				return new modFlow.FlowEngine(flow).setContext(ctx);
			}
			else if(typeof flow == 'string') {
				// flow name
				if(typeof ctx.flows[flow] != 'undefined') {
					return new modFlow.FlowEngine(ctx.flows[flow]).setContext(ctx);
				}
			}
		}
		// return dummy function for silent execution
		return {
			execute : function(next) {
				if(next.length == 1) {
					setTimeout(function() {
						next({});
					}, 1);
				}
				else {
					setTimeout(next, 1);
				}
			}
			,
			setInputVars : function(_vars){
				return this;
			}
		};
	}
	fn(ctx);
	console.log('Flow execution started');
	ctx.createFlowEngine(flow).execute(function() {
		console.log('Flow execution done');
	});
}
var registeredEndpoints = [];
var registerApps = null;
var EventManager = function() {
	var listeners = [];
	this.init = function() {
		listeners = [];
	}
	this.registerEventHandler = function(name, fn) {
		listeners.push({name:name,fn:fn});
	}
	this.triggerConf = function(name, conf) {
		listeners.forEach(function(i) {
			if(i.name == name) {
				i.fn(conf);
			}
		});
	}
	this.trigger = function(name, opts) {
		listeners.forEach(function(i) {
			if(i.name == name) {
				i.fn(opts);
			}
		});
	}
}
var eventMgr = new EventManager();

module.exports = mod;

var flows = {
	'entryFlow': {
		'steps' : [
			{'type':'say','text':'Welcome text'},
			{'type':'mainMenu'},
		]
	},
	'mainMenu': {
		'steps' : [
			{'type':'say','text':'The main menu'},
			{'type':'gather','text':'Please press 2 or say sales for sales.','result':'result'},
			{'type':'say','text':'You had selected {{result}}'},
			{'type':'say','text':'The main menu'},
			{'type':'end'},
		]
	}
};

/* 
// Demo apps, tested with twilio ok

var flows = {
	'entryFlow': {
		'steps' : [
			{'type':'say','text':'Welcome to A B C Banking Service.'},
			{'type':'say','text':'A B C promotion message.'},
			{'type':'mainMenu'},
		]
	},
	'mainMenu': {
		'steps' : [
			{'type':'gather','text':'Please press 1 for account service. Please press 2 for fund transfer service. Please press 3 to go back to main menu. Press 4 to end the call.','result':'result'},
			{'type':'setVar','name':'nextMenu','value':'mainMenu'},
			{'type':'setVar','name':'nextMenu','value':'{{result == "1" ? "menu_account" : nextMenu}}'},
			{'type':'setVar','name':'nextMenu','value':'{{result == "2" ? "menu_fundtransfer" : nextMenu}}'},
			{'type':'setVar','name':'nextMenu','value':'{{result == "3" ? "mainMenu" : nextMenu}}'},
			{'type':'setVar','name':'nextMenu','value':'{{result == "4" ? "endCall" : nextMenu}}'},
			{'type':'{{nextMenu}}'},
		]
	},
	'menu_account': {
		'steps' : [
			{'type':'gather','text':'Please press 1 for check account balance. Press 2 to go back to main menu','result':'result'},
			{'type':'setVar','name':'nextMenu','value':'menu_account'},
			{'type':'setVar','name':'nextMenu','value':'{{result == "1" ? "menu_accountbalance" : nextMenu}}'},
			{'type':'setVar','name':'nextMenu','value':'{{result == "2" ? "mainMenu" : nextMenu}}'},
			{'type':'{{nextMenu}}'},
		]
	},
	'menu_accountbalance': {
		'steps' : [
			{'type':'gather','text':'Enter first number','result':'firstNumber'},
			{'type':'gather','text':'Enter second number','result':'secondNumber'},
			{'type':'say','text':'Your account balance is {{parseInt(firstNumber) + parseInt(secondNumber)}}'},
			{'type':'mainMenu'},
		]
	},
	'menu_fundtransfer': {
		'steps' : [
			{'type':'say','text':'Fund transfer menu'},
			{'type':'mainMenu'},
		]
	},
	'endCall': {
		'steps' : [
			{'type':'say','text':'Good Bye.'},
			{'type':'end'}
		]
	},
};
*/