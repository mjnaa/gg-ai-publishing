/*
 * ============================================================================
 * 드롭다운메뉴 / 단일선택메뉴
 * 1) 기본 구조  
 *    - 루트: .dd-choice  
 *    - 토글 버튼: .dd-choice-toggle  
 *    - 리스트: .dd-choice-list  
 *    - 항목 버튼: .dd-choice-item (.active → 현재 선택 항목)
 * 2) 옵션  
 *    - data-choice="llm" → LLM 서비스 선택용 드롭다운  
 *      선택 시 .page-text.llm-XX 요소 탐색 후 5초간 안내문구 노출
 * 3) 기능  
 *    - 토글 버튼 클릭 시 열기/닫기 발생  
 *    - 항목 선택 시 .active 토글 및 .dd-title 텍스트 반영  
 *    - 외부 클릭 / ESC 입력 시 닫기  
 *    - LLM 선택 시 안내문 자동 표시
 * ============================================================================
 */


(function () {
  'use strict';

  function findChoiceRoot(el) {
    while (el && el !== document && !el.classList?.contains('dd-choice')) {
      el = el.parentNode;
    }
    return (el && el.classList && el.classList.contains('dd-choice')) ? el : null;
  }

  /* ===== 리스트 열기/닫기 ===== */
  function openList(root) {
    if (!root) return;
    const toggle = root.querySelector('.dd-choice-toggle');
    const list = root.querySelector('.dd-choice-list');
    if (!list || !toggle) return;

    // 다른 드롭다운은 닫기
    document.querySelectorAll('.dd-choice').forEach(function (node) {
      if (node !== root) closeList(node);
    });

    list.style.display = 'block';
    root.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeList(root) {
    if (!root) return;
    const toggle = root.querySelector('.dd-choice-toggle');
    const list = root.querySelector('.dd-choice-list');
    if (!list || !toggle) return;

    list.style.display = 'none';
    root.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleList(root) {
    if (!root) return;
    const isOpen = root.classList.contains('is-open');
    if (isOpen) closeList(root);
    else openList(root);
  }

  /* ===== 항목 선택 처리 ===== */
  function selectItem(btn) {
    const root = findChoiceRoot(btn);
    if (!root) return;

    const items = root.querySelectorAll('.dd-choice-item');
    items.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    // 타이틀 반영: .dd-choice-toggle .dd-title 에 선택 항목의 .dd-name 내용 삽입
    const titleHost = root.querySelector('.dd-choice-toggle .dd-title');
    const source = btn.querySelector('.dd-name') || btn;
    if (titleHost && source) {
      titleHost.innerHTML = source.innerHTML;
    }

    // 선택 후 닫기
    closeList(root);
  }

  /* ===== 외부 클릭/키보드 처리 ===== */
  function handleOutsideClick(evt) {
    const target = evt.target;
    const inside = !!findChoiceRoot(target);
    if (inside) return;
    document.querySelectorAll('.dd-choice.is-open').forEach(closeList);
  }

  function handleKeydown(evt) {
    if (evt.key === 'Escape') {
      document.querySelectorAll('.dd-choice.is-open').forEach(closeList);
    }
  }

  /* ===== 이벤트 위임 ===== */
  document.addEventListener('click', function (evt) {
    const target = evt.target;

    // 토글 버튼
    const toggle = target.closest?.('.dd-choice-toggle');
    if (toggle) {
      const root = findChoiceRoot(toggle);
      toggleList(root);
      return;
    }

    // 아이템 선택
    const item = target.closest?.('.dd-choice-item');
    if (item) {
      selectItem(item);
      return;
    }

    // 외부 클릭
    handleOutsideClick(evt);
  });

  document.addEventListener('keydown', handleKeydown);

  /* ===== 초기화 ===== */
  function init() {
    document.querySelectorAll('.dd-choice').forEach(function (root) {
      const toggle = root.querySelector('.dd-choice-toggle');
      if (toggle && !toggle.hasAttribute('aria-expanded')) {
        toggle.setAttribute('aria-expanded', 'false');
      }

      const current = root.querySelector('.dd-choice-item.active');
      if (current) {
        const titleHost = root.querySelector('.dd-choice-toggle .dd-title');
        const source = current.querySelector('.dd-name') || current;
        if (titleHost && source) titleHost.innerHTML = source.innerHTML;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ===== LLM 서비스 선택 시 안내문 5초 노출 (append-only)  ===== */
  (function () {
    var LAST_KEY = '__llmLastValue';
    var TIMER_KEY = '__llmNoticeTimerId';
    var DURATION = 5000; // 5초

    function closestChoice(el) {
      while (el && el !== document && !(el.classList && el.classList.contains('dd-choice'))) {
        el = el.parentNode;
      }
      return (el && el.classList && el.classList.contains('dd-choice')) ? el : null;
    }

    function findTextsNear(fromEl) {
      var scope = fromEl;
      while (scope && scope !== document.body) {
        var found = scope.querySelectorAll('.page-text');
        if (found && found.length) return Array.prototype.slice.call(found);
        scope = scope.parentElement;
      }
      var global = document.querySelectorAll('.page-text');
      return global && global.length ? Array.prototype.slice.call(global) : [];
    }

    function extractLlmKey(sourceEl) {
      if (!sourceEl) return null;

      // 토글 버튼 클릭이면 무시
      if (sourceEl.closest && sourceEl.closest('.dd-choice-toggle')) return null;

      // data-llm="llm-01" 우선
      var direct = sourceEl.getAttribute && sourceEl.getAttribute('data-llm');
      if (!direct && sourceEl.dataset) direct = sourceEl.dataset.llm;
      if (direct && /^llm-\d{2,}$/.test(direct)) return direct;

      // 클래스에서 추출 (icon--llm-01 / llm-01)
      var base = sourceEl.closest ? (sourceEl.closest('li,button,div') || sourceEl) : sourceEl;
      var nodes = [base].concat(Array.prototype.slice.call(base.querySelectorAll ? base.querySelectorAll('*') : []));
      for (var i = 0; i < nodes.length; i++) {
        var cls = nodes[i].classList ? nodes[i].classList : [];
        for (var j = 0; j < cls.length; j++) {
          var m = cls[j].match(/(?:^|--)llm-(\d{2,})$/);
          if (m) return 'llm-' + m[1];
        }
      }
      return null;
    }

    function showFor20s(anchor, llmKey) {
      var group = findTextsNear(anchor);
      if (!group.length) return;

      var target = null;
      for (var i = 0; i < group.length; i++) {
        if (group[i].classList && group[i].classList.contains(llmKey)) {
          target = group[i];
          break;
        }
      }
      if (!target) return;

      // 기존 타이머 정리 + 전체 숨김
      for (var k = 0; k < group.length; k++) {
        var el = group[k];
        if (el[TIMER_KEY]) {
          clearTimeout(el[TIMER_KEY]);
          el[TIMER_KEY] = null;
        }
        el.classList.remove('is-visible');
      }

      // 표시 후 자동 숨김
      target.classList.add('is-visible');
      target[TIMER_KEY] = setTimeout(function () {
        target.classList.remove('is-visible');
        target[TIMER_KEY] = null;
      }, DURATION);
    }

    function trigger(root, selectedEl) {
      if (!root) return;
      var key = extractLlmKey(selectedEl || root);
      if (!key) return;

      var prev = root[LAST_KEY];
      if (prev && prev === key) return;
      root[LAST_KEY] = key;

      showFor20s(root.parentElement || root, key);
    }

    // 자동 바인딩: LLM 드롭다운의 리스트 아이템 클릭에만 반응
    document.addEventListener('click', function (e) {
      var scope = e.target.closest && e.target.closest('.dd-choice[data-choice="llm"]');
      if (!scope) return;

      var btn = e.target.closest && e.target.closest(
        '.dd-choice[data-choice="llm"] .dd-choice-list button, ' +
        '.dd-choice[data-choice="llm"] [role="menu"] [role="menuitem"], ' +
        '.dd-choice[data-choice="llm"] .dd button'
      );
      if (!btn) return;

      if (btn.closest && btn.closest('.dd-choice-toggle')) return; // 토글은 무시

      var root = closestChoice(btn);
      if (!root) return;

      Promise.resolve().then(function () { trigger(root, btn); });
    });

    window.GG_LLM_NOTICE = window.GG_LLM_NOTICE || { trigger: trigger };
  })();

})();