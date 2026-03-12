// progress.js - Progress page logic
(function() {
  'use strict';

  const STORAGE_KEY = 'cs_quiz_progress';

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function formatDate(ts) {
    if (!ts) return 'Never';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function renderOverallStats(progress, allQuestions) {
    const container = document.getElementById('overall-stats');
    if (!container) return;
    const qData    = progress.questions || {};
    const total    = allQuestions.length;
    const attempted = Object.keys(qData).length;
    const correct  = Object.values(qData).filter(function(q) { return q.lastCorrect; }).length;
    const pct      = attempted > 0 ? Math.round(correct / attempted * 100) : 0;
    const activity = progress.activity || [];
    const lastDate = activity.length > 0 ? activity[0].timestamp : null;

    const stats = [
      { label: 'Questions Attempted', value: attempted + ' / ' + total },
      { label: 'Correct Answers',     value: correct },
      { label: 'Accuracy',            value: pct + '%' },
      { label: 'Last Activity',       value: formatDate(lastDate) }
    ];

    container.innerHTML = stats.map(function(s) {
      return '<div class="stat-card" role="listitem">' +
        '<strong class="stat-value">' + s.value + '</strong>' +
        '<span class="stat-label">' + s.label + '</span>' +
        '</div>';
    }).join('');
  }

  function renderTopicBreakdown(progress, allQuestions) {
    const container = document.getElementById('topic-breakdown');
    if (!container) return;
    const topics = window.getTopics(allQuestions);
    const qData  = progress.questions || {};

    container.innerHTML = topics.map(function(topic) {
      const topicQs  = window.getQuestionsByTopic(allQuestions, topic);
      const attempted = topicQs.filter(function(q) { return qData[q.id]; }).length;
      const correct  = topicQs.filter(function(q) { return qData[q.id] && qData[q.id].lastCorrect; }).length;
      const pct      = attempted > 0 ? Math.round(correct / attempted * 100) : 0;
      const barPct   = topicQs.length > 0 ? Math.round(attempted / topicQs.length * 100) : 0;
      const cls      = window.topicClass(topic);
      const icon     = window.TOPIC_ICONS[topic] || '📚';

      return '<div class="topic-row ' + cls + '" role="listitem">' +
        '<div class="topic-row-header">' +
          '<span class="topic-row-icon" aria-hidden="true">' + icon + '</span>' +
          '<span class="topic-row-name">' + topic + '</span>' +
          '<span class="topic-row-score">' + correct + '/' + attempted + ' correct</span>' +
          '<a href="quiz.html?topic=' + encodeURIComponent(topic) + '" class="btn btn-sm btn-primary" aria-label="Practice ' + topic + '">Practice</a>' +
        '</div>' +
        '<div class="progress-bar" role="progressbar"' +
          ' aria-valuenow="' + barPct + '" aria-valuemin="0" aria-valuemax="100"' +
          ' aria-label="' + topic + ': ' + attempted + ' of ' + topicQs.length + ' questions attempted">' +
          '<div class="progress-fill" style="width:' + barPct + '%"></div>' +
        '</div>' +
        '<div class="topic-row-meta">' +
          '<span>' + attempted + '/' + topicQs.length + ' attempted</span>' +
          '<span>' + (attempted > 0 ? pct + '% accuracy' : 'Not started') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderRecentActivity(progress) {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    const activity = (progress.activity || []).slice(0, 10);
    if (activity.length === 0) {
      container.innerHTML = '<p class="no-progress">No activity yet. Start a quiz to see your history here.</p>';
      return;
    }
    const rows = activity.map(function(a) {
      return '<tr>' +
        '<td>' + a.topic + '</td>' +
        '<td class="' + (a.correct ? 'result-correct' : 'result-incorrect') + '">' +
          (a.correct ? '✅ Correct' : '❌ Incorrect') + '</td>' +
        '<td>' + (a.confidence != null ? a.confidence + '%' : '—') + '</td>' +
        '<td>' + formatDate(a.timestamp) + ' ' + formatTime(a.timestamp) + '</td>' +
      '</tr>';
    }).join('');

    container.innerHTML =
      '<table class="activity-table" aria-label="Recent activity">' +
        '<thead><tr>' +
          '<th scope="col">Topic</th>' +
          '<th scope="col">Result</th>' +
          '<th scope="col">Confidence</th>' +
          '<th scope="col">Date</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  var resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      }
    });
  }

  // Init
  window.loadQuestions().then(function(allQuestions) {
    const progress = getProgress();
    renderOverallStats(progress, allQuestions);
    renderTopicBreakdown(progress, allQuestions);
    renderRecentActivity(progress);
  }).catch(function(err) {
    console.error(err);
    const main = document.querySelector('main');
    if (main) {
      const p = document.createElement('p');
      p.className = 'error';
      p.textContent = 'Failed to load question data.';
      main.appendChild(p);
    }
  });
})();
