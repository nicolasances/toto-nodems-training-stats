# Toto API Controller
The Toto API Controller is a façade to expressJS to make it easier building an API.

Once started, the API Controller will listen on port 8080. <br/>
It will also publish the following endpoints:
 * `GET /`          - Health check of the API
 * `GET /publishes` - Endpoint to get the list of published events
 * `GET /consumes`  - Endpoint to get the list of consumed events

This API Controller will also log following the standard Toto Logging policies.<br/>
See https://github.com/nicolasances/node-toto-logger

## How to use it
1. Include it:
```
var Controller = require('toto-api-controller');
```
2. Instantiate it
```
var api = new Controller('api-name', eventProducer, eventConsumer);
```
The constructor takes the following arguments:
 * **API name**         mandatory, the name of the microservice (e.g. training-session)
 * **Event Producer**   optional, the Toto Event Producer (see https://github.com/nicolasances/node-toto-event-publisher) if this API publishes events
 * **Event Consumer**   optional, the Toto Event Consumer (see https://github.com/nicolasances/node-toto-event-consumer) if this API consumes events
3. Start it
```
api.listen()
```

## Example
An example of usage:
```
var Controller = require('toto-api-controller');

var api = new Controller('training-session', totoEventPublisher);

// APIs
api.path('GET', '/sessions', getSessions);
api.path('POST', '/sessions', postSession);

api.path('GET', '/sessions/:id', getSession);
api.path('DELETE', '/sessions/:id', deleteSession);

api.path('GET', '/sessions/:id/exercises', getSessionExercises);
api.path('POST', '/sessions/:id/exercises', postSessionExercise);

api.path('GET', '/sessions/:id/exercises/:eid', getSessionExercise);
api.path('PUT', '/sessions/:id/exercises/:eid', putSessionExercise);
api.path('DELETE', '/sessions/:id/exercises/:eid', deleteSessionExercise);

api.listen();
```
## Registering static content
To provide access to static content (folders) in your service, use the `staticContent()` method:
```
api.staticContent(path, folder)
```
For example:
```
api.staticContent('/img', '/app/img');
```
Note that the folder is **an ABSOLUTE folder** 
