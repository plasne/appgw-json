
// includes
const request = require("request");
const cmd = require("commander");

class Result {

	get avg() {
		return (this.sum / this.count);
	}

	constructor(name, data, keep) {
		const self = this;

		// assign variables
		self.name = name;
		self.count = 0;
		self.sum = 0;
		self.outliers = Math.round( (1 - keep) / 2 * data.length );
		self.min = Number.MAX_SAFE_INTEGER;
		self.max = Number.MIN_SAFE_INTEGER;

		// calculate
		for (let i = 0; i < data.length; i++) {
			// 5 results; outliers = 0; range = 0-4; 0+1>0 = true; 4<5-0 = true
			// 10 results; outliers = 1; range = 0-9; 0+1>1 = false; 9<10-1 = false
			if ( (i + 1) > self.outliers && i < (data.length - self.outliers) ) {
				self.sum += data[i];
				self.count++;
				if (data[i] < self.min) self.min = data[i];
				if (data[i] > self.max) self.max = data[i];
			}
		}

	}

}

// extensions
Array.prototype.avg = function() {
	return [
		new Result("all", this, 1.0),
		new Result("80%", this, 0.8)
	];
}

// setup command line arguements
cmd
    .version("0.1.0")
    .option("-t, --text", "send a text message")
    .option("-j, --json", "send a JSON message")
	.option("-u, --url <value>", "the URL to send the message to")
	.option("-s, --size <n>", "the size in MB to send (default 2.2 MB)")
	.option("-c, --count <n>", "the number of requests to send")
    .parse(process.argv);

// execute send command(s)
if ( cmd.hasOwnProperty("text") || cmd.hasOwnProperty("json") ) {
	if (cmd.url) {

		// determine the number of messages
		const size = ((parseFloat(cmd.size)) ? parseFloat(cmd.size) : 2.2) * 1024 * 1024;
		const count = Math.floor(size / 38);

		// generate the data
		// [{ "Code": "0", "Reason": "CONSUMED" }, ...]
		const data = [];
		for (let i = 0; i < count; i++) {
			data.push({
				Code: "" + i,
				Reason: "CONSUMED"
			});
		}

		// define the send text promise
		const sendText = () => new Promise(resolve => {
			const start = new Date();
			console.log("sending text...");
			request.post({
				url: cmd.url,
				headers: {
					"Content-Type": "text/plain"
				},
				body: JSON.stringify(data)
			}).on("response", function(response) {
				console.log("HTTP " + response.statusCode + " after " + (new Date() - start) + " ms.");
				resolve( (new Date() - start) );
			});
		});

		// define the send json promise
		const sendJson = () => new Promise(resolve => {
			const start = new Date();
			console.log("sending JSON...");
			request.post({
				url: cmd.url,
				json: true,
				body: data
			}).on("response", function(response) {
				console.log("HTTP " + response.statusCode + " after " + (new Date() - start) + " ms.");
				resolve( (new Date() - start) );
			});
		});

		// create a function that can process synchronously
		//   see: http://www.tivix.com/blog/making-promises-in-a-synchronous-manner/
		const sync = fn => {
			let iterator = fn();
			let loop = result => {
				!result.done && result.value.then(
					res => loop(iterator.next(res)),
					err => look(iterator.throw(err))
				);
			};
			loop(iterator.next());
		};

		// call the sync function
		sync(function* () {
			const results = [];

			// yield to generate all the work
			for (let i = 0; i < (cmd.count || 1); i++) {
				if (cmd.hasOwnProperty("text")) {
					const result = yield sendText();
					results.push( result );
				}
				if (cmd.hasOwnProperty("json")) {
					const result = yield sendJson();
					results.push( result );
				}
			}

			// display the results
			results.avg().forEach(result => {
				console.log(result.name + " => count: " + result.count + ", avg: " + result.avg + ", min: " + result.min + ", max: " + result.max);
			});

		});

	} else {
		console.warn("You must specify a --url.");
	}
}