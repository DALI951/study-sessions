/* Study Log — UI layer. All state lives in one data object; core.js owns the rules. */
(function () {
  'use strict';

  var C = window.StudyCore;
  var data = C.load(window.localStorage);
  var currentView = 'subjects';
  var selectedDate = C.todayKey();
  var today = C.todayKey();
  var cal = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1);
  var activeSubjectId = null;
  var pendingConfirm = null;
  var toastTimer = null;

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function toast(message) {
    var el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function persist() {
    if (!C.save(window.localStorage, data)) toast('Could not save on this device');
    render();
  }

  function emptyState(title, text) {
    return '<div class="empty">' +
      '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<rect x="7" y="6" width="26" height="28" rx="4"/><path d="M13 15h14M13 21h10"/>' +
      '</svg><strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></div>';
  }

  function renderSummary() {
    var s = C.stats(data, today);
    $('today-label').textContent = C.humanDate(today);
    $('stat-total').textContent = s.total;
    $('stat-week').textContent = s.week;
    $('stat-streak').textContent = s.streak;
  }

  function renderSubjects() {
    var host = $('subject-list');
    if (!data.subjects.length) {
      host.innerHTML = emptyState('No subjects yet', 'Add one, then log your first study session.');
      return;
    }
    host.innerHTML = data.subjects.map(function (s) {
      var st = C.subjectStats(data, s.id);
      var meta = st.count + (st.count === 1 ? ' session' : ' sessions') +
        (st.last ? ' · last ' + st.last : ' · not studied yet');
      return '<button class="card subject-card" type="button" data-action="open-subject" data-id="' + esc(s.id) + '">' +
        '<span class="avatar" aria-hidden="true">' + esc(C.initials(s.name)) + '</span>' +
        '<span class="grow"><span class="row-title">' + esc(s.name) + '</span>' +
        '<span class="row-meta">' + esc(meta) + '</span></span>' +
        '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
        '</button>';
    }).join('');
  }

  function renderCalendar() {
    var y = cal.getFullYear(), m = cal.getMonth() + 1;
    $('month-label').textContent = C.monthName(y, m);
    var counts = C.countsByDate(data);
    $('calendar-grid').innerHTML = C.monthCells(y, m).map(function (cell) {
      var n = counts[cell.date] || 0;
      var classes = ['day'];
      if (!cell.inMonth) classes.push('out');
      if (n) classes.push('has');
      if (cell.date === today) classes.push('today');
      if (cell.date === selectedDate) classes.push('selected');
      var label = C.humanDate(cell.date) + (n ? ', ' + n + ' sessions' : ', no sessions');
      return '<button class="' + classes.join(' ') + '" type="button" data-action="pick-day" data-date="' + cell.date + '" aria-label="' + esc(label) + '">' +
        '<span>' + cell.day + '</span>' +
        (n ? '<span class="day-mark">' + n + '</span>' : '') +
        '</button>';
    }).join('');
    renderDay();
  }

  function renderDay() {
    var list = C.sessionsOnDate(data, selectedDate);
    $('day-title').textContent = selectedDate === today ? 'Today' : C.humanDate(selectedDate);
    $('day-count').textContent = list.length + (list.length === 1 ? ' session' : ' sessions');
    $('day-list').innerHTML = list.length
      ? list.map(function (x) {
          return '<div class="mini-row"><span><strong>' + esc(x.subjectName) + '</strong>' +
            (x.note ? '<span class="row-meta"> · ' + esc(x.note) + '</span>' : '') + '</span>' +
            '<span class="minutes">' + x.minutes + ' min</span></div>';
        }).join('')
      : '<div class="mini-row"><span class="row-meta">Nothing logged on this day.</span></div>';
  }

  function renderSessions() {
    var host = $('session-list');
    if (!data.sessions.length) {
      host.innerHTML = emptyState('No sessions yet', 'Tap “Log session” after you study.');
      return;
    }
    var list = data.sessions.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    host.innerHTML = list.map(function (x) {
      var parts = x.date.split('-');
      var subj = data.subjects.filter(function (s) { return s.id === x.subjectId; })[0];
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var mon = months[Number(parts[1]) - 1] || parts[1];
      return '<div class="card session-card">' +
        '<span class="date-tile"><b>' + esc(parts[2]) + '</b><span>' + esc(mon) + '</span></span>' +
        '<span class="grow"><span class="row-title">' + esc(subj ? subj.name : 'Unknown') + '</span>' +
        '<span class="row-meta">' + (x.note ? esc(x.note) : esc(C.humanDate(x.date))) + '</span></span>' +
        '<span class="session-actions"><span class="minutes">' + x.minutes + ' min</span>' +
        '<button class="icon-btn danger-icon" type="button" data-action="delete-session" data-id="' + esc(x.id) + '" aria-label="Delete session">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>' +
        '</button></span></div>';
    }).join('');
  }

  function render() {
    renderSummary();
    renderSubjects();
    renderCalendar();
    renderSessions();
  }

  function setView(name) {
    currentView = name;
    ['subjects', 'calendar', 'sessions'].forEach(function (v) {
      $('view-' + v).hidden = v !== name;
    });
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute('data-view') === name;
      tabs[i].classList.toggle('active', on);
      if (on) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
    window.scrollTo(0, 0);
  }

  function openSheet(title, html, after) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    $('sheet').hidden = false;
    if (after) after();
  }

  function closeSheet() {
    $('sheet').hidden = true;
    $('sheet-body').innerHTML = '';
    activeSubjectId = null;
  }

  /* WebView JS dialogs need a WebChromeClient; use our own themed sheet instead. */
  function askConfirm(message, onYes) {
    pendingConfirm = onYes;
    openSheet('Please confirm',
      '<p class="sheet-note" style="margin-top:0">' + esc(message) + '</p>' +
      '<button class="btn btn-primary" type="button" data-action="confirm-yes">Yes, continue</button>' +
      '<button class="btn btn-secondary" type="button" data-action="confirm-no">Cancel</button>');
  }

  function subjectOptions(selected) {
    if (!data.subjects.length) return '';
    return data.subjects.map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (s.id === selected ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('');
  }

  function openSubjectSheet() {
    openSheet('Add a subject',
      '<form id="subject-form"><div class="field"><label for="subject-name">Subject name</label>' +
      '<input id="subject-name" name="name" type="text" maxlength="60" autocomplete="off" placeholder="e.g. Mathematics" required></div>' +
      '<button class="btn btn-primary" type="submit">Add subject</button></form>',
      function () { $('subject-name').focus(); });
  }

  function openSessionSheet(subjectId) {
    if (!data.subjects.length) {
      openSheet('Log a session',
        '<p class="sheet-note">Add a subject first, then you can log sessions for it.</p>' +
        '<button class="btn btn-primary" type="button" data-action="new-subject">Add a subject</button>');
      return;
    }
    var sid = subjectId || data.subjects[0].id;
    openSheet('Log a session',
      '<form id="session-form">' +
      '<div class="field"><label for="session-subject">Subject</label><select id="session-subject">' + subjectOptions(sid) + '</select></div>' +
      '<div class="field"><label for="session-date">Date</label><input id="session-date" type="date" value="' + esc(selectedDate) + '" required></div>' +
      '<div class="field"><label for="session-minutes">Minutes studied</label><input id="session-minutes" type="number" min="1" max="1440" value="25" required></div>' +
      '<div class="field"><label for="session-note">Note (optional)</label><textarea id="session-note" maxlength="300" placeholder="What did you cover?"></textarea></div>' +
      '<button class="btn btn-primary" type="submit">Save session</button></form>',
      function () { $('session-subject').focus(); });
  }

  function openDetailSheet(id) {
    var s = data.subjects.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    activeSubjectId = id;
    var st = C.subjectStats(data, id);
    var sessions = data.sessions.filter(function (x) { return x.subjectId === id; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var rows = sessions.length
      ? sessions.map(function (x) {
          return '<div class="mini-row"><span><strong>' + esc(x.date) + '</strong>' +
            (x.note ? '<span class="row-meta"> · ' + esc(x.note) + '</span>' : '') + '</span>' +
            '<span class="session-actions"><span class="minutes">' + x.minutes + ' min</span>' +
            '<button class="icon-btn danger-icon" type="button" data-action="delete-session" data-id="' + esc(x.id) + '" aria-label="Delete session">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>' +
            '</button></span></div>';
        }).join('')
      : '<div class="mini-row"><span class="row-meta">No sessions yet for this subject.</span></div>';
    openSheet(s.name,
      '<div class="card" style="margin-bottom:12px"><span class="row-title">' + st.count +
      (st.count === 1 ? ' session' : ' sessions') + '</span>' +
      '<span class="row-meta">' + st.minutes + ' minutes total' +
      (st.last ? ' · last on ' + st.last : '') + '</span></div>' +
      '<button class="btn btn-primary" type="button" data-action="log-for-subject">Log a session</button>' +
      '<button class="btn btn-secondary" type="button" data-action="rename-subject">Rename subject</button>' +
      '<div class="day-panel"><h3 style="margin:12px 0 4px;font-size:16px">Sessions</h3><div class="mini-list">' + rows + '</div></div>' +
      '<button class="btn btn-danger" type="button" data-action="delete-subject" style="margin-top:16px">Delete subject</button>');
  }

  function openRenameSheet(id) {
    var s = data.subjects.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    openSheet('Rename subject',
      '<form id="rename-form"><div class="field"><label for="rename-name">Subject name</label>' +
      '<input id="rename-name" type="text" maxlength="60" value="' + esc(s.name) + '" required></div>' +
      '<button class="btn btn-primary" type="submit">Save name</button></form>',
      function () { $('rename-name').focus(); $('rename-name').select(); });
  }

  function openDataSheet() {
    openSheet('Backup and data',
      '<p class="sheet-note" style="margin-top:0">Everything is stored on this device. Copy a backup before clearing the app data.</p>' +
      '<div class="field"><label for="export-text">Your backup</label><textarea id="export-text" readonly style="min-height:110px">' + esc(C.exportData(data)) + '</textarea></div>' +
      '<button class="btn btn-secondary" type="button" data-action="copy-backup">Copy backup</button>' +
      '<div class="field" style="margin-top:18px"><label for="import-text">Restore from backup</label><textarea id="import-text" placeholder="Paste a backup here"></textarea></div>' +
      '<button class="btn btn-primary" type="button" data-action="import-backup">Restore</button>' +
      '<button class="btn btn-danger" type="button" data-action="erase-all">Erase everything</button>');
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.id) return;
    e.preventDefault();
    try {
      if (form.id === 'subject-form') {
        C.addSubject(data, $('subject-name').value);
        persist();
        closeSheet();
        toast('Subject added');
      } else if (form.id === 'session-form') {
        var session = C.addSession(data, {
          subjectId: $('session-subject').value,
          date: $('session-date').value,
          minutes: $('session-minutes').value,
          note: $('session-note').value
        });
        selectedDate = session.date;
        cal = new Date(Number(session.date.slice(0, 4)), Number(session.date.slice(5, 7)) - 1, 1);
        persist();
        closeSheet();
        toast('Session logged');
      } else if (form.id === 'rename-form') {
        var id = activeSubjectId;
        C.renameSubject(data, id, $('rename-name').value);
        persist();
        openDetailSheet(id);
        toast('Name saved');
      }
    } catch (err) {
      toast(err && err.message ? err.message : 'Please check the fields');
    }
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    var id = el.getAttribute('data-id');
    try {
      if (action === 'confirm-yes') {
        var yes = pendingConfirm;
        pendingConfirm = null;
        closeSheet();
        if (yes) yes();
        return;
      } else if (action === 'confirm-no') {
        pendingConfirm = null;
        closeSheet();
        return;
      } else if (action === 'open-subject') {
        openDetailSheet(id);
      } else if (action === 'new-subject') {
        openSubjectSheet();
      } else if (action === 'log-for-subject') {
        var logId = activeSubjectId;
        openSessionSheet(logId);
      } else if (action === 'rename-subject') {
        openRenameSheet(activeSubjectId);
      } else if (action === 'delete-subject') {
        askConfirm('Delete this subject and all of its sessions?', function () {
          C.deleteSubject(data, id);
          persist();
          toast('Subject deleted');
        });
      } else if (action === 'delete-session') {
        var hostId = activeSubjectId;
        askConfirm('Delete this session?', function () {
          C.deleteSession(data, id);
          persist();
          if (hostId) openDetailSheet(hostId);
          toast('Session deleted');
        });
      } else if (action === 'pick-day') {
        selectedDate = el.getAttribute('data-date');
        renderCalendar();
      } else if (action === 'copy-backup') {
        var box = $('export-text');
        box.select();
        var copied = false;
        try { copied = document.execCommand('copy'); } catch (err) { copied = false; }
        if (!copied && window.navigator.clipboard) {
          window.navigator.clipboard.writeText(box.value);
          copied = true;
        }
        toast(copied ? 'Backup copied' : 'Select the text and copy it');
      } else if (action === 'import-backup') {
        var text = $('import-text').value;
        if (!text.trim()) { toast('Paste a backup first'); return; }
        var restored = C.importData(text);
        askConfirm('Replace everything with this backup?', function () {
          data.subjects = restored.subjects;
          data.sessions = restored.sessions;
          persist();
          toast('Backup restored');
        });
      } else if (action === 'erase-all') {
        askConfirm('Erase every subject and session? This cannot be undone.', function () {
          askConfirm('Are you sure? Your backup is the only way back.', function () {
            data.subjects = [];
            data.sessions = [];
            persist();
            toast('Everything erased');
          });
        });
      }
    } catch (err) {
      toast(err && err.message ? err.message : 'Something went wrong');
    }
  });

  $('add-subject-btn').addEventListener('click', openSubjectSheet);
  $('fab').addEventListener('click', function () { openSessionSheet(null); });
  $('data-btn').addEventListener('click', openDataSheet);
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) closeSheet(); });

  $('prev-month').addEventListener('click', function () {
    cal = new Date(cal.getFullYear(), cal.getMonth() - 1, 1);
    renderCalendar();
  });
  $('next-month').addEventListener('click', function () {
    cal = new Date(cal.getFullYear(), cal.getMonth() + 1, 1);
    renderCalendar();
  });

  var tabs = document.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { setView(this.getAttribute('data-view')); });
  }

  window.appBack = function () {
    if (!$('sheet').hidden) { closeSheet(); return false; }
    if (currentView !== 'subjects') { setView('subjects'); return false; }
    return true;
  };

  render();
  setView('subjects');
})();
