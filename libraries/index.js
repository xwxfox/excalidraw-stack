var static = require("node-static");

var file = new static.Server(".", {
  headers: { "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*" },
});

PORT = 8080;

console.info(`Running at http://localhost:${PORT}`);
console.info(`CORS_ORIGIN: ${process.env.CORS_ORIGIN || "*"}`);

require("http")
  .createServer(function (request, response) {
    request
      .addListener("end", function () {
        file.serve(request, response);
      })
      .resume();
  })
  .listen(PORT);
