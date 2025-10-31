/*
 * ============================================================================
 * 인라인 알럿 
 * 1) 트리거
 *    - UIInlineAlert.show({ title?, message?, subtext? }), UIInlineAlert.hide()
 * 2) 기능
 *    - .chat-m, .chat-l 요소 위에 경고 알럿 삽입
 *    - 닫기 버튼 또는 UIInlineAlert.hide()로 닫기
 *    - 페이지에 마크업이 없으면 동일 구조를 동적 생성 후 재사용
 * ============================================================================
 */


(function () {
  'use strict';

  function $(sel, ctx){ return (ctx || document).querySelector(sel); }

  function findChatBox(){
    return $('.chat-m') || $('.chat-l');
  }

  /* ===== 엘리먼트 생성 ===== */
  function ensureAlertEl(){
    var el = $('.inline-alert-warning');
    if (el) return el;

    el = document.createElement('div');
    el.className = 'inline-alert-warning';
    el.innerHTML =
      '<div class="alert-panel">' +
        '<div class="alert-head">' +
          '<div>' +
            '<span class="icon22 icon--error-fill icon--warning"></span>' +
            '<p>입력제한안내</p>' +
          '</div>' +
          '<button class="btn-aside-close btn-icon-normal-m" type="button" aria-label="알럿 닫기">' +
            '<span class="icon20 icon--close icon--warning"></span>' +
          '</button>' +
        '</div>' +
        '<div class="alert-body">' +
          '<p>개인정보 또는 민감정보가 포함된 요청은 처리할 수 없습니다.</p>' +
          '<p class="subtext"></p>' +
        '</div>' +
      '</div>';
    return el;
  }

  function showAlert(opts){
    opts = opts || {};

    var chat = findChatBox();
    if (!chat) return;

    var el = ensureAlertEl();

    // 내용 갱신
    var titleEl = el.querySelector('.alert-head p');
    var bodyEl  = el.querySelector('.alert-body > p:not(.subtext)');
    var subEl   = el.querySelector('.alert-body .subtext');

    if (titleEl && opts.title)   titleEl.textContent   = opts.title;
    if (bodyEl  && opts.message) bodyEl.textContent    = opts.message;
    if (subEl) {
      if (opts.subtext) { subEl.innerHTML = opts.subtext; subEl.style.display = ''; }
      else              { subEl.textContent = ''; subEl.style.display = 'none'; }
    }

    // 폼 바깥으로 삽입
    var form = chat.closest('form');
    if (form && form.parentNode) {
      if (el.parentNode !== form.parentNode || el.nextSibling !== form) {
        form.parentNode.insertBefore(el, form); 
      }
    } else {
      // 폼이 없으면 기존대로 chat 바로 앞
      if (el.parentNode !== chat.parentNode || el.nextSibling !== chat) {
        chat.parentNode.insertBefore(el, chat);
      }
    }

    // 표시
    el.classList.add('is-open');
    el.style.display = 'block';

    // 닫기 버튼
    var closeBtn = el.querySelector('.btn-aside-close');
    if (closeBtn && !closeBtn._bound) {
      closeBtn.classList.remove('btn-aside-close');

      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation(); 
        hideAlert();
      }, true);
      closeBtn._bound = true;
    }

  }

  function hideAlert(){
    var el = $('.inline-alert-warning');
    if (!el) return;
    el.classList.remove('is-open');
    el.style.display = 'none';
  }

  window.UIInlineAlert = {
    show: showAlert,
    hide: hideAlert
  };


  /* ===== 데모 : 04-inlinealert.html 전용 ===== */
  function bindDemo(){
    var demoBtn = document.querySelector('.msg.is-user .msg-bubble button');
    if (!demoBtn) return;
    demoBtn.addEventListener('click', function(){
      UIInlineAlert.show({
        title: '입력제한안내',
        message: '개인정보 또는 민감정보가 포함된 요청은 처리할 수 없습니다.',
        subtext: '- 고객리스트.xlsx (전화번호 포함 외 78건)<br>- 직원정보.docx (주민등록번호 포함 외 23건)<br>- 상담내역.txt (이메일 주소 포함 외 64건)'
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDemo);
  } else {
    bindDemo();
  }
})();