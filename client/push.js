
// includes
const request = require("request");
const cmd = require("commander");

// setup command line arguements
cmd
    .version("0.1.0")
    .option("-t, --text", "send a text message")
    .option("-j, --json", "send a JSON message")
	.option("-u, --url <value>", "the URL to send the message to")
	.option("-s, --size <n>", "the size in MB to send (default 2.2 MB)")
    .parse(process.argv);
const sendText = cmd.hasOwnProperty("text");
const sendJson = cmd.hasOwnProperty("json");

// execute send command(s)
if (sendText || sendJson) {
	if (cmd.url) {
		const start = new Date();

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

		// send the text data
		if (sendText) {
			console.log("sending text...");
			request.post({
				url: cmd.url,
				headers: {
					"Content-Type": "text/plain"
				},
				body: JSON.stringify(data)
			}).on("response", function(response) {
				console.log("HTTP " + response.statusCode + " after " + (new Date() - start) + " ms.");
			});
		}

		// send the JSON data
		if (sendJson) {
			console.log("sending JSON...");
			request.post({
				url: cmd.url,
				json: true,
				body: data
			}).on("response", function(response) {
				console.log("HTTP " + response.statusCode + " after " + (new Date() - start) + " ms.");
			});
		}

	} else {
		console.warn("You must specify a --url.");
	}
}