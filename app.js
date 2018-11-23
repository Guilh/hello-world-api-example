const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

// Instantiate the http server
const httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Start the http server
httpServer.listen(config.httpPort, function() {
  console.log(`The server is listening on port ${config.httpPort}.`);
});

// All the server logic for both http and https
const unifiedServer = function(req, res) {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the http Method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if there is any
  const decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();

    // Choose the handler this req should go to
    // If one is not found use the notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined'
      ? router[trimmedPath]
      : handlers.notFound;

    // Construct the data object to send to handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer
    };

    // Route the req to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // Use the status code called bacl by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response. Parse it as it if was JSON
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response: ', statusCode, payloadString);
    });
  });
};

// Define the handlers
const handlers = {};

// Ping Handler
handlers.hello = function(data, callback) {
  callback(200, {'hello': 'world!'});
};

// Not Found handler
handlers.notFound = function(data, callback) {
  callback(404, {'not': 'found'});
};

// Define a request router
const router = {
  'hello': handlers.hello
};
