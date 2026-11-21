/* Study Sessions — pure logic. No DOM, no browser-only globals. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KEY = 'study-sessions.v1';

  function empty() {
    return { version: 1, subjects: [], sessions: [] };
  }

  function makeId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function dateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function parseKey(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    if (!m) return null;
    var y = +m[1], mo = +m[2], da = +m[3];
    var d = new Date(y, mo - 1, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return d;
  }

  function addDays(key, n) {
    var d = parseKey(key);
    if (!d) return key;
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }

  function normalize(raw) {
    var out = empty();
    if (!raw || typeof raw !== 'object') return out;
    var seenSubjects = {};
    var subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
    for (var i = 0; i < subjects.length; i++) {
      var s = subjects[i];
      if (!s || typeof s !== 'object') continue;
      var name = typeof s.name === 'string' ? s.name.trim().slice(0, 60) : '';
      var id = typeof s.id === 'string' && s.id ? s.id : makeId('s');
      if (!name || seenSubjects[id]) continue;
      seenSubjects[id] = true;
      out.subjects.push({
        id: id,
        name: name,
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : todayKey()
      });
    }
    var seenSessions = {};
    var sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
    for (var j = 0; j < sessions.length; j++) {
      var x = sessions[j];
      if (!x || typeof x !== 'object') continue;
      var sid = typeof x.id === 'string' && x.id ? x.id : makeId('x');
      var subjectId = typeof x.subjectId === 'string' ? x.subjectId : '';
      var date = typeof x.date === 'string' ? x.date : '';
      var minutes = Number(x.minutes);
      if (seenSessions[sid] || !seenSubjects[subjectId] || !parseKey(date)) continue;
      if (!isFinite(minutes) || minutes < 1 || minutes > 1440) continue;
      seenSessions[sid] = true;
      out.sessions.push({
        id: sid,
        subjectId: subjectId,
        date: date,
        minutes: Math.round(minutes),
        note: typeof x.note === 'string' ? x.note.slice(0, 300) : '',
        createdAt: typeof x.createdAt === 'string' ? x.createdAt : ''
      });
    }
    return out;
  }

  function load(storage) {
    if (!storage) return empty();
    try {
      var text = storage.getItem(KEY);
      return text ? normalize(JSON.parse(text)) : empty();
    } catch (e) {
      return empty();
    }
  }

  function save(storage, data) {
    if (!storage) return false;
    try {
      storage.setItem(KEY, JSON.stringify(normalize(data)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function addSubject(data, name) {
    var clean = String(name == null ? '' : name).trim().slice(0, 60);
    if (!clean) throw new Error('Subject name is empty');
    var exists = data.subjects.some(function (s) {
      return s.name.toLowerCase() === clean.toLowerCase();
    });
    if (exists) throw new Error('Subject already exists');
    var subject = { id: makeId('s'), name: clean, createdAt: todayKey() };
    data.subjects.push(subject);
    return subject;
  }

  function renameSubject(data, id, name) {
    var clean = String(name == null ? '' : name).trim().slice(0, 60);
    if (!clean) throw new Error('Subject name is empty');
    var clash = data.subjects.some(function (s) {
      return s.id !== id && s.name.toLowerCase() === clean.toLowerCase();
    });
    if (clash) throw new Error('Subject already exists');
    var subject = data.subjects.filter(function (s) { return s.id === id; })[0];
    if (!subject) throw new Error('Subject not found');
    subject.name = clean;
    return subject;
  }

  function deleteSubject(data, id) {
    data.subjects = data.subjects.filter(function (s) { return s.id !== id; });
    data.sessions = data.sessions.filter(function (x) { return x.subjectId !== id; });
    return data;
  }

  function addSession(data, input) {
    var subjectId = input && input.subjectId;
    var date = input && input.date;
    var minutes = Number(input && input.minutes);
    if (!data.subjects.some(function (s) { return s.id === subjectId; })) {
      throw new Error('Unknown subject');
    }
    if (!parseKey(date)) throw new Error('Invalid date');
    if (!isFinite(minutes) || minutes < 1 || minutes > 1440) {
      throw new Error('Minutes must be between 1 and 1440');
    }
    var session = {
      id: makeId('x'),
      subjectId: subjectId,
      date: date,
      minutes: Math.round(minutes),
      note: String((input && input.note) || '').trim().slice(0, 300),
      createdAt: new Date().toISOString()
    };
    data.sessions.push(session);
    return session;
  }

  function deleteSession(data, id) {
    var before = data.sessions.length;
    data.sessions = data.sessions.filter(function (x) { return x.id !== id; });
    return data.sessions.length !== before;
  }

  function withSubject(data, session) {
    var subject = data.subjects.filter(function (s) { return s.id === session.subjectId; })[0];
    return {
      id: session.id,
      date: session.date,
      minutes: session.minutes,
      note: session.note,
      subjectId: session.subjectId,
      subjectName: subject ? subject.name : 'Unknown'
    };
  }

  function sessionsOnDate(data, date) {
    return data.sessions
      .filter(function (x) { return x.date === date; })
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); })
      .map(function (x) { return withSubject(data, x); });
  }

  function subjectStats(data, subjectId) {
    var list = data.sessions.filter(function (x) { return x.subjectId === subjectId; });
    var last = '';
    var minutes = 0;
    list.forEach(function (x) {
      minutes += x.minutes;
      if (x.date > last) last = x.date;
    });
    return { count: list.length, minutes: minutes, last: last };
  }

  function countsByDate(data) {
    var map = {};
    data.sessions.forEach(function (x) {
      map[x.date] = (map[x.date] || 0) + 1;
    });
    return map;
  }

  function weekStart(key) {
    var d = parseKey(key);
    if (!d) return key;
    var day = d.getDay();
    return addDays(key, -(day === 0 ? 6 : day - 1));
  }

  function streak(data, today) {
    var base = parseKey(today) ? today : todayKey();
    var days = {};
    data.sessions.forEach(function (x) { days[x.date] = true; });
    var cursor = days[base] ? base : addDays(base, -1);
    var n = 0;
    while (days[cursor]) {
      n++;
      cursor = addDays(cursor, -1);
    }
    return n;
  }

  function stats(data, today) {
    var base = parseKey(today) ? today : todayKey();
    var ws = weekStart(base);
    var we = addDays(ws, 6);
    var month = base.slice(0, 7);
    var total = 0, minutes = 0, week = 0, monthCount = 0;
    data.sessions.forEach(function (x) {
      total++;
      minutes += x.minutes;
      if (x.date >= ws && x.date <= we) week++;
      if (x.date.slice(0, 7) === month) monthCount++;
    });
    return {
      total: total,
      minutes: minutes,
      week: week,
      month: monthCount,
      today: data.sessions.filter(function (x) { return x.date === base; }).length,
      streak: streak(data, base),
      subjects: data.subjects.length
    };
  }

  function monthCells(year, month) {
    var first = new Date(year, month - 1, 1);
    var offset = (first.getDay() + 6) % 7;
    var start = new Date(year, month - 1, 1 - offset);
    var cells = [];
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push({ date: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month - 1 });
    }
    return cells;
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function exportData(data) {
    return JSON.stringify(normalize(data), null, 2);
  }

  function importData(text) {
    var parsed = JSON.parse(String(text || ''));
    var data = normalize(parsed);
    if (!data.subjects.length && !data.sessions.length) throw new Error('Nothing useful in that backup');
    return data;
  }

  function humanDate(key) {
    var d = parseKey(key);
    if (!d) return key;
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function monthName(year, month) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] + ' ' + year;
  }

  return {
    KEY: KEY,
    empty: empty,
    normalize: normalize,
    load: load,
    save: save,
    addSubject: addSubject,
    renameSubject: renameSubject,
    deleteSubject: deleteSubject,
    addSession: addSession,
    deleteSession: deleteSession,
    sessionsOnDate: sessionsOnDate,
    subjectStats: subjectStats,
    countsByDate: countsByDate,
    weekStart: weekStart,
    streak: streak,
    stats: stats,
    monthCells: monthCells,
    dateKey: dateKey,
    todayKey: todayKey,
    parseKey: parseKey,
    addDays: addDays,
    initials: initials,
    exportData: exportData,
    importData: importData,
    humanDate: humanDate,
    monthName: monthName
  };
});
