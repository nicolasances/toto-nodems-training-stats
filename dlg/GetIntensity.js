
var moment = require('moment-timezone');

var getSessions = require('../integration/GetSessions');
var getSessionExercises = require('../integration/GetSessionExercises');

exports.do = function(request) {

  let cid = request.headers['x-correlation-id'];
  let x = request.query.days || 10;

  let today = moment().tz('Europe/Rome');

  return new Promise(function(success, failure) {

    // 1. Get the sessions of the last x days
    let dateFrom = today.subtract(x, 'days').format('YYYYMMDD');

    // Get the sessions (sorted in asc date)
    getSessions.do(dateFrom, cid).then((data) => {

      let sePromises = [];

      // 2. For each session, get the exercises
      for (var i = 0; i < data.sessions.length; i++) {

        // getSessionExercises will return a {session: session, exercises: []}
        sePromises.push(getSessionExercises.do(data.sessions[i], cid));

      }

      // 3. Prepare the stats
      Promise.all(sePromises).then((values) => {

        // Prepare the stats
        success({
          days: prepareStats(values, dateFrom)
        });

      }, failure);

    }, failure);

  });

}

/**
 * Function that actually prepare the statistics
 * - values will be an [{}, {}] and each object is the one returned by getSessionExercises
 */
var prepareStats = (values, dateFrom) => {

  if (values == null) return {};

  let stats = {
    days: []
  };

  // Merge per day - this will take the values and create an array that is per day, instead of per session
  // This to cover the case where there might be more sessions per day
  // days is going to be a [{date: 'YYYYMMDD', exercises: []}]
  let days = mergePerDay(values, dateFrom);

  // Get the muscles
  // daysAndMuscles is going to be a [{date: 'YYYYMMDD', muscles: ['chest', '...']}]
  let daysAndMuscles = getMuscles(days);

  return daysAndMuscles;

}

/**
 * Transforms the [{date: 'YYYYMMDD', exercises: []}] into a [{date: 'YYYYMMDD', muscles: ['chest', '...']}]
 */
var getMuscles = (days) => {

  if (days == null) return [];

  let muscles = [];

  // Find muscles function
  var findMuscles = (exercises) => {

    if (exercises == null) return null;

    let result = []

    // Checks if a muscle already exists in the list of resulting muscles
    var exists = (m) => {
      for (var r = 0; r < result.length; r++) {
        if (result[r] == m) return true;
      }
      return false;
    }

    // For each exercise, extract the muscle
    for (var e = 0; e < exercises.length; e++) {
      if (exercises[e].muscleGroupId == null) continue;
      if (exists(exercises[e].muscleGroupId)) continue;
      else result.push(exercises[e].muscleGroupId);
    }

    return result;
  }

  // For every date, extract the muscles from the exercises
  for (var i  = 0; i < days.length; i++) {

    muscles.push({
      date: days[i].date,
      fatigue: days[i].fatigue,
      pain: days[i].pain,
      rest: days[i].rest,
      muscles: findMuscles(days[i].exercises)
    });
  }

  return muscles;

}

/**
 * Transforms the values into an array day-based
 * Missing days are transformed automatically into "rest days"
 */
var mergePerDay = (sessions, dateFrom) => {

  if (sessions == null) return [];

  let days = [];

  // Function to check if a date exists already in the days[]
  var indexOf = (date) => {
    for (var d = 0; d < days.length; d++) {
      if (days[d].date == date) return d;
    }
    return -1;
  }

  // For every session, extract date and exercises
  for (var i = 0; i < sessions.length; i++) {

    let date = sessions[i].session.date;
    let exercises = sessions[i].exercises;

    let indexOfDate = indexOf(date);

    if (indexOfDate == -1) days.push({
      date: date,
      fatigue: sessions[i].session.fatigue,
      pain: sessions[i].session.pain,
      exercises: exercises,
      sessions: 1,
      rest: false
    });
    else {
      days[indexOfDate].exercises.push(exercises);
      days[indexOfDate].fatigue += sessions[i].session.fatigue;
      days[indexOfDate].pain += sessions[i].session.pain;
      days[indexOfDate].sessions += 1;
    }

  }

  // Calculate average pain and fatigue
  for (var i = 0; i < days.length; i++) {

    if (days[i].sessions > 1) {
      days[i].pain = days[i].pain / days[i].sessions;
      days[i].fatigue = days[i].fatigue / days[i].sessions;
    }
  }

  // Sort per date
  sortDays(days);

  // Fill in rest days
  fillInRestDays(days, dateFrom);

  return days;

}

/**
 * Sort the days per date asc
 */
var sortDays = (days) => {

  days.sort((a, b) => {

    if (a < b) return -1;
    else if (a > b) return 1;

    return 0;

  });

}

/**
 * Fills in missing days as rest days
 */
var fillInRestDays = (days, dateFrom) => {

  if (days == null) return null;

  let cursorDay;

  // Start at "dateFrom"
  cursorDay = dateFrom;

  for (var i = 0; i < days.length; i++) {

    let date = days[i].date;

    // Calculate the difference between the two => the number of missing training days
    let diff = Math.abs(moment(date, 'YYYYMMDD').diff(moment(cursorDay, 'YYYYMMDD'), 'days'));

    // Create the rest days
    if (diff > 0) {

      for (var d = 0; d < diff; d++) {

        days.push({
          date: moment(cursorDay, 'YYYYMMDD').add(1, 'days').format('YYYYMMDD'),
          rest: true
        });

      }
    }

    // Update the lastFilledDate
    cursorDay = moment(date, 'YYYYMMDD').add(1, 'days').format('YYYYMMDD');

  }

  // If there are still days to fill
  let targetDay = moment().format('YYYYMMDD');

  while (cursorDay <= targetDay) {

    days.push({
      date: moment(cursorDay, 'YYYYMMDD').format('YYYYMMDD'),
      rest: true
    });

    cursorDay = moment(cursorDay, 'YYYYMMDD').add(1, 'days').format('YYYYMMDD');
  }

}
