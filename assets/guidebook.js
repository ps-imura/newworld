/* AI運用指南書 共通 JS
 * - ユーザー環境（ユーザー名 / Mac名 / 開発フォルダルート）を localStorage に保存
 * - ページ内の [data-var="..."] 要素を該当値で置換
 * - 第3章の入力フォームから値を更新できる
 */

(function () {
  const STORAGE_KEY = 'guidebook-vars-v2';

  // デフォルト値（未設定時の表示用）
  const DEFAULTS = {
    user: 'jinimura',
    machine: 'MacBook-Pro',
    devroot: '~/dev'
  };

  let VARS = Object.assign({}, DEFAULTS);

  function loadVars() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        VARS = Object.assign({}, DEFAULTS, parsed);
      }
    } catch (e) {
      // localStorage が使えない環境ではデフォルトのまま
    }
  }

  function saveVars() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(VARS));
    } catch (e) {
      /* noop */
    }
  }

  function applyVars() {
    document.querySelectorAll('[data-var]').forEach(function (el) {
      const key = el.dataset.var;
      if (VARS[key] !== undefined) {
        el.textContent = VARS[key];
      }
    });
  }

  function parsePrompt(input) {
    // 入力例: "jinimura@MacBook-Pro ~ %" → user=jinimura, machine=MacBook-Pro
    if (!input) return null;
    const trimmed = input.trim();
    const match = trimmed.match(/^([A-Za-z0-9._-]+)@([^\s]+)/);
    if (match) {
      return { user: match[1], machine: match[2] };
    }
    return null;
  }

  function normalizeDevroot(input) {
    if (!input) return '';
    let v = input.trim();
    // 末尾スラッシュを除去
    v = v.replace(/\/+$/, '');
    return v;
  }

  function setupForm() {
    const form = document.getElementById('guidebook-config');
    if (!form) return;

    const promptInput = form.querySelector('[name="prompt"]');
    const devrootInput = form.querySelector('[name="devroot"]');
    const status = form.querySelector('.config-status');
    const resetBtn = form.querySelector('.config-reset');

    // 既存値を表示
    if (promptInput) {
      promptInput.value = VARS.user + '@' + VARS.machine;
    }
    if (devrootInput) {
      devrootInput.value = VARS.devroot;
    }

    function update() {
      let changed = false;

      if (promptInput) {
        const parsed = parsePrompt(promptInput.value);
        if (parsed) {
          VARS.user = parsed.user;
          VARS.machine = parsed.machine;
          changed = true;
        }
      }

      if (devrootInput) {
        const normalized = normalizeDevroot(devrootInput.value);
        if (normalized) {
          VARS.devroot = normalized;
          changed = true;
        }
      }

      if (changed) {
        applyVars();
        saveVars();
        if (status) {
          status.textContent = '保存しました（このブラウザにのみ保存されます）';
          status.classList.add('saved');
          setTimeout(function () {
            status.classList.remove('saved');
          }, 2000);
        }
      }
    }

    form.addEventListener('input', update);
    form.addEventListener('change', update);

    if (resetBtn) {
      resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        VARS = Object.assign({}, DEFAULTS);
        if (promptInput) promptInput.value = VARS.user + '@' + VARS.machine;
        if (devrootInput) devrootInput.value = VARS.devroot;
        applyVars();
        saveVars();
        if (status) {
          status.textContent = 'デフォルトに戻しました';
          status.classList.add('saved');
          setTimeout(function () {
            status.classList.remove('saved');
          }, 2000);
        }
      });
    }
  }

  // ===== チェックリスト管理 =====

  const CHECKLIST_PREFIX = 'guidebook-checklist-';

  function loadChecklistState(id) {
    try {
      const raw = localStorage.getItem(CHECKLIST_PREFIX + id);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveChecklistState(id, state) {
    try {
      localStorage.setItem(CHECKLIST_PREFIX + id, JSON.stringify(state));
    } catch (e) {}
  }

  function setupChecklists() {
    const lists = document.querySelectorAll('ul.checklist[data-checklist-id]');
    if (!lists.length) {
      // チェックリストがない章では「次の章へ」をロックしない
      return;
    }

    lists.forEach(function (list) {
      const id = list.dataset.checklistId;
      const state = loadChecklistState(id);
      const items = list.querySelectorAll('input[type="checkbox"]');

      items.forEach(function (cb, i) {
        if (state[i]) cb.checked = true;
        cb.addEventListener('change', function () {
          const next = {};
          items.forEach(function (c, j) {
            if (c.checked) next[j] = true;
          });
          saveChecklistState(id, next);
          updateNavLock();
          updateStatusLabel(list);
        });
      });

      updateStatusLabel(list);
    });

    updateNavLock();
  }

  function updateStatusLabel(list) {
    const statusEl = list.parentElement.querySelector('.checklist-status');
    if (!statusEl) return;
    const items = list.querySelectorAll('input[type="checkbox"]');
    const checked = Array.prototype.filter.call(items, function (cb) {
      return cb.checked;
    }).length;
    const total = items.length;
    if (checked === total) {
      statusEl.textContent = 'チェック完了 — 次の章に進めます';
      statusEl.classList.add('complete');
    } else {
      statusEl.textContent = 'チェック ' + checked + ' / ' + total + ' — 全て付けると次の章に進めます';
      statusEl.classList.remove('complete');
    }
  }

  function updateNavLock() {
    const lists = document.querySelectorAll('ul.checklist[data-checklist-id]');
    if (!lists.length) return;

    let allChecked = true;
    lists.forEach(function (list) {
      const items = list.querySelectorAll('input[type="checkbox"]');
      items.forEach(function (cb) {
        if (!cb.checked) allChecked = false;
      });
    });

    const nextLinks = document.querySelectorAll('.chapter-nav a.next');
    nextLinks.forEach(function (link) {
      if (allChecked) {
        link.classList.remove('locked');
        link.removeAttribute('aria-disabled');
        link.removeAttribute('title');
      } else {
        link.classList.add('locked');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('title', 'この章のチェックリストを全て完了すると進めます');
      }
    });
  }

  function init() {
    loadVars();
    applyVars();
    setupForm();
    setupChecklists();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
