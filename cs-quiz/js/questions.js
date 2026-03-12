// questions.js - Data loader
(function() {
  'use strict';

  // Determine base URL for data file
  function getBasePath() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src.includes('questions.js')) {
        return s.src.replace(/\/js\/questions\.js.*$/, '');
      }
    }
    return '.';
  }

  const basePath = getBasePath();

  // Load and cache questions
  let _cache = null;

  window.loadQuestions = async function() {
    if (_cache) return _cache;
    const res = await fetch(basePath + '/data/questions.json');
    if (!res.ok) throw new Error('Failed to load questions.json');
    _cache = await res.json();
    return _cache;
  };

  window.getTopics = function(questions) {
    return [...new Set(questions.map(q => q.topic))];
  };

  window.getQuestionsByTopic = function(questions, topic) {
    return questions.filter(q => q.topic === topic);
  };

  window.topicSlug = function(topic) {
    return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  window.topicClass = function(topic) {
    const map = {
      'Big-O Complexity':          'topic-bigo',
      'Recursion vs Iteration':    'topic-rec',
      'P vs NP':                   'topic-pnp',
      'Memory: Stack & Heap':      'topic-mem',
      'Concurrency vs Parallelism':'topic-con',
      'Hash Tables':               'topic-hash',
      'OOP vs Functional':         'topic-oop'
    };
    return map[topic] || 'topic-bigo';
  };

  window.TOPIC_ICONS = {
    'Big-O Complexity':           '📊',
    'Recursion vs Iteration':     '🔄',
    'P vs NP':                    '🧩',
    'Memory: Stack & Heap':       '🗄️',
    'Concurrency vs Parallelism': '⚡',
    'Hash Tables':                '#️⃣',
    'OOP vs Functional':          '🏗️'
  };
})();
