// home.js - Home page logic
(function() {
  'use strict';

  const STORAGE_KEY = 'cs_quiz_progress';

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  }

  function renderSummaryBar(questions, progress) {
    const bar = document.getElementById('summary-bar');
    if (!bar) return;
    const total = questions.length;
    const attempted = Object.keys(progress.questions || {}).length;
    const correct = Object.values(progress.questions || {}).filter(q => q.lastCorrect).length;
    if (attempted === 0) {
      bar.innerHTML = '<p class="no-progress">No attempts yet. Pick a topic below to start!</p>';
      return;
    }
    bar.innerHTML = `
      <div class="summary-stats">
        <div class="summary-stat"><strong>${attempted}</strong><span>Attempted</span></div>
        <div class="summary-stat"><strong>${correct}</strong><span>Correct</span></div>
        <div class="summary-stat"><strong>${total - attempted}</strong><span>Remaining</span></div>
        <div class="summary-stat"><strong>${attempted > 0 ? Math.round(correct / attempted * 100) : 0}%</strong><span>Accuracy</span></div>
      </div>
    `;
  }

  function renderPackGrid(questions, progress) {
    const grid = document.getElementById('pack-grid');
    if (!grid) return;
    const topics = window.getTopics(questions);
    const qProgress = progress.questions || {};

    grid.innerHTML = topics.map(topic => {
      const topicQs = window.getQuestionsByTopic(questions, topic);
      const attempted = topicQs.filter(q => qProgress[q.id]).length;
      const correct = topicQs.filter(q => qProgress[q.id] && qProgress[q.id].lastCorrect).length;
      const pct = topicQs.length > 0 ? Math.round(attempted / topicQs.length * 100) : 0;
      const icon = window.TOPIC_ICONS[topic] || '📚';
      const cls = window.topicClass(topic);

      return `
        <article class="pack-card ${cls}" role="listitem"
          tabindex="0"
          aria-label="Start ${topic} quiz, ${attempted} of ${topicQs.length} attempted"
          onclick="startPack('${topic.replace(/'/g, '&#39;')}')"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();startPack('${topic.replace(/'/g, '&#39;')}');}">
          <div class="pack-icon" aria-hidden="true">${icon}</div>
          <h3 class="pack-title">${topic}</h3>
          <p class="pack-count">${topicQs.length} question${topicQs.length !== 1 ? 's' : ''}</p>
          <div class="pack-progress">
            <div class="progress-bar" role="progressbar"
              aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
              aria-label="${topic} progress: ${pct}%">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="pack-progress-text">${attempted}/${topicQs.length} done · ${correct} correct</span>
          </div>
        </article>
      `;
    }).join('');
  }

  window.startPack = function(topic) {
    window.location.href = 'quiz.html?topic=' + encodeURIComponent(topic);
  };

  document.getElementById('start-all-btn').addEventListener('click', function() {
    window.location.href = 'quiz.html?topic=all';
  });

  // Init
  window.loadQuestions().then(function(questions) {
    const progress = getProgress();
    renderSummaryBar(questions, progress);
    renderPackGrid(questions, progress);
  }).catch(function(err) {
    console.error('Failed to load questions:', err);
    document.getElementById('pack-grid').innerHTML =
      '<p class="error">Failed to load questions. Please ensure you are running this through a web server.</p>';
  });
})();
