
var moment = require('moment-timezone');
var logger = require('toto-logger');

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
  // days is going to be a [{date: 'YYYYMMDD', exercises: [], existingPainLevels: [{muscle: '', pain: 0|1|2|3}, {...}]}]
  let days = mergePerDay(values, dateFrom);

  // Get the muscles
  // daysAndMuscles is going to be a [{date: 'YYYYMMDD', muscles: [{muscle: 'chest', sessionId: '', pain: 0|1|2|3}, {...}]}]
  let daysAndMuscles = getMuscles(days);

  return daysAndMuscles;

}

/**
 * Transforms in a "day and muscle" based array
 * Input  : [{date: 'YYYYMMDD', exercises: [], existingPainLevels: [{muscle: '', pain: 0|1|2|3}, {...}]}]
 * Output : [{date: 'YYYYMMDD', muscles: [{muscle: 'chest', sessionId: '', pain: 0|1|2|3}, {...}]}]
 */
var getMuscles = (days) => {

  if (days == null) return [];

  let muscles = [];

  // Find muscles function
  var findMuscles = (exercises, existingPainLevels) => {

    if (exercises == null) return null;

    let result = []

    // Checks if a muscle already exists in the list of resulting muscles
    var exists = (m) => {
      for (var r = 0; r < result.length; r++) {
        if (result[r].muscle == m) return true;
      }
      return false;
    }

    // Finds an existing pain level (pain level that has already been set) for the muscle
    var findExistingPainLevel = (m) => {
      if (existingPainLevels == null) return null;
      for (var p = 0 ; p < existingPainLevels.length; p++) {
        if (existingPainLevels[p].muscle == m) return existingPainLevels[p].painLevel;
      }
      return null;
    }

    // For each exercise, extract the muscle
    for (var e = 0; e < exercises.length; e++) {
      if (exercises[e].muscleGroupId == null) continue;
      if (exists(exercises[e].muscleGroupId)) continue;
      else result.push({muscle: exercises[e].muscleGroupId, sessionId: exercises[e].sessionId});
    }

    // For each extracted muscle, find the pain level
    for (var x = 0; x < result.length; x++) {
      result[x].pain = findExistingPainLevel(result[x].muscle);
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
      muscles: findMuscles(days[i].exercises, days[i].existingPainLevels)
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
    let muscles = sessions[i].session.muscles;

    let indexOfDate = indexOf(date);

    if (indexOfDate == -1) days.push({
      date: date,
      fatigue: sessions[i].session.fatigue,
      pain: sessions[i].session.pain,
      exercises: exercises,
      sessions: 1,
      rest: false,
      existingPainLevels: muscles
    });
    else {
      days[indexOfDate].exercises = [...exercises, ...days[indexOfDate].exercises];
      days[indexOfDate].fatigue += sessions[i].session.fatigue != null ? sessions[i].session.fatigue : 0;
      days[indexOfDate].pain += sessions[i].session.pain != null ? sessions[i].session.pain : 0;
      days[indexOfDate].sessions += sessions[i].session.pain != null ? 1 : 0;
      console.log(muscles);
      days[indexOfDate].existingPainLevels = [...muscles, ...days[indexOfDate].existingPainLevels];
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

  let today = moment().tz('Europe/Rome');
  let start = moment(dateFrom, 'YYYYMMDD').tz('Europe/Rome');

  let numOfDays = parseInt(today.diff(start, 'days'));

  // 1. Generates all the dates
  let expectedDays = [];
  let cursor = start;

  for (var i = 0; i <= numOfDays; i++) {

    expectedDays.push(cursor.format('YYYYMMDD'));

    cursor = cursor.add(1, 'days');

  }

  // 2. Check what indexes are missing
  let missingDates = [];

  for (var i = 0; i < expectedDays.length; i++) {

    if (i < days.length) {

      if (days[i].date != expectedDays[i]) days.splice(i, 0, {
        date: expectedDays[i],
        rest: true
      });

    }
    else days.push({
      date: expectedDays[i],
      rest: true
    });

  }

}
