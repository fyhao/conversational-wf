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
		console.log('end text: ' + text);
		fs.readFile('lib/module/twiliotemplate/endtemplate.xml', 'utf8', function(err, data) {
			ctx.sendResponse(data);
			process.nextTick(checkNext);
		});
	}
}

