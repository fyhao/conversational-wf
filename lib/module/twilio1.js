var fs = require('fs');

var sessions = {};
var mod = {
	registerRouting : function(app) {
		console.log('register routing for type twilio')
		
		app.post('/twilio/entry', function(req, res) {
			if(typeof req.query.app == 'undefined') {
				return res.status(404).send('App not found');
			}
			var sessionid = new Date().getTime();
			sessions[sessionid] = {response:'',ctx:{}};
			fs.readFile('lib/module/twiliotemplate/entry.xml', 'utf8', function(err, data) {
				data = data.replace('CALLBACKPARAM', 'app=' + req.query.app + '&amp;sessionid=' + sessionid);
				loadTemplateIntoSession(sessionid, 'mainmenu', function() {
					res.status(200).send(data);
				});				
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
			data = data.replace('CALLBACKPARAM', 'app=' + req.query.app + '&amp;sessionid=' + req.query.sessionid);
			loadTemplateIntoSession(req.query.sessionid, 'mainmenu', function() {
				res.status(200).send(data);
			});	
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
var triggerFlow = function(flows, flow) {
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
	ctx.createFlowEngine(flow).execute(function() {});
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