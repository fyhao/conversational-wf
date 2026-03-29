var modFlow = require('./modFlow');

var createNoopEngine = function() {
	return {
		execute : function(next) {
			if(typeof next != 'function') {
				return;
			}
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
		setInputVars : function() {
			return this;
		}
	};
};

var createContext = function(opts) {
	if(typeof opts == 'undefined') opts = {};

	var ctx = {};
	ctx.req = opts.req;
	ctx.res = opts.res;
	ctx.vars = opts.vars || {};
	ctx.flows = opts.flows || {};
	ctx._logs = opts.logs || [];
	ctx.props = opts.props || {};
	ctx.FLOW_ENGINE_CANCELED_notification_queues = [];

	if(typeof opts.sendResponse == 'function') {
		ctx.sendResponse = opts.sendResponse;
	}
	if(typeof opts.goNext == 'function') {
		ctx.goNext = opts.goNext;
	}
	if(typeof opts.channel != 'undefined') {
		ctx.channel = opts.channel;
	}

	ctx.enable_FLOW_ENGINE_CANCELLED = function() {
		var queues = ctx.FLOW_ENGINE_CANCELED_notification_queues;
		if(queues && queues.length) {
			for(var i = 0; i < queues.length; i++) {
				queues[i]();
			}
		}
	};

	ctx.getStepProcessor = function(stepType) {
		if(!ctx.channel || !ctx.channel.steps) {
			return null;
		}
		if(typeof ctx.channel.steps[stepType] == 'function') {
			return ctx.channel.steps[stepType];
		}
		return null;
	};

	ctx.createFlowEngine = function(flow) {
		if(typeof flow != 'undefined') {
			if(typeof flow == 'object') {
				return new modFlow.FlowEngine(flow).setContext(ctx);
			}
			else if(typeof flow == 'string' && typeof ctx.flows[flow] != 'undefined') {
				return new modFlow.FlowEngine(ctx.flows[flow]).setContext(ctx);
			}
		}
		return createNoopEngine();
	};

	return ctx;
};

module.exports = {
	createContext : createContext,
	createNoopEngine : createNoopEngine
};
