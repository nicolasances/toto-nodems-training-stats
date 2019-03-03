var http = require('toto-request');

exports.do = function(session, cid) {

  return new Promise(function(success, failure) {

    http({
      correlationId: cid,
      microservice: 'toto-nodems-training-session',
      method: 'GET',
      resource: '/sessions/' + session.id + '/exercises'
    }).then((data) => {

      console.log(session);

      success({
        session: session,
        exericses: data.exercises
      });

    }, failure);
  });

}
