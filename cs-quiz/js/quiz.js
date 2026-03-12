// quiz.js - Quiz page logic
(function() {
  'use strict';

  const STORAGE_KEY = 'cs_quiz_progress';
  let questions = [];
  let currentIndex = 0;
  let answers = {}; // questionId -> { answer, correct, confidence, matchedKeywords, totalKeywords }
  let packTopic = null;

  // --- Storage ---
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function recordAnswer(question, isCorrect, userAnswer, confidence) {
    const progress = getProgress();
    if (!progress.questions) progress.questions = {};
    if (!progress.activity)  progress.activity  = [];

    progress.questions[question.id] = {
      lastCorrect: isCorrect,
      lastAttempt: Date.now(),
      attempts: ((progress.questions[question.id] && progress.questions[question.id].attempts) || 0) + 1,
      topic: question.topic,
      difficulty: question.difficulty
    };

    progress.activity.unshift({
      questionId: question.id,
      topic: question.topic,
      correct: isCorrect,
      confidence: confidence,
      timestamp: Date.now()
    });
    // Keep last 50 activities
    if (progress.activity.length > 50) progress.activity.length = 50;

    saveProgress(progress);
  }

  // --- URL params ---
  function getTopicParam() {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('topic');
    return t ? decodeURIComponent(t) : 'all';
  }

  // --- Rendering ---
  function setProgress(index, total) {
    const pct = total > 0 ? Math.round((index / total) * 100) : 0;
    const fill = document.getElementById('progress-fill');
    const bar = fill && fill.parentElement;
    if (fill) fill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', pct);
    const counter = document.getElementById('question-counter');
    if (counter) counter.textContent = 'Question ' + (index + 1) + ' of ' + total;
  }

  function showQuestion(q, index) {
    document.getElementById('question-card').style.display = 'block';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('feedback-section').style.display = 'none';
    document.getElementById('submit-btn').style.display = 'inline-flex';
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('confidence-section').style.display = 'block';

    // Reset confidence slider
    const slider = document.getElementById('confidence-slider');
    if (slider) { slider.value = 50; updateConfidenceLabel(50); }

    // Difficulty badge
    const diffBadge = document.getElementById('difficulty-badge');
    if (diffBadge) {
      diffBadge.textContent = q.difficulty;
      diffBadge.className = 'difficulty-badge difficulty-' + q.difficulty;
    }

    // Topic label
    const topicLabel = document.getElementById('topic-label');
    if (topicLabel) topicLabel.textContent = q.topic;

    // Prompt
    document.getElementById('question-prompt').textContent = q.prompt;

    const optionsContainer    = document.getElementById('options-container');
    const shortAnswerContainer = document.getElementById('short-answer-container');
    const shortAnswerInput    = document.getElementById('short-answer-input');

    if (q.type === 'short-answer') {
      optionsContainer.style.display = 'none';
      shortAnswerContainer.style.display = 'block';
      shortAnswerInput.value = '';
    } else {
      shortAnswerContainer.style.display = 'none';
      optionsContainer.style.display = 'block';
      renderOptions(q);
    }

    setProgress(index, questions.length);

    // Restore state if already answered in this session
    if (answers[q.id]) {
      restoreAnswer(q);
    }
  }

  function renderOptions(q) {
    const container = document.getElementById('options-container');
    const isMulti = q.type === 'multi-select';

    container.innerHTML = q.options.map(function(opt, i) {
      const inputType = isMulti ? 'checkbox' : 'radio';
      return '<label class="option-label" tabindex="0"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}"' +
        ' role="' + (isMulti ? 'checkbox' : 'radio') + '"' +
        ' aria-checked="false">' +
        '<input type="' + inputType + '" class="option-input" name="answer" value="' + i + '"' +
        ' id="opt-' + i + '" hidden>' +
        '<span class="option-text">' + String.fromCharCode(65 + i) + '. ' + escapeHtml(opt) + '</span>' +
        '</label>';
    }).join('');

    // Add click handlers
    container.querySelectorAll('.option-label').forEach(function(label, i) {
      label.addEventListener('click', function() { toggleOption(label, i, isMulti); });
    });
  }

  function toggleOption(label, index, isMulti) {
    const input = label.querySelector('input');
    if (!isMulti) {
      // Radio: deselect all others
      document.querySelectorAll('.option-label').forEach(function(l) {
        l.classList.remove('selected');
        l.setAttribute('aria-checked', 'false');
        l.querySelector('input').checked = false;
      });
    }
    label.classList.toggle('selected');
    input.checked = label.classList.contains('selected');
    label.setAttribute('aria-checked', String(input.checked));
  }

  function getSelectedOptions() {
    const selected = [];
    document.querySelectorAll('.option-label.selected').forEach(function(l) {
      selected.push(parseInt(l.querySelector('input').value, 10));
    });
    return selected;
  }

  function checkAnswer(q) {
    if (q.type === 'multiple-choice') {
      const selected = getSelectedOptions();
      if (selected.length === 0) return null;
      return { correct: selected[0] === q.correct, userAnswer: selected[0] };
    }
    if (q.type === 'multi-select') {
      const selected = getSelectedOptions();
      if (selected.length === 0) return null;
      const correct = Array.isArray(q.correct) ? q.correct : [q.correct];
      const sortedSelected = selected.slice().sort(function(a,b){return a-b;});
      const sortedCorrect  = correct.slice().sort(function(a,b){return a-b;});
      const isCorrect = sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every(function(v, i) { return v === sortedCorrect[i]; });
      return { correct: isCorrect, userAnswer: selected };
    }
    if (q.type === 'short-answer') {
      const text = document.getElementById('short-answer-input').value.trim().toLowerCase();
      if (!text) return null;
      const keywords = Array.isArray(q.correct) ? q.correct : [q.correct];
      const matched = keywords.filter(function(k) { return text.includes(k.toLowerCase()); });
      const isCorrect = matched.length >= Math.ceil(keywords.length / 2);
      return { correct: isCorrect, userAnswer: text, matchedKeywords: matched, totalKeywords: keywords };
    }
    return null;
  }

  function showFeedback(q, result) {
    const section    = document.getElementById('feedback-section');
    const card       = document.getElementById('feedback-card');
    const icon       = document.getElementById('feedback-icon');
    const title      = document.getElementById('feedback-title');
    const explanation = document.getElementById('feedback-explanation');
    const misconception = document.getElementById('feedback-misconception');
    const refsBlock  = document.getElementById('feedback-references');
    const refsList   = document.getElementById('references-list');

    section.style.display = 'block';
    card.className = 'feedback-card ' + (result.correct ? 'correct-feedback' : 'incorrect-feedback');
    icon.textContent  = result.correct ? '✅' : '❌';
    title.textContent = result.correct ? 'Correct!' : 'Not quite…';
    explanation.textContent  = q.explanation;
    misconception.textContent = q.misconception;

    // Remove any previous hint
    const oldHint = card.querySelector('.correct-answer-hint');
    if (oldHint) oldHint.remove();

    if (!result.correct) {
      let correctAnswerText = '';
      if (q.type === 'multiple-choice') {
        correctAnswerText = 'Correct answer: ' + String.fromCharCode(65 + q.correct) + '. ' + q.options[q.correct];
        document.querySelectorAll('.option-label').forEach(function(l) {
          const idx = parseInt(l.querySelector('input').value, 10);
          if (idx === q.correct) l.classList.add('correct');
          else if (l.classList.contains('selected')) l.classList.add('incorrect');
        });
      } else if (q.type === 'multi-select') {
        const correct = Array.isArray(q.correct) ? q.correct : [q.correct];
        document.querySelectorAll('.option-label').forEach(function(l) {
          const idx = parseInt(l.querySelector('input').value, 10);
          if (correct.includes(idx)) l.classList.add('correct');
          else if (l.classList.contains('selected')) l.classList.add('incorrect');
        });
        correctAnswerText = 'Correct answers: ' + correct.map(function(i) {
          return String.fromCharCode(65 + i) + '. ' + q.options[i];
        }).join(', ');
      } else if (q.type === 'short-answer') {
        const kws = Array.isArray(q.correct) ? q.correct : [q.correct];
        correctAnswerText = 'Keywords to include: ' + kws.join(', ');
        if (result.matchedKeywords && result.matchedKeywords.length > 0) {
          correctAnswerText += ' (You matched: ' + result.matchedKeywords.join(', ') + ')';
        }
      }
      if (correctAnswerText) {
        const answerHint = document.createElement('p');
        answerHint.className = 'correct-answer-hint';
        answerHint.textContent = correctAnswerText;
        const misconceptionBlock = card.querySelector('.misconception-block');
        card.insertBefore(answerHint, misconceptionBlock);
      }
    } else {
      if (q.type === 'multiple-choice' || q.type === 'multi-select') {
        document.querySelectorAll('.option-label.selected').forEach(function(l) {
          l.classList.add('correct');
        });
      }
    }

    // References
    if (q.references && q.references.length > 0) {
      refsBlock.style.display = 'block';
      refsList.innerHTML = q.references.map(function(ref) {
        return '<li><a href="' + escapeHtml(ref) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(ref) + '</a></li>';
      }).join('');
    } else {
      refsBlock.style.display = 'none';
    }

    // Nav buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    prevBtn.style.display = currentIndex > 0 ? 'inline-flex' : 'none';
    nextBtn.textContent = currentIndex < questions.length - 1 ? 'Next →' : 'See Results';

    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function restoreAnswer(q) {
    const saved = answers[q.id];
    if (!saved) return;
    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('confidence-section').style.display = 'none';
    // Re-render options so we can highlight them
    if (q.type !== 'short-answer') {
      renderOptions(q);
      // Reselect the saved option(s)
      const userAnswer = saved.answer;
      const selected = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      document.querySelectorAll('.option-label').forEach(function(l) {
        const idx = parseInt(l.querySelector('input').value, 10);
        if (selected.includes(idx)) {
          l.classList.add('selected');
          l.querySelector('input').checked = true;
          l.setAttribute('aria-checked', 'true');
        }
      });
    }
    showFeedback(q, { correct: saved.correct, userAnswer: saved.answer,
      matchedKeywords: saved.matchedKeywords, totalKeywords: saved.totalKeywords });
  }

  function showResults() {
    document.getElementById('question-card').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';

    const total    = questions.length;
    const answered = Object.values(answers).length;
    const correct  = Object.values(answers).filter(function(a) { return a.correct; }).length;
    const pct      = answered > 0 ? Math.round(correct / answered * 100) : 0;
    const avgConf  = answered > 0
      ? Math.round(Object.values(answers).reduce(function(s, a) { return s + (a.confidence || 50); }, 0) / answered)
      : 0;

    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '🤔' : '📚';
    document.getElementById('results-emoji').textContent = emoji;
    document.getElementById('results-title').textContent =
      pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Work!' : pct >= 40 ? 'Keep Learning!' : 'Room to Grow!';
    document.getElementById('results-summary').textContent =
      'You answered ' + correct + ' out of ' + answered + ' questions correctly (' + pct + '%).';

    document.getElementById('results-stats').innerHTML =
      '<div class="stat-card" role="listitem"><strong>' + correct + '/' + total + '</strong><span>Correct</span></div>' +
      '<div class="stat-card" role="listitem"><strong>' + pct + '%</strong><span>Score</span></div>' +
      '<div class="stat-card" role="listitem"><strong>' + avgConf + '%</strong><span>Avg Confidence</span></div>' +
      '<div class="stat-card" role="listitem"><strong>' + (packTopic === 'all' ? 'All Topics' : packTopic) + '</strong><span>Pack</span></div>';
  }

  function updateConfidenceLabel(val) {
    const el = document.getElementById('confidence-value');
    if (el) el.textContent = val;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
  }

  function showSubmitError(msg) {
    let el = document.getElementById('submit-error');
    if (!el) {
      el = document.createElement('p');
      el.id = 'submit-error';
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'assertive');
      el.style.cssText = 'color:var(--error);font-size:0.9rem;margin-top:0.5rem;font-weight:600;';
      const actions = document.getElementById('submit-btn').parentElement;
      actions.appendChild(el);
    }
    el.textContent = msg;
  }

  function hideSubmitError() {
    const el = document.getElementById('submit-error');
    if (el) el.textContent = '';
  }

  // --- Event handlers ---
  const confidenceSlider = document.getElementById('confidence-slider');
  if (confidenceSlider) {
    confidenceSlider.addEventListener('input', function(e) {
      updateConfidenceLabel(e.target.value);
    });
  }

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      const q = questions[currentIndex];
      const result = checkAnswer(q);
      if (!result) {
        showSubmitError('Please select an answer before submitting.');
        return;
      }
      hideSubmitError();
      const confidence = parseInt((document.getElementById('confidence-slider') || {value: '50'}).value, 10);
      answers[q.id] = {
        correct: result.correct,
        answer:  result.userAnswer,
        confidence: confidence,
        matchedKeywords: result.matchedKeywords,
        totalKeywords:   result.totalKeywords
      };
      recordAnswer(q, result.correct, result.userAnswer, confidence);
      document.getElementById('submit-btn').style.display = 'none';
      document.getElementById('confidence-section').style.display = 'none';
      showFeedback(q, result);
    });
  }

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        showQuestion(questions[currentIndex], currentIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showResults();
      }
    });
  }

  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      if (currentIndex > 0) {
        currentIndex--;
        showQuestion(questions[currentIndex], currentIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      answers = {};
      currentIndex = 0;
      document.getElementById('results-screen').style.display = 'none';
      document.getElementById('question-card').style.display = 'block';
      showQuestion(questions[0], 0);
    });
  }

  // --- Init ---
  async function init() {
    try {
      const allQuestions = await window.loadQuestions();
      packTopic = getTopicParam();

      if (packTopic === 'all') {
        questions = allQuestions;
      } else {
        questions = window.getQuestionsByTopic(allQuestions, packTopic);
      }

      if (questions.length === 0) {
        document.getElementById('quiz-main').innerHTML =
          '<p class="error">No questions found for this topic. <a href="index.html">Go back</a></p>';
        return;
      }

      // Set pack title badge
      const packTitleEl = document.getElementById('pack-title');
      if (packTitleEl) {
        packTitleEl.textContent = packTopic === 'all'
          ? '📚 All Topics'
          : (window.TOPIC_ICONS[packTopic] || '') + ' ' + packTopic;
      }

      showQuestion(questions[0], 0);
    } catch (err) {
      console.error(err);
      document.getElementById('quiz-main').innerHTML =
        '<p class="error">Failed to load quiz. Please serve this through a web server. <a href="index.html">Go back</a></p>';
    }
  }

  init();
})();
