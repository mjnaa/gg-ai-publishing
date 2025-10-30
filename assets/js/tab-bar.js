/* 
 * ============================================================================
 * 탭바
 * 1) 트리거
 *    - .tab-filter .tab-btn[data-target]
 * 2) 기능
 *    - 탭 버튼 클릭 시 해당 패널만 표시
 *    - 선택된 탭 버튼 상태 (.is-active) 동기화
 *    - 불필요한 탭/패널은 숨김 (hidden)
 * ============================================================================
 */


(function () {
  'use strict';

  var qsa = function (sel, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(sel));
  };

  function activateTab(btn) {
    if (!btn) return;

    var root = btn.closest('.prompt-panel') || document;
    var target = btn.getAttribute('data-target');
    var panel = document.getElementById(target);
    var allTabs = qsa('.tab-filter .tab-btn', root);
    var allPanels = qsa('.tab-panel', root);

    // 탭 버튼 상태 초기화
    allTabs.forEach(function (b) {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', 'false');
    });

    // 패널 숨김
    allPanels.forEach(function (p) {
      p.hidden = true;
    });

    // 선택 탭 활성화
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    if (panel) panel.hidden = false;
  }

  /* ====== 초기화 ====== */
  function initTabBar() {
    var tabButtons = qsa('.tab-filter .tab-btn');

    if (!tabButtons.length) return;

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateTab(btn);
      });
    });

    // 초기 상태 보정 (.is-active가 없으면 첫 탭 활성화)
    var active = document.querySelector('.tab-filter .tab-btn.is-active') || tabButtons[0];
    activateTab(active);
  }

  /* ====== 실행 ====== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabBar);
  } else {
    initTabBar();
  }

})();
