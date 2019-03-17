var Controller = require('toto-api-controller');

var getIntensity = require('./dlg/GetIntensity');
var getDurations = require('./dlg/GetDurations');

var apiName = 'training-stats';

var api = new Controller(apiName);

// APIs
api.path('GET', '/intensity', getIntensity);
api.path('GET', '/durations', getDurations);

api.listen();
