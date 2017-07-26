const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const requestStats = require("request-stats");

const app = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.text({ limit: "5mb" }));
app.use(express.static("www"));
app.server = http.createServer(app);
const stats = requestStats(app.server);

stats.on("complete", function(details) {
  console.log("request size: " , details.req.bytes);
});

app.get("/", function(req, res) {
  res.redirect("/default.html");
});

app.get("/hello", function(req, res) {
  res.send("hello");
});

app.post("/", function(req, res) {
  res.status(200).end();
});

app.server.listen(80);
