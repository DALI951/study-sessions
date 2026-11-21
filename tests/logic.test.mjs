import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../www/core.js');

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

function sample() {
  const d = C.empty();
  const math = C.addSubject(d, 'Math');
  const phys = C.addSubject(d, 'Physics');
  C.addSession(d, { subjectId: math.id, date: '2026-11-21', minutes: 50, note: 'derivatives' });
  C.addSession(d, { subjectId: math.id, date: '2026-11-20', minutes: 25 });
  C.addSession(d, { subjectId: phys.id, date: '2026-11-21', minutes: 90 });
  return { d, math, phys };
}

test('empty store loads as empty and survives bad JSON', () => {
  assert.deepEqual(C.load(memoryStorage()), C.empty());
  assert.deepEqual(C.load(memoryStorage({ [C.KEY]: '{bad' })), C.empty());
});

test('save/load round trip normalizes garbage', () => {
  const { d } = sample();
  const st = memoryStorage();
  assert.equal(C.save(st, d), true);
  const loaded = C.load(st);
  assert.equal(loaded.subjects.length, 2);
  assert.equal(loaded.sessions.length, 3);
  const cleaned = C.normalize({
    subjects: [{ id: 'a', name: '  A  ' }],
    sessions: [
      { id: 'x', subjectId: 'a', date: '2026-02-30', minutes: 10 },
      { id: 'y', subjectId: 'a', date: '2026-02-28', minutes: 10 }
    ]
  });
  assert.equal(cleaned.sessions.length, 1);
});

test('subject rules: trim, duplicate reject, rename, cascade delete', () => {
  const d = C.empty();
  const s = C.addSubject(d, '  Math  ');
  assert.equal(s.name, 'Math');
  assert.throws(() => C.addSubject(d, 'math'), /already exists/);
  assert.throws(() => C.addSubject(d, '   '), /empty/);
  C.renameSubject(d, s.id, 'Algebra');
  assert.equal(d.subjects[0].name, 'Algebra');
  C.deleteSubject(d, s.id);
  assert.equal(d.subjects.length, 0);
  assert.equal(d.sessions.length, 0);
});

test('session validation: subject, date, minutes bounds', () => {
  const { d, math } = sample();
  assert.throws(() => C.addSession(d, { subjectId: 'nope', date: '2026-11-21', minutes: 20 }), /Unknown/);
  assert.throws(() => C.addSession(d, { subjectId: math.id, date: '2026-13-01', minutes: 20 }), /Invalid/);
  assert.throws(() => C.addSession(d, { subjectId: math.id, date: '2026-11-21', minutes: 0 }), /Minutes/);
  assert.throws(() => C.addSession(d, { subjectId: math.id, date: '2026-11-21', minutes: 5000 }), /Minutes/);
  assert.equal(d.sessions.length, 3);
});

test('daily counts and per-day joined sessions', () => {
  const { d } = sample();
  assert.deepEqual(C.countsByDate(d), { '2026-11-21': 2, '2026-11-20': 1 });
  const day = C.sessionsOnDate(d, '2026-11-21');
  assert.equal(day.length, 2);
  assert.ok(day[0].subjectName === 'Math' || day[0].subjectName === 'Physics');
  assert.equal(C.sessionsOnDate(d, '2026-11-19').length, 0);
});

test('subject stats count sessions and minutes', () => {
  const { d, math } = sample();
  const s = C.subjectStats(d, math.id);
  assert.equal(s.count, 2);
  assert.equal(s.minutes, 75);
  assert.equal(s.last, '2026-11-21');
});

test('streak counts through yesterday but breaks on a gap', () => {
  const d = C.empty();
  const s = C.addSubject(d, 'Math');
  assert.equal(C.streak(d, '2026-11-21'), 0);
  C.addSession(d, { subjectId: s.id, date: '2026-11-19', minutes: 10 });
  assert.equal(C.streak(d, '2026-11-21'), 0);
  C.addSession(d, { subjectId: s.id, date: '2026-11-20', minutes: 10 });
  assert.equal(C.streak(d, '2026-11-21'), 2);
  C.addSession(d, { subjectId: s.id, date: '2026-11-21', minutes: 10 });
  assert.equal(C.streak(d, '2026-11-21'), 3);
});

test('stats: total, week, month, today', () => {
  const { d } = sample();
  const s = C.stats(d, '2026-11-21');
  assert.equal(s.total, 3);
  assert.equal(s.today, 2);
  assert.equal(s.month, 3);
  assert.equal(s.week, 3);
  assert.equal(s.minutes, 165);
  assert.equal(s.subjects, 2);
  assert.equal(s.streak, 2);
});

test('month grid is Monday-first and always 42 cells', () => {
  const cells = C.monthCells(2026, 2);
  assert.equal(cells.length, 42);
  assert.equal(cells[0].date, '2026-01-26');
  assert.equal(cells[6].date, '2026-02-01');
  assert.equal(cells.filter((c) => c.inMonth).length, 28);
  assert.equal(cells[41].date, '2026-03-08');
});

test('export/import round trip and bad imports throw', () => {
  const { d } = sample();
  const text = C.exportData(d);
  const back = C.importData(text);
  assert.equal(back.subjects.length, 2);
  assert.equal(back.sessions.length, 3);
  assert.throws(() => C.importData('{oops'), SyntaxError);
  assert.throws(() => C.importData('{"subjects":[]}'), /Nothing useful/);
});

test('deleteSession reports whether it removed something', () => {
  const { d } = sample();
  const id = d.sessions[0].id;
  assert.equal(C.deleteSession(d, id), true);
  assert.equal(C.deleteSession(d, id), false);
});

test('date helpers handle DST boundaries and human labels', () => {
  assert.equal(C.addDays('2026-03-28', 3), '2026-03-31');
  assert.equal(C.addDays('2026-11-01', -1), '2026-10-31');
  assert.equal(C.weekStart('2026-11-21'), '2026-11-16');
  assert.equal(C.humanDate('2026-11-21'), 'Saturday, 21 November 2026');
  assert.equal(C.monthName(2026, 11), 'November 2026');
  assert.equal(C.initials('Med Ali Othman'), 'MO');
});
