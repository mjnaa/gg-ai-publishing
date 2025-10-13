/*
 * ============================================================================
 * 풀스크린 로딩
 * ============================================================================
 */


(function () {
  'use strict';
  var el = document.getElementById('appLoader');
  if (!el) return;

  function show(message){
    if (message) {
      var t = el.querySelector('.loader-text');
      if (t) t.textContent = String(message);
    }
    el.hidden = false;
    el.removeAttribute('aria-hidden');
    document.documentElement.classList.add('is-loading');
  }

  function hide(){
    el.setAttribute('aria-hidden','true');
    el.hidden = true;
    document.documentElement.classList.remove('is-loading');
  }

  window.AppLoader = { show: show, hide: hide };
})();