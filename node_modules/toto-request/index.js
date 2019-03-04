var httpRequest = require('request');
var logger = require('toto-logger');
var validator = require('./validation/Validator');

var newMsgId = function(cid) {

	let random = (Math.random() * 100000).toFixed(0).padStart(5, '0');

	return cid + '-' + random;

}

/**
 * This function makes an http call and returns a standard Promise
 * This function requires:
 *
 * - req 					:	the request as specified in the README file
 * - host					: development server address, OPTIONAL, default false. Specify true if using it in local mode.
 * 									E.g. pass https://imatzdev.it/apis to use the dev server
 * - auth					: if the host requires auth, this will be used in the Authentication header
 */
module.exports = function(req, host, auth) {

  return new Promise((success, failure) => {

    // Validate the data
    let validationResult = validator.validate(req);

    if (validationResult.code == 400) {failure(validationResult); return;}

    // Default method: GET
    let method = (req.method != null) ? req.method : 'GET';

    // Append '/' in front of the resource, in case it's missing
    let res = req.resource.indexOf('/') == 0 ? req.resource : ('/' + req.resource);

    // Message ID
    let msgId = newMsgId(req.correlationId);

		// Define the address
		let address = 'http://' + req.microservice + ':8080' + res;
		if (host != null) address = host + res;

    // Define the request parameters
    let httpReq = {
      url: address,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-correlation-id': req.correlationId,
        'x-msg-id': msgId
      }
    }

		// Authorization header, if needed
		if (auth != null) httpReq.headers['Authorization'] = auth;

    // In case there's a body
    if (req.body != null) httpReq.body = JSON.stringify(req.body);

    // Logging
    logger.apiOut(req.correlationId, req.microservice, method, res, msgId);

    // Calling
    httpRequest(httpReq, (err, resp, body) => {

      if (err != null) {failure({code: 500, message: err}); return;}

      try {
        // Parse the body
        let responseBody = JSON.parse(body);

        // Success
        success(responseBody);

      } catch (e) {
        // Fail
        failure({code: 500, message: e});
      }

    });
  });
}
