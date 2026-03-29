var assert = require('assert');

describe('workflow runtime helper', function() {
	it('creates a reusable flow context with nested flow execution', function(done) {
		var runtime = require('../lib/module/engine/runtime');
		var ctx = runtime.createContext({
			flows : {
				parentFlow : {
					steps : [
						{ type : 'setVar', name : 'prefix', value : 'root' },
						{ type : 'childFlow', suffix : 'tail' }
					]
				},
				childFlow : {
					steps : [
						{ type : 'setVar', local : true, name : 'ephemeral', value : 'inner' },
						{ type : 'setVar', name : 'combined', value : '{{prefix}}-{{suffix}}-{{ephemeral}}' }
					]
				}
			}
		});

		ctx.createFlowEngine('parentFlow').execute(function() {
			assert.equal(ctx.vars.prefix, 'root');
			assert.equal(ctx.vars.combined, 'root-tail-inner');
			done();
		});
	});
});

describe('twilio channel adapter', function() {
	it('renders say, gather, and end templates through the channel handler', function(done) {
		var twilioChannel = require('../lib/module/engine/twilioChannel');
		var responses = [];
		var ctx = {
			vars : {
				app : 'HelloWorld',
				sessionid : '12345'
			},
			sendResponse : function(data) {
				responses.push(data);
			}
		};
		var channel = twilioChannel.create(ctx, {
			readFile : function(file, encoding, cb) {
				var templates = {
					'saytemplate.xml' : '<Say>SAYTEXTPARAM</Say><Redirect>/twilio/callback?CALLBACKPARAM</Redirect>',
					'gathertemplate.xml' : '<Gather><Say>SAYTEXTPARAM</Say></Gather>',
					'endtemplate.xml' : '<Hangup/>'
				};
				cb(null, templates[file.split('/').pop()]);
			}
		});

		channel.steps.say({ text : 'Hello' }, function() {
			channel.steps.gather({ text : 'Press 1', result : 'digits' }, function() {
				assert.equal(ctx.vars.digits, '7');
				channel.steps.end({}, function() {
					assert.equal(responses[0].indexOf('<Say>Hello</Say>') > -1, true);
					assert.equal(responses[0].indexOf('app=HelloWorld&amp;sessionid=12345') > -1, true);
					assert.equal(responses[1].indexOf('<Gather><Say>Press 1</Say></Gather>') > -1, true);
					assert.equal(responses[2].indexOf('<Hangup/>') > -1, true);
					done();
				});
			});
			ctx.goNext({ req : { body : { Digits : '7' } } });
		});
		ctx.goNext();
	});
});
