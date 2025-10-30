/*
 * ============================================================================
 * 스마트 도우미
 * 1) 트리거  
 *    - 상위 카드 버튼: .smart-card-btn (aria-controls로 하위 영역 연결)  
 *    - 하위 메뉴 버튼: .smart-sub-btn
 * 2) 기능
 *    - 상위 메뉴 클릭 시 연결된 하위 메뉴 열림 (다른 하위 메뉴는 자동 닫힘)  
 *      · 하위 패널이 없으면 모든 하위 패널 숨김 + 안내문구 출력
 *    - 하위 메뉴 클릭 시 단일 선택 상태 유지 (라디오형 동작)  
 *      · 선택 버튼에만 .is-active / aria-pressed="true"
 *      · 안내문구는 #chat-guide 내 p.guide-em에 출력, #chat-input 포커스
 *      · 안내문구 .sub-text 내용(예: 괄호 예시)은 제외
 *      · 안내문구 닫기 버튼 클릭 시 문구 초기화 및 .is-active 해제
 *    - '업무담당자'는 가이드 문구를 '다음 업무담당자를 찾아드립니다 : ' 로 출력
 * ============================================================================
 */


(function () {
  'use strict';

  var root         = document.querySelector('.chat-smart') || document;
  var topList      = root.querySelector('.smart-list');
  var subWrap      = root.querySelector('.smart-sub-wrap') || root.querySelector('.smart-sub-container') || root;
  var guideEl      = document.getElementById('chat-guide');
  var textareaEl   = document.getElementById('chat-input');
  var subContainer = subWrap || root;

  if (!topList) return; 

  function closeAllSubs() {
    var subs = root.querySelectorAll('.smart-sub');
    subs.forEach(function (p) { p.setAttribute('hidden', ''); });

    var topBtns = root.querySelectorAll('.smart-card-btn[aria-expanded]');
    topBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }

  // 추가: 모든 하위 버튼의 활성 상태(.is-active/aria-pressed) 전역 초기화
  function clearAllActiveSubs() {
    var actives = root.querySelectorAll('.smart-sub-btn.is-active');
    actives.forEach(function (b) {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });
  }

  function openSubById(panelId, triggerBtn) {
    // 항상 전환. 다른 패널 닫고 대상만 표시
    clearAllActiveSubs();
    closeAllSubs();
    var panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.removeAttribute('hidden');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
  }

  function getTopLabelFromCardBtn(cardBtn) {
    var t = cardBtn.querySelector('.smart-title');
    return t && t.textContent ? t.textContent.trim() : (cardBtn.textContent || '').trim();
  }

  // 하위 메뉴 버튼의 괄호 부분(.sub-text)은 제외하고 가이드 문구 노출
  function getGuideLabelFromSubBtn(btn) {
    var guideAttr = btn.getAttribute('data-guide-label');
    if (guideAttr && guideAttr.trim()) return guideAttr.trim();

    var custom = btn.getAttribute('data-label');
    if (custom && custom.trim()) return stripTrailingParen(custom.trim());

    var clone = btn.cloneNode(true);
    var extras = clone.querySelectorAll('.sub-text');
    extras.forEach(function (el) { el.remove(); });

    var txt = (clone.textContent || '').trim().replace(/\s+/g, ' ');
    if (txt) return stripTrailingParen(txt);

    var fallback = (btn.textContent || '').trim().replace(/\s+/g, ' ');
    return stripTrailingParen(fallback);
  }

  function stripTrailingParen(str) {
    return str.replace(/\([^)]*\)\s*$/, '').trim();
  }

  // 추가:: '업무담당자' 카테고리 전용 문구 처리
  function buildPrompt(label, dataPrompt) {
    if (dataPrompt && dataPrompt.trim()) return dataPrompt.trim();

    var normalized = (label || '').replace(/\s+/g, '');
    if (normalized.includes('업무담당자')) {
      return '다음 업무담당자를 찾아드립니다 : ';
    }
    return '다음을 ' + label + '에 맞춰 작성합니다 : ';
  }

  function renderGuide(str) {
    if (!guideEl) return;
    var p = guideEl.querySelector('.guide-em');
    if (p) p.textContent = str;
  }

  function clearGuide() {
    if (!guideEl) return;
    var p = guideEl.querySelector('.guide-em');
    if (p) p.textContent = ''; 
  }

  function focusTextarea() {
    if (textareaEl) textareaEl.focus();
  }

  /* ===== 이벤트: 상위 카드 클릭 ===== */
  topList.addEventListener('click', function (e) {
    var btn = e.target.closest('.smart-card-btn');
    if (!btn) return;

    var panelId = btn.getAttribute('aria-controls');
    var panel   = panelId ? document.getElementById(panelId) : null;

    // 하위 패널이 없으면: 전역 초기화 + 패널 닫기 + 가이드 출력
    if (!panel) {
      clearAllActiveSubs();
      closeAllSubs();
      btn.setAttribute('aria-expanded', 'false');

      var label   = getTopLabelFromCardBtn(btn);
      var custom  = btn.getAttribute('data-prompt');
      var prompt  = buildPrompt(label, custom);
      renderGuide(prompt);
      focusTextarea();
      return;
    }

    // 패널이 있으면 항상 전환
    openSubById(panelId, btn);
  });

  /* ===== 이벤트: 하위 메뉴 클릭 ===== */
  subContainer.addEventListener('click', function (e) {
    var subBtn = e.target.closest('.smart-sub-btn');
    if (!subBtn) return;

    setActiveSubBtn(subBtn);

    // 가이드용 라벨은 .sub-text 제외
    var labelForGuide = getGuideLabelFromSubBtn(subBtn);
    var custom        = subBtn.getAttribute('data-prompt');
    var prompt        = buildPrompt(labelForGuide, custom);

    renderGuide(prompt);
    focusTextarea();
  });

  function setActiveSubBtn(targetBtn) {
    var list = targetBtn.closest('.smart-sub-list') || targetBtn.parentElement;
    if (!list) return;

    var all = list.querySelectorAll('.smart-sub-btn');
    all.forEach(function (b) {
      b.classList.remove('is-active');
      b.setAttribute('aria-pressed', 'false');
    });

    targetBtn.classList.add('is-active');
    targetBtn.setAttribute('aria-pressed', 'true');
  }

  /* ===== 이벤트: 안내문구 닫기(X) 버튼 ===== */
  if (guideEl) {
    guideEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-aside-close');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      clearGuide();
      clearAllActiveSubs();
    });
  }

})();
