/* ============================================================================
 * 프롬프트 라이브러리
 * 1) 트리거
 *    - 프롬프트 카드의 [적용] 버튼(.action-apply)
 * 2) 기능
 *    - 카드 내용(.prompt-card-desc)을 채팅창 textarea(#chat-input)에 주입
 *    - 기존 입력값이 있다면 삭제 후 새로 입력
 *    - 버튼으로 주입된 텍스트는 .is-suggested 상태로 파란색 표시
 *    - 사용자가 직접 입력 시 .is-suggested 제거 (기본색 복귀)
 *    - 데스크탑: 플로팅패널 상태에서 적용 시 자동 도킹 전환
 *    - 태블릿/모바일: 적용 시 패널 닫기
 * 3) 대상
 *    - textarea: #chat-input
 *    - 적용 버튼: .prompt-panel .action-apply
 *    - 내용: .prompt-card-desc (동일 카드 내)
 * ============================================================================
 */


(function () {
  'use strict';

  var SELECTORS = {
    textarea : '#chat-input',
    applyBtn : '.prompt-panel .action-apply',
    cardDesc: '.prompt-card-desc',
    sendBtn  : '.right-area .btn-icon-solid-m[aria-label="전송"], .right-area .btn-send'
  };

  var $body = document.body;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  /* ===== 반응형 판별 ===== */
  function isDesktop() { return window.innerWidth >= 1120; }    // 데스크탑
  function isTablet()  { return window.innerWidth >= 768 && window.innerWidth < 1120; }
  function isMobile()  { return window.innerWidth < 768; }

  function setCaretToEnd(el) {
    try {
      var len = el.value.length;
      el.setSelectionRange(len, len);
    } catch (e) {}
  }

  function dispatchInput(el) {
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {}
  }

  function ensureSendEnabled() {
    var btn = $(SELECTORS.sendBtn);
    var ta  = $(SELECTORS.textarea);
    if (!btn || !ta) return;

    var hasText = ta.value && ta.value.trim().length > 0;
    if (!hasText) return;

    btn.removeAttribute('disabled');
    btn.classList.remove('is-disabled');
    btn.setAttribute('aria-disabled', 'false');
  }

  /* ===== 자동 텍스트 색상 스타일 ===== */
  (function injectStyleOnce() {
    var id = 'prompt-lib-inline-style';
    if (document.getElementById(id)) return;

    var css = [
      '.chat-textarea.is-suggested {',
      '  color: var(--color-text-information) !important;',
      '}'
    ].join('');

    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  })();

  /* ===== 프롬프트 적용 처리 ===== */
  function applyPromptToTextarea(descText) {
    var ta = $(SELECTORS.textarea);
    if (!ta) return;

    ta.value = descText || '';
    ta.classList.add('is-suggested');
    setCaretToEnd(ta);
    dispatchInput(ta);
    ensureSendEnabled();

    // 반응형별 패널 상태 처리
    if (isDesktop()) {
      // 데스크탑: 플로팅 → 도킹 전환 
      if ($body.classList.contains('is-aside-open') && $body.classList.contains('is-aside-floating')) {
        if (window.Layout && typeof window.Layout.openAsideDocked === 'function') {
          window.Layout.openAsideDocked();
        } else {
          $body.classList.remove('is-aside-floating');
          $body.classList.remove('is-overlay');
        }
      }
    } else if (isTablet() || isMobile()) {
      // 태블릿/모바일: 패널 닫기
      if (window.Layout && typeof window.Layout.closeAside === 'function') {
        window.Layout.closeAside();
      } else {
        $body.classList.remove('is-aside-open');
        $body.classList.remove('is-aside-floating');
        $body.classList.remove('is-overlay');
      }
    }

    ta.focus();
  }

  /* ===== 이벤트 바인딩 ===== */
  function bindEvents() {
    // 적용 버튼 클릭
    document.addEventListener('click', function (e) {
      var btn = e.target.closest(SELECTORS.applyBtn);
      if (!btn) return;

      var card = btn.closest('.prompt-item');
      var descEl = card ? $(SELECTORS.cardDesc, card) : null;
      var descTxt = descEl ? (descEl.textContent || '').trim() : '';

      if (descTxt) {
        e.preventDefault();
        applyPromptToTextarea(descTxt);
      }
    });

    // 사용자 입력 이벤트
    var ta = $(SELECTORS.textarea);
    if (!ta) return;

    function removeSuggested(ev) {
      if (ev && ev.isTrusted) {
        ta.classList.remove('is-suggested');
      }
    }

    ta.addEventListener('keydown', removeSuggested);
    ta.addEventListener('paste', removeSuggested);
    ta.addEventListener('input', function (ev) {
      removeSuggested(ev);
      ensureSendEnabled();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();
