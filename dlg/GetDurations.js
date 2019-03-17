var moment = require('moment-timezone');
var logger = require('toto-logger');

var getSessions = require('../integration/GetSessions');

/**
 * Retrieves the durations of each day where training has been performed
 */
exports.do = (request) => {

  // Extract the data
  let cid = request.headers['x-correlation-id'];
  let dateFrom = request.query.dateFrom;

  return new Promise((success, failure) => {

    if (dateFrom == null) {failure({code: 400, message: '"dateFrom" is missing as a query parameter.'}); return;}

    // Build all the dates from that date
    // dates is a [{date: YYYYMMDD}, {date: YYYYMMDD}, {date: YYYYMMDD}, ...]
    // from dateFrom (included) to today (included)
    let dates = buildDates(dateFrom);

    // Get the sessions from dateFrom
    // Will fill in the array dates with
    // [{date: ..., timeInMinutes: int, rest: false|true}]
    getSessions.do(dateFrom, cid).then((gsresp) => {

      let sessions = gsresp.sessions;

      // For each day, fill the time
      for (var i = 0; i < dates.length; i++) {

        // Get the sessions of this day
        let daySessions = getSessionsAtDay(sessions, dates[i].date);

        // If no session, say it!
        if (daySessions == null || daySessions.length == 0) {dates[i].rest = true; continue;}

        // Sum the timings if available, otherwise consider 50 min as a standard
        let duration = sumDurations(daySessions);

        // Update the day
        dates[i].rest = false;
        dates[i].timeInMinutes = duration;

      }

      // Return
      success({durations: dates});

    })

  });

}

/**
 * Build the dates[] starting from dateFrom
 */
var buildDates = (dateFrom) => {

  let from = moment(dateFrom, 'YYYYMMDD').tz('Europe/Rome');
  let today = moment().tz('Europe/Rome');

  let dates = [];

  while (from.isSameOrBefore(today)) {

    dates.push({
      date: from.format('YYYYMMDD')
    });

    from.add(1, 'days');

  }

  return dates;

}

/**
 * Finds the sessions in the specified date
 */
var getSessionsAtDay = (sessions, date) => {

  if (sessions == null) return null;

  let result = [];

  for (var i = 0; i < sessions.length; i++) {

    if (sessions[i].date == date) result.push(sessions[i]);

  }

  return result;

}

/**
 * Sums the duration of the provided sessions.
 * If the sessions has no duration set, 50 min will be the default
 */
var sumDurations = (sessions) => {

  if (sessions == null) return null;

  let duration = 0;

  for (var i = 0; i < sessions.length; i++) {

    if (sessions[i].timeInMinutes == null) duration += 50;
    else duration += sessions[i].timeInMinutes;

  }

  return duration;

}
