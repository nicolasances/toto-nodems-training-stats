var Controller = require('toto-api-controller');

var getIntensity = require('./dlg/GetIntensity');

var apiName = 'training-stats';

var api = new Controller(apiName);

// APIs
api.path('GET', '/intensity', getIntensity);

api.listen();
