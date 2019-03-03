
exports.validate = (req) => {

  if (req.microservice == null) return {code: 400, message: 'Missing "microservice" field. That should contain the host name of the microservice.'};
  if (req.correlationId == null) return {code: 400, message: 'Missing "correlationId" field.'}

  return {code: 200};

}
