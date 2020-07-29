var dbLib = ProjRequire('./lib/dbLib.js');
var fs = require('fs');
module.exports = {
	spec : function() {
		return {
			name : 'sql',
			desc : 'To run SQL over database, support MSSQL, MYSQL.',
			fields : [
			{type:'string',name:'ds',description:'The datasource',required:true},
			{type:'string',name:'sql',description:'The SQL to execute',required:true},
			{type:'array',name:'recordsets',description:'If it is SELECT query, here to access the recordsets data'}
			]
		}
	}
	,
	process : function(ctx, step, checkNext) {
		var text = step.text;
		console.log('gather text: ' + text);
		fs.readFile('lib/module/twiliotemplate/gathertemplate.xml', 'utf8', function(err, data) {
			data = data.replace('SAYTEXTPARAM', step.text);
			data = data.replace('CALLBACKPARAM', 'app=' + ctx.vars.app + '&amp;sessionid=' + ctx.vars.sessionid);
			ctx.sendResponse(data);
		});
		ctx.goNext = function(opts) {
			if(typeof opts.req != 'undefined') {
				if(typeof opts.req.body.Digits != 'undefined') {
					ctx.vars[step.result] = opts.req.body.Digits;
				}
			}
			process.nextTick(checkNext);
		};
	}
}

