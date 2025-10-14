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
 *      · 선택 버튼에만 .is-active 클래스 부여
 *      · 안내문구는 #chat-guide 내 p.guide-em에 출력, #chat-input 포커스 이동
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

  function openSubById(panelId, triggerBtn) {
    // 항상 전환. 다른 패널 닫고 대상만 표시
    closeAllSubs();
    var panel = panelId ? document.getElementById(panelId) : null;
    if (panel) {
      panel.removeAttribute('hidden');
    }
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
  }

  function getTopLabelFromCardBtn(cardBtn) {
    var t = cardBtn.querySelector('.smart-title');
    return t && t.textContent ? t.textContent.trim() : (cardBtn.textContent || '').trim();
  }

  function getLabelFromSubBtn(btn) {
    var custom = btn.getAttribute('data-label');
    return custom && custom.trim() ? custom.trim() : (btn.textContent || '').trim();
  }

  function renderGuide(str) {
    if (!guideEl) return;
    guideEl.innerHTML = '<p class="guide-em">' + str + '</p>';
  }

  function focusTextarea() {
    if (textareaEl) textareaEl.focus();
  }

  function buildPrompt(label, dataPrompt) {
    if (dataPrompt && dataPrompt.trim()) return dataPrompt.trim();
    return '다음을 ' + label + '에 맞춰 작성합니다 : ';
  }

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

  /* ===== 이벤트: 상위 카드 클릭  ===== */
  topList.addEventListener('click', function (e) {
    var btn = e.target.closest('.smart-card-btn');
    if (!btn) return;

    var panelId = btn.getAttribute('aria-controls');
    var panel   = panelId ? document.getElementById(panelId) : null;

    // 하위 패널이 없으면 안내문구 즉시 출력 + 다른 하위 패널 숨김
    if (!panel) {
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

    var label   = getLabelFromSubBtn(subBtn);
    var custom  = subBtn.getAttribute('data-prompt');
    var prompt  = buildPrompt(label, custom);

    renderGuide(prompt);
    focusTextarea();
  });

})();
