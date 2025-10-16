/*
 * =============================================================================
 * 테마 변경
 * 1) 트리거
 *    - 드롭다운 항목: [data-theme]
 * 2) 기능
 *    - 항목 클릭 시 <html data-theme="..."> 변경
 *    - localStorage('ui.theme') 저장 / auto 모드는 저장 해제
 *    - auto 선택 시 OS 시스템 테마(prefers-color-scheme) 자동 반영
 *    - 시스템 테마 변경 감지 시 실시간 반영
 * =============================================================================
 */


(function () {
  'use strict';

  var THEME_KEY = 'ui.theme';
  var VALID = ['light', 'dark', 'gg', 'auto'];
  var LABEL = { auto: '시스템', light: '라이크', dark: '다크', gg: '경기' };
  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function normalizeTheme(val) {
    if (!val) return null;
    var v = String(val).trim().toLowerCase();
    if (v === 'like' || v === '라이트') v = 'light';
    if (v === '다크') v = 'dark';
    if (v === '경기') v = 'gg';
    if (v === 'auto' || v === '시스템') v = 'auto';
    return VALID.indexOf(v) >= 0 ? v : null;
  }

  function getSystemTheme() {
    return mediaQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    var finalTheme = theme === 'auto' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', finalTheme);
    document.documentElement.style.colorScheme = (finalTheme === 'dark') ? 'dark' : 'light';
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: finalTheme } }));
  }

  function persistTheme(theme) {
    try {
      if (theme === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }

  function readSavedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function syncDropdown(theme) {
    document.querySelectorAll('[data-theme]').forEach(function (btn) {
      var v = normalizeTheme(btn.dataset.theme);
      btn.classList.toggle('is-active', v === theme);
      btn.setAttribute('aria-selected', String(v === theme));
    });
    document.querySelectorAll('[data-theme-current]').forEach(function (el) {
      el.textContent = LABEL[theme] || theme;
    });
  }

  function init() {
    var saved = normalizeTheme(readSavedTheme()) || 'auto';
    applyTheme(saved);
    syncDropdown(saved);
  }

  // 시스템 테마 변경 감지 (auto 모드일 때만 반응)
  mediaQuery.addEventListener('change', function () {
    var saved = normalizeTheme(readSavedTheme());
    if (!saved || saved === 'auto') {
      applyTheme('auto');
      syncDropdown('auto');
    }
  });

  // 드롭다운 클릭 이벤트
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme]');
    if (!btn || btn === document.documentElement) return;
    e.preventDefault();

    var val = normalizeTheme(btn.dataset.theme);
    if (!val) return;

    applyTheme(val);
    persistTheme(val);
    syncDropdown(val);
  });

  document.addEventListener('DOMContentLoaded', init);
})();
