module.exports = {
	process : function(ctx, step, checkNext) {
		if(typeof step.method === 'undefined') step.method = 'GET';
		var frequestObj = {
			url : step.url,
			method : step.method
		};
		frequestObj.errorCallback = function() {
			process.nextTick(checkNext);
		}
		if(typeof step.params !== 'undefined') frequestObj.params = step.params;
		if(typeof step.headers !== 'undefined') frequestObj.headers = step.headers;
		if(typeof step.varResponse !== 'undefined') {
			frequestObj.callback = function(body, response) {
				ctx.vars[step.varResponse] = response;
				process.nextTick(checkNext);
			}
		}
		else if(typeof step.varJson !== 'undefined') {
			frequestObj.callbackJSON = function(json) {
				ctx.vars[step.varJson] = json;
				process.nextTick(checkNext);
			}
		}
		else if(typeof step.var !== 'undefined') {
			frequestObj.callback = function(body) {
				ctx.vars[step.var] = body;
				process.nextTick(checkNext);
			}
		}
		else {
			process.nextTick(checkNext);
			return;
		}
		frequest(frequestObj);
	}
}


var frequest = function(args) {
	var method = (args.method || 'GET').toUpperCase();
	var headers = args.headers || {};
	if(typeof headers == 'string') {
		try { headers = JSON.parse(headers); }
		catch (e) { headers = {}; }
	}
	var url = args.url;
	var options = {method:method, headers:headers};
	if(args.params) {
		if(method == 'GET') {
			var query = typeof args.params == 'string' ? args.params : new URLSearchParams(args.params).toString();
			url += (url.indexOf('?') == -1 ? '?' : '&') + query;
		}
		else {
			options.body = typeof args.params == 'string' ? args.params : JSON.stringify(args.params);
			if(!options.headers['content-type']) options.headers['content-type'] = 'application/json';
		}
	}
	fetch(url, options).then(function(response) {
		return response.text().then(function(body) {
			var resp = {status:response.status, ok:response.ok, headers:Object.fromEntries(response.headers), body:body};
			if(args.callback) {
				if(args.callback.length == 2) args.callback(body, resp);
				else args.callback(body);
			}
			if(args.callbackJSON) {
				try {
					var json = JSON.parse(body);
					if(args.callbackJSON.length == 2) args.callbackJSON(json, resp);
					else args.callbackJSON(json);
				} catch (e) {
					if(args.errorCallback) args.errorCallback(e);
				}
			}
		});
	}).catch(function(error) {
		if(args.errorCallback) args.errorCallback(error);
	});
}
