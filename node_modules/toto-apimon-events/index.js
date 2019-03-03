var kafka = require('kafka-node');
var moment = require('moment-timezone');

Producer = kafka.Producer;
client = new kafka.KafkaClient({kafkaHost: 'kafka:9092', connectTimeout: 3000, requestTimeout: 6000});
producer = new Producer(client);

producer.on('ready', function() {
  console.log('Producer is ready');
});

/**
 * Sends a Kafka event specifying that an API has been called.
 * Requires:
 *  - apiName   : the name of the API (e.g. gym)
 *  - path      : the path that has been called (e.g. /sessions)
 *  - method    : the method that has been used (e.g. GET)
 *  - query     : the query params as a JSON object
 *  - params    : the path parameters as a JSON object
 *  - body      : the body as a JSON object
 */
exports.apiCalled = function(apiName, path, method, query, params, body) {

  var time = moment().tz('Europe/Rome').format('YYYYMMDDHHmmssSSS');

  producer.send([{topic: 'api-call', messages: JSON.stringify({api: apiName, path: path, method: method, time: time, body: body, params: params, query: query})}], function(err, data) {

    if (err != null) console.log(err);
  });

}
