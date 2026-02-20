/*
 * ============================================================================
 * 프롬프트 라이브러리
 * 1) 트리거
 *    - 프롬프트 카드의 [적용] 버튼(.action-apply)
 *    - 상세 보기 모달(#modal-prompt-view) 내의 [적용] 버튼
 * 2) 기능
 *    - 카드 제목(.prompt-card-title)을 #chat-guide 내 p.guide-em에 출력
 *    - 공용 매니저(ChatGuide)로 출력하여, 다른 소스(스마트도우미) 상태를 함께 정리
 *    - 출력 후 #chat-input 포커스
 *    - 데스크탑: 플로팅패널 상태에서 적용 시 자동 도킹 전환
 *    - 태블릿/모바일: 적용 시 패널 닫기
 * 3) 대상
 *    - 가이드: #chat-guide .guide-em
 *    - 적용 버튼: .prompt-panel .action-apply
 *    - 제목: .prompt-card-title (동일 카드 내)
 * 3) 주의
 *    - chat-guide-manager.js가 먼저 로드되어 있어야 합니다.
 *    - 샘플로 상세 보기 모달 ID를 'modal-prompt-view'로 지정하여 작성했습니다.
 * ============================================================================
 */

(function () {
  'use strict';

  /* ===== 공용 가이드 매니저 참조 ===== */
  function getChatGuide() {
    return (window.ChatGuide && typeof window.ChatGuide.set === 'function') ? window.ChatGuide : null;
  }

  var SOURCE = 'prompt';

  var SELECTORS = {
    guide     : '#chat-guide',
    guideText : '#chat-guide .guide-em',
    textarea  : '#chat-input',
    applyBtn  : '.prompt-panel .action-apply',
    cardTitle : '.prompt-card-title',
    // 상세 보기 모달 ID (개발 시 해당 ID 부여 필요)
    viewModal : '#modal-prompt-view' 
  };

  var $body = document.body;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  /* ===== 반응형 판별 ===== */
  function isDesktop() { return window.innerWidth >= 1120; }
  function isTablet()  { return window.innerWidth >= 768 && window.innerWidth < 1120; }
  function isMobile()  { return window.innerWidth < 768; }

  function focusTextarea() {
    var ta = $(SELECTORS.textarea);
    if (ta) ta.focus();
  }

  /* ===== 공용 가이드 매니저 (스마트도우미/프롬프트 공존) ===== */
  /* ===== 프롬프트 적용 처리 ===== */
  function applyPromptTitleToGuide(titleText) {
    var guide = getChatGuide();
    if (guide) guide.set(titleText || '', SOURCE);

    // 반응형별 패널 상태 처리
    if (isDesktop()) {
      // 데스크탑: 플로팅 → 도킹 전환 
      if (window.Layout && typeof window.Layout.openAsideDocked === 'function') {
        window.Layout.openAsideDocked();
      } else {
        $body.classList.remove('is-aside-floating');
        $body.classList.remove('is-overlay');
      }
    } else if (isTablet() || isMobile()) {
      // 태블릿/모바일: 패널 닫기
      if (window.Layout && typeof window.Layout.closeAside === 'function') {
        window.Layout.closeAside();
      } else {
        $body.classList.remove('is-aside-open', 'is-aside-floating', 'is-overlay');
      }
    }

    focusTextarea();
  }

  /* ===== 이벤트 바인딩 ===== */
  function bindEvents() {
    // 공용 가이드 매니저 준비
    var guide = getChatGuide();
    if (guide) guide.registerClearer(SOURCE, function () {});

    document.addEventListener('click', function (e) {
      // 1. 사이드바 리스트의 적용 버튼
      var isListApply = e.target.closest(SELECTORS.applyBtn);
      
      // 2. 상세보기 모달(#modal-prompt-view) 내의 적용 버튼만 타겟팅
      var isModalApply = e.target.closest(SELECTORS.viewModal + ' .btn-solid-primary-l');

      var btn = isListApply || isModalApply;
      if (!btn) return;

      var titleTxt = "";
      var card = btn.closest('.prompt-item');
      var modal = btn.closest(SELECTORS.viewModal);

      if (card) {
        // 리스트에서 클릭한 경우: 카드 제목 텍스트 추출
        var titleEl = $(SELECTORS.cardTitle, card);
        titleTxt = titleEl ? (titleEl.textContent || '').trim() : '';
      } else if (modal) {
        // 모달 내에서 클릭한 경우: .form-input 요소의 value 값 추출
        var inputEl = modal.querySelector('.form-input');
        titleTxt = inputEl ? inputEl.value.trim() : "";
      }

      if (titleTxt || isListApply) {
        e.preventDefault();
        
        // 가이드 텍스트 설정 및 레이아웃 상태 변경 실행
        applyPromptTitleToGuide(titleTxt);

        // 사용된 모달 팝업 닫기 처리
        var openModal = btn.closest('.is-open');
        if (openModal) {
          openModal.classList.remove('is-open');
          var backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.classList.remove('is-open');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }
})();