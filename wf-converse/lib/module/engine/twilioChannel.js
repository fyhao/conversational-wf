var fs = require('fs');
var path = require('path');

var templateDir = path.join(__dirname, '..', 'twiliotemplate');

var readTemplate = function(templateName, done) {
	fs.readFile(path.join(templateDir, templateName), 'utf8', done);
};

var buildCallbackParams = function(ctx) {
	return 'app=' + ctx.vars.app + '&amp;sessionid=' + ctx.vars.sessionid;
};

module.exports = {
	create : function(ctx, opts) {
		opts = opts || {};
		var readFile = opts.readFile || fs.readFile;
		var baseTemplateDir = opts.templateDir || templateDir;
		var readTemplate = function(templateName, done) {
			readFile(path.join(baseTemplateDir, templateName), 'utf8', done);
		};
		return {
			steps : {
				say : function(step, checkNext) {
					readTemplate('saytemplate.xml', function(err, data) {
						if(err || typeof ctx.sendResponse != 'function') {
							return process.nextTick(checkNext);
						}
						data = data.replace('SAYTEXTPARAM', step.text);
						data = data.replace('CALLBACKPARAM', buildCallbackParams(ctx));
						ctx.sendResponse(data);
					});
					ctx.goNext = function() {
						process.nextTick(checkNext);
					};
				}
				,
				gather : function(step, checkNext) {
					readTemplate('gathertemplate.xml', function(err, data) {
						if(err || typeof ctx.sendResponse != 'function') {
							return process.nextTick(checkNext);
						}
						data = data.replace('SAYTEXTPARAM', step.text);
						data = data.replace('CALLBACKPARAM', buildCallbackParams(ctx));
						ctx.sendResponse(data);
					});
					ctx.goNext = function(opts) {
						if(opts && opts.req && opts.req.body && typeof opts.req.body.Digits != 'undefined') {
							ctx.vars[step.result] = opts.req.body.Digits;
						}
						process.nextTick(checkNext);
					};
				}
				,
				end : function(step, checkNext) {
					readTemplate('endtemplate.xml', function(err, data) {
						if(!err && typeof ctx.sendResponse == 'function') {
							ctx.sendResponse(data);
						}
						process.nextTick(checkNext);
					});
				}
			}
		};
	}
};
