var http = require('toto-request');

exports.do = function(session, cid) {

  return new Promise(function(success, failure) {

    console.log(session);

    http({
      correlationId: cid,
      microservice: 'toto-nodems-training-session',
      method: 'GET',
      resource: '/sessions/' + session.id + '/exercises'
    }).then((data) => {

      success({
        session: session,
        exercises: data.exercises
      });

    }, failure);
  });

}
