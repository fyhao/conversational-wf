var assert = require('assert');
var request = require('supertest');

var parseString = require('xml2js').parseString;

describe('loading express', function () {
  var server;
  before(function () {
    server = require('../server', { bustCache: true })();
  });
  after(function (done) {
    server.close(done);
  });
  it('responds to /', function testSlash(done) {
    request(server)
      .get('/')
      .expect(200, done);
  });
  it('404 everything else', function testPath(done) {
    console.log('test 404')
    request(server)
      .get('/foo/bar')
      .expect(404, done);
  });
  
});
describe('loading twilio server', function () {
  var server;
  before(function () {
    server = require('../server', { bustCache: true })();
  });
  after(function (done) {
    server.close(done);
  });
  
  it('twilio: entry - invalid 404', function test(done) {
	 request(server)
      .post('/twilio/entry')
	  .expect(404, done)
  });
  var sessionid = null;
  it('twilio: entry - response 200', function test() {
	return request(server)
      .post('/twilio/entry?app=HelloWorld')
	  .expect(200)
	  .expect(function(res) {
		  var xml = res.text;
		 parseString(xml, function (err, result) {
			var expected = {"Response":{"Say":["Welcome text"],"Redirect":["/twilio/callback?app=HelloWorld&sessionid=1593344474091"]}}
			assert.equal(result.Response.Say[0], expected.Response.Say[0]);
			assert.equal(result.Response.Redirect[0].indexOf('/twilio/callback') == 0, true);
			assert.equal(result.Response.Redirect[0].indexOf('app=HelloWorld&sessionid=') > -1, true);
			sessionid = result.Response.Redirect[0].substring(result.Response.Redirect[0].indexOf('sessionid=') + "sessionid=".length);
			assert.equal(sessionid.length > 0, true);
		});
	  });
  });
  it('twilio: callback - response 200', function test() {
	return request(server)
      .post('/twilio/callback?app=HelloWorld&sessionid=' + sessionid)
	  .expect(200)
	  .expect(function(res) {
		  var xml = res.text;
		  parseString(xml, function (err, result) {
			assert.equal(result.Response.Say[0], 'The main menu');
			assert.equal(result.Response.Redirect[0].indexOf('/twilio/callback') == 0, true);
			assert.equal(result.Response.Redirect[0].indexOf('app=HelloWorld&sessionid=') > -1, true);
			sessionid = result.Response.Redirect[0].substring(result.Response.Redirect[0].indexOf('sessionid=') + "sessionid=".length);
			assert.equal(sessionid.length > 0, true);
		});
	  });
  });
  it('twilio: callback - with gather menu 200', function test() {
	return request(server)
      .post('/twilio/callback?app=HelloWorld&sessionid=' + sessionid)
	  .expect(200)
	  .expect(function(res) {
		  var xml = res.text;
		  parseString(xml, function (err, result) {
			//console.dir(JSON.stringify(result));
			assert.equal(result.Response.Gather[0].Say[0], 'Please press 2 or say sales for sales.');
			assert.equal(result.Response.Gather[0]['$'].action.indexOf('/twilio/gather?app=HelloWorld&sessionid=') > -1, true);
		});
	  });
  });
  
  it('twilio: gather - pass input digits 2', function test() {
	return request(server)
      .post('/twilio/gather?app=HelloWorld&sessionid=' + sessionid)
	  .send({Digits:2})
	  .expect(200)
	  .expect(function(res) {
		  var xml = res.text;
		  parseString(xml, function (err, result) {
			assert.equal(result.Response.Say[0], 'You had selected 2');
		});
	  });
  });

  it('twilio: check gathered digits w', function test() {
	return request(server)
      .get('/twilio/testctx?sessionid=' + sessionid)
	  .send({Digits:1})
	  .expect(200)
	  .expect(function(res) {
		  var json = JSON.parse(res.text);
		  assert.equal(json.gatheredDigits, '2');
	  });
  });
  
  
  it('twilio: callback - with after gather 1', function test() {
	return request(server)
      .post('/twilio/callback?app=HelloWorld&sessionid=' + sessionid)
	  .expect(200)
	  .expect(function(res) {
		  var xml = res.text;
		  
		  parseString(xml, function (err, result) {
			assert.equal(result.Response.Say[0], 'The main menu');
		});
	  });
  });
  it('twilio: callback again with end call', function test() {
	return request(server)
      .post('/twilio/callback?app=HelloWorld&sessionid=' + sessionid)
	  .expect(200)
	  .expect(function(res) {
		  var xml = res.text;
		  
		  parseString(xml, function (err, result) {
			//assert.equal(result.Response.Say[0], 'The main menu');
		});
	  });
  });
  // TODO gathering input in mainmenu
});
