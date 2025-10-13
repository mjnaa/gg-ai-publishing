/*
 * ============================================================================
 * 모달 팝업
 * 1) 트리거  
 *    - data-modal-target="#modal-id"
 * 2) 닫기 버튼  
 *    - data-modal-close
 * 3) 모달 속성  
 *    - data-modal  
 *      · data-modal-backdrop-close="false" → 백드롭 클릭 시 닫힘 비활성 (기본 true)  
 *      · data-modal-esc="false" → ESC 닫기 비활성 (기본 true)
 * 4) 기능  
 *    - ESC 닫기 처리  
 *    - 백드롭/오버레이 클릭 닫기(옵션)  
 *    - 포커스 트랩 및 반환  
 *    - 중첩 모달 관리  
 *    - 스크롤 잠금 처리
 * ============================================================================
 */


(function () {
  'use strict';

  var openStack = [];
  var BODY_LOCK_CLASS = 'is-scroll-locked';
  var FOCUSABLE = [
    'a[href]','area[href]',
    'button:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  // z-index 기준값
  var BASE_Z = 3000;

  /* ===== 유틸 ===== */
  function isOpen(el){ return el && el.classList.contains('is-open'); }

  function lockScroll(){ document.documentElement.classList.add(BODY_LOCK_CLASS); }
  function unlockScroll(){
    if (openStack.length === 0) document.documentElement.classList.remove(BODY_LOCK_CLASS);
  }

  function trapFocus(panel, e){
    var focusables = panel.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;
    var first = focusables[0];
    var last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    }
    else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  }

  function getOpts(modalEl){
    return {
      backdropClose: modalEl.getAttribute('data-modal-backdrop-close') !== 'false', 
      escClose:      modalEl.getAttribute('data-modal-esc') !== 'false'
    };
  }

  function topModal(){ return openStack[openStack.length - 1]; }

  function setZForLevel(modal, level){
    var backdropZ = BASE_Z + level * 2 - 1;
    var modalZ    = BASE_Z + level * 2;
    if (modal.__backdrop) modal.__backdrop.style.zIndex = String(backdropZ);
    modal.style.zIndex = String(modalZ);
  }

  // 모달을 body로
  function portalToBody(modal){
    if (modal.__placeholder) return;
    var ph = document.createComment('modal-placeholder');
    modal.__placeholder = ph;
    modal.__originalParent = modal.parentNode;
    modal.__originalNext   = modal.nextSibling;
    modal.parentNode.insertBefore(ph, modal);
    document.body.appendChild(modal);
  }

  function restoreFromPortal(modal){
    if (!modal.__placeholder || !modal.__originalParent) return;
    modal.__originalParent.insertBefore(modal, modal.__placeholder);
    modal.__placeholder.remove();
    modal.__placeholder = null;
    modal.__originalParent = null;
    modal.__originalNext = null;
  }

  var Modal = {
    open: function(selectorOrEl){
      var modal = (typeof selectorOrEl === 'string')
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;
      if (!modal || isOpen(modal)) return;

      var panel = modal.querySelector('[data-modal-panel]') || modal;

      // 오프너 저장 (닫을 때 포커스 복귀)
      var opener = document.activeElement;
      modal.__opener = (opener instanceof HTMLElement) ? opener : null;

      // 모달을 body로
      portalToBody(modal);

      // 모달 전용 백드롭 생성 (body 하위)
      var backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop is-open'; 
      backdrop.__modal = modal; 
      modal.__backdrop = backdrop;
      document.body.appendChild(backdrop);

      // 스택 push + 표시
      openStack.push(modal);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      lockScroll();

      // 포커스 이동
      panel.setAttribute('tabindex', '-1');
      panel.focus({ preventScroll: true });

      // z-index 정렬 (백드롭 < 모달)
      setZForLevel(modal, openStack.length);
    },

    close: function(selectorOrEl){
      var modal = (typeof selectorOrEl === 'string')
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;
      if (!modal || !isOpen(modal)) return;

      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');

      // 스택 제거
      var idx = openStack.lastIndexOf(modal);
      if (idx > -1) openStack.splice(idx, 1);

      // 자기 백드롭 제거
      if (modal.__backdrop) {
        modal.__backdrop.remove();
        modal.__backdrop = null;
      }

      // 남은 모달 z-index 재정렬
      for (var i=0; i<openStack.length; i++){
        setZForLevel(openStack[i], i + 1);
      }

      // 스크롤 잠금 해제
      unlockScroll();

      // 포커스 복귀 
      var opener = modal.__opener;
      if (opener && openStack.length === 0) {
        setTimeout(function(){ opener.focus && opener.focus({ preventScroll: true }); }, 0);
      }

      restoreFromPortal(modal);
    },

    closeTop: function(){
      var top = topModal();
      if (top) Modal.close(top);
    }
  };

  
  window.SimpleModal = Modal;

  /* ===== 이벤트 바인딩 ===== */
  // 클릭: 열기 / 닫기 / 백드롭 / 오버레이 빈영역
  document.addEventListener('click', function(e){
    // 1) 열기 
    var trigger = e.target.closest && e.target.closest('[data-modal-target]');
    if (trigger) {
      var sel = trigger.getAttribute('data-modal-target');
      if (sel) { e.preventDefault(); Modal.open(sel); }
      return;
    }

    // 2) 닫기 버튼
    var closer = e.target.closest && e.target.closest('[data-modal-close]');
    if (closer) {
      var hostModal = closer.closest('[data-modal]');
      if (hostModal) { e.preventDefault(); Modal.close(hostModal); }
      return;
    }

    // 3) 백드롭 클릭
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      var modal = e.target.__modal;
      if (!modal) return;
      var opts = getOpts(modal);
      if (opts.backdropClose) Modal.close(modal);
      return;
    }

    // 4) 오버레이(모달 컨테이너) 빈 영역 클릭도 닫기
    var top = topModal();
    if (top) {
      var panel = top.querySelector('[data-modal-panel]') || top;
      var clickedInsideTopModal = (e.target.closest && e.target.closest('[data-modal]')) === top;
      var clickedInsidePanel = panel.contains(e.target);
      if (clickedInsideTopModal && !clickedInsidePanel) {
        var o = getOpts(top);
        if (o.backdropClose) Modal.close(top);
      }
    }
  });

  // 키다운: ESC 닫기 + 포커스 트랩
  document.addEventListener('keydown', function(e){
    var top = topModal();
    if (!top) return;

    // ESC 닫기
    if (e.key === 'Escape') {
      var opts = getOpts(top);
      if (opts.escClose) { e.preventDefault(); Modal.close(top); return; }
    }

    // 탭 포커스 트랩
    if (e.key === 'Tab') {
      var panel = top.querySelector('[data-modal-panel]') || top;
      trapFocus(panel, e);
    }
  });

})();
