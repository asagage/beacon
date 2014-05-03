//beacon.js - Serves a 1px gif web bug and sends counter to statsd upon access
// the beacon web bug is designed to be embedded within an error page so that when 
// users access it, a counter is incremented in statsd and somewhere a graph moves.
// http://yourserver:8080/beacon for basic beacon
// http://yourserver:8080/beacon?foo=bar for sending custom data with beacon
var http = require('http');
var url = require('url');
var listen_port = '8080';
var statsd_metric_name = 'beacon.failure'
var statsd_options = {  "host": 'localhost', 
			"port": '8125',
			"prefix": '', 
			"suffix": '',
			"globalize": 'false',
			"cacheDns": 'false',
			"mock": 'false',
		     }

//might move this out, but was testing geocoding the requestors ip so that we can plot hits 
// against a realtime map
//geocoder require node-geocoder
var geocoderProvider = 'freegeoip';
var httpAdapter = 'http';
// optional
var extra = {
    apiKey: 'YOUR_API_KEY', // for map quest
    formatter: null         // 'gpx', 'string', ...
};
var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter, extra);

//statsd requires node-statd
var StatsD = require('node-statsd').StatsD,
      client = new StatsD(statsd_options);

//var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, httpAdapter, extra);

http.createServer(function(req, res){
	var url_obj = url.parse(req.url, true);
	var pathname = url_obj['pathname'];

	//various query params can be added to your beacon to do more stuff
	var foo = url_obj['query']['foo'];	
		
	var client_ip;
	//if behind load balancer
	//disable this if not trusted
	if (req.headers["X-Forwarded-For"] ){
		client_ip = req.headers["X-Forwarded-For"];	
	} else {
		client_ip = req.connection.remoteAddress;	
	}

	console.log("Request from: " + client_ip + " for: " + pathname);
	//console.log("Foo: " + foo);	
	
	//geocoder.geocode(client_ip, function(err, res) {
   	//	 console.log(res);
	//});

	if (pathname == '/beacon') {
		var imgHex = '47494638396101000100800000dbdfef00000021f90401000000002c00000000010001000002024401003b';
		var imgBinary = new Buffer(imgHex, 'hex');
		res.writeHead(200, {'Content-Type': 'image/gif' });
		res.end(imgBinary, 'binary');
		
		console.log('Beacon hit: ' + client_ip);
		client.increment(statsd_metric_name);
	
	} else { 
		res.writeHead(404, {'Content-Type': 'text/plain' });
		res.write("oopsie - not found");
		res.end('');
	}
}).listen(listen_port);

