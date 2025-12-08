/*
 * ============================================================================
 * 드롭다운메뉴 / 단일선택메뉴
 * 1) 기본 구조  
 *    - 루트: .dd-choice  
 *    - 토글 버튼: .dd-choice-toggle  
 *    - 리스트: .dd-choice-list  
 *    - 항목 버튼: .dd-choice-item (.active → 현재 선택 항목)
 * 2) 기능  
 *    - 토글 버튼 클릭 시 열기/닫기 발생  
 *    - 항목 선택 시 .active 토글 및 .dd-title 텍스트 반영  
 *    - 외부 클릭 / ESC 입력 시 닫기  
 * 3) 비고
 *    - LLM 선택 시 안내문 표시 기능 삭제
============================================================================
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

})();