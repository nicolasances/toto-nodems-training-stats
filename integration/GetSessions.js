var http = require('toto-request');

exports.do = (dateFrom, cid) => {

  return http({
    correlationId: cid,
    microservice: 'toto-nodems-training-session',
    method: 'GET',
    resource: '/sessions?dateFrom=' + dateFrom + '&sort=date&sortDir=asc'
  })
}
