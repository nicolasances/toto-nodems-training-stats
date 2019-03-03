
# Toto Request

This library is a wrapper for the https://github.com/request/request NodeJS module.

It provides some basic functionality among which:
 * **Logging**: it logs the outgoing calls in a way that is compliant with the toto logging standards (http://github.com/nicolasances/node-toto-logger) and to support correlation among the microservices calls

## How to use
Import the node module <br/>
`var http = require('toto-request');`

Call the `http()` function:
```
http({
  correlationId:  MANDATORY, 'the correlation id',
  microservice:   MANDATORY, 'the full microservice id (e.g. toto-nodems-expenses)',
  method:         optional, 'the HTTP method: GET, POST, PUT, DELETE, ...'. If not provided, will use 'GET',
  resource:       optional, 'the path to call. e.g. /sessions?date=20192039' including the paramters
});
```

## Passing a body
To pass the body (e.g. for POST requests), just pass a **json** object as **body**:
```
var body = {
  ...
}
http({
  correlationId:  'asdasd',
  microservice:   'expenses',
  method:         'POST',
  resource:       '/expenses',
  body:           body
  });
```
