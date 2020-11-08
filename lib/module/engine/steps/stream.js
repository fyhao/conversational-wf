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
		console.log('stream url ' + step.url);
		fs.readFile('lib/module/twiliotemplate/stream.xml', 'utf8', function(err, data) {
			data = data.replace('URLPARAM', step.url);
			ctx.sendResponse(data);
		});
		ctx.goNext = function(opts) {
			process.nextTick(checkNext);
		};
	}
}

