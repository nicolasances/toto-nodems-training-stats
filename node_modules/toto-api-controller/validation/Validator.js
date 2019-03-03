
exports.do = (req) => {

  let errors = [];

  if (req.headers['x-correlation-id'] == null) errors.push('x-correlation-id is a mandatory header');

  if (errors.length > 0) return {errors: errors};

  return {errors: null};

}
