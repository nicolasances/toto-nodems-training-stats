var express = require('express');
var bodyParser = require("body-parser");
var logger = require('toto-logger');
var validator = require('./validation/Validator');

/**
 * This is an API controller to Toto APIs
 * It provides all the methods to create an API and it's methods & paths, to create the documentation automatically, etc.
 * Provides the following default paths:
 * '/'            : this is the default SMOKE (health check) path
 * '/publishes'   : this is the path that can be used to retrieve the list of topics that this API publishes events to
 */
class TotoAPIController {

  /**
   * The constructor requires the express app
   * Requires:
   * - apiName              : (mandatory) - the name of the api (e.g. expenses)
   * - totoEventPublisher   : (optional) - a TotoEventPublisher object that contains topics registrations
   *                          if this is passed, the API will give access to the published topics on the /publishes path
   * - totoEventConsumer    : (optional) - a TotoEventConsumer object that contains topics registrations
   *                          if this is passed, the API will give access to the listened topics on the /consumes path
   */
  constructor(apiName, totoEventPublisher, totoEventConsumer) {

    this.app = express();
    this.apiName = apiName;
    this.totoEventPublisher = totoEventPublisher;
    this.totoEventConsumer = totoEventConsumer;

    // Init the paths
    this.paths = [];

    // Initialize the basic Express functionalities
    this.app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-correlation-id, x-msg-id");
      res.header("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
      next();
    });

    this.app.use(bodyParser.json());

    // Add the standard Toto paths

    // Add the basic SMOKE api
    this.path('GET', '/', {do: (req) => {

      return new Promise((s, f) => {

        return s({api: apiName, status: 'running'})
      });
    }});

    // Add the /publishes path
    this.path('GET', '/produces', {do: (req) => {

      return new Promise((s, f) => {

        if (this.totoEventPublisher != null) s({topics: totoEventPublisher.getRegisteredTopics()});
        else s({topics: []});
      });
    }})

    // Add the /consumes path
    this.path('GET', '/consumes', {do: (req) => {

      return new Promise((s, f) => {

        if (this.totoEventConsumer != null) s({topics: totoEventConsumer.getRegisteredTopics()});
        else s({topics: []});
      })
    }})
  }

  /**
   * This method will register the specified path to allow access to the static content in the specified folder
   * e.g. staticContent('/img', '/app/img')
   */
  staticContent(path, folder) {

    this.app.use(path, express.static(folder));

  }

  /**
   * Add a path to the app.
   * Requires:
   *  - method:   the HTTP method. Can be GET, POST, PUT, DELETE
   *  - path:     the path as expected by express. E.g. '/sessions/:id'
   *  - delegate: the delegate that exposes a do() function. Note that the delegate will always receive the entire req object
   */
  path(method, path, delegate) {

    // Cache the path
    this.paths.push({
      method: method,
      path: path,
      delegate: delegate
    });

    // Create a new express route
    if (method == 'GET') this.app.get(path, (req, res) => {

      // Validating
      let validationResult = validator.do(req);

      if (validationResult.errors) {res.status(400).type('application/json').send({code: 400, message: 'Validation errors', errors: validationResult.errors}); return;}

      // Log the fact that a call has been received
      logger.apiIn(req.headers['x-correlation-id'], method, path, req.headers['x-msg-id']);

      // Execute the GET
      delegate.do(req).then((data) => {
        // Success
        res.status(200).type('application/json').send(data);
      }, (err) => {
        // Failure
        res.status(500).type('application/json').send(err);
      });
    });
    else if (method == 'POST') this.app.post(path, (req, res) => {

      // Validating
      let validationResult = validator.do(req);

      if (validationResult.errors) {res.status(400).type('application/json').send({code: 400, message: 'Validation errors', errors: validationResult.errors}); return;}

      // Log the fact that a call has been received
      logger.apiIn(req.headers['x-correlation-id'], method, path, req.headers['x-msg-id']);

      // Execute the POST
      delegate.do(req).then((data) => {
        // Success
        res.status(201).type('application/json').send(data);
      }, (err) => {
        // Failure
        res.status(500).type('application/json').send(err);
      });
    });
    else if (method == 'DELETE') this.app.delete(path, (req, res) => {

      // Validating
      let validationResult = validator.do(req);

      if (validationResult.errors) {res.status(400).type('application/json').send({code: 400, message: 'Validation errors', errors: validationResult.errors}); return;}

      // Log the fact that a call has been received
      logger.apiIn(req.headers['x-correlation-id'], method, path, req.headers['x-msg-id']);

      // Execute the DELETE
      delegate.do(req).then((data) => {
        // Success
        res.status(200).type('application/json').send(data);
      }, (err) => {
        // Failure
        res.status(500).type('application/json').send(err);
      });
    });
    else if (method == 'PUT') this.app.put(path, (req, res) => {

      // Validating
      let validationResult = validator.do(req);

      if (validationResult.errors) {res.status(400).type('application/json').send({code: 400, message: 'Validation errors', errors: validationResult.errors}); return;}

      // Log the fact that a call has been received
      logger.apiIn(req.headers['x-correlation-id'], method, path, req.headers['x-msg-id']);

      // Execute the PUT
      delegate.do(req).then((data) => {
        // Success
        res.status(200).type('application/json').send(data);
      }, (err) => {
        // Failure
        res.status(500).type('application/json').send(err);
      });
    });

    // Log the added path
    console.log('[' + this.apiName + '] - Successfully added method ' + method + ' ' + path);
  }

  /**
   * Starts the ExpressJS app by listening on the standard port defined for Toto microservices
   */
  listen() {

    this.app.listen(8080, () => {
      console.log('[' + this.apiName + '] - Up and running');
    });

  }
}

// Export the module
module.exports = TotoAPIController;
