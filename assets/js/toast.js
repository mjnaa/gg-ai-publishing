/*
 * ============================================================================
 * 토스트 팝업
 * 1) 트리거
 *    - UIToast.show(type, message?, { duration?, position? })
 *      · type: "danger" | "success" | "information"
 *      · message: 표시할 문자열 (선택)
 *      · duration: 노출 시간(ms), 기본 3000
 *      · position: "top-center" | "bottom-right" (기본 "top-center")
 * 2) 기능
 *    - 위치별 스택 컨테이너(.toast-stack)를 생성하여 리스트로 쌓임
 *    - 새로 생성된 항목이 맨 위로, 먼저 생성된 항목은 아래로 내려감
 *    - 페이지에 토스트 마크업이 없으면 동적으로 생성하여 재사용
 * ============================================================================
 */

(function () {
  'use strict';

  var TYPE_CLASS = {
    danger: 'toast-danger',
    success: 'toast-success',
    information: 'toast-information'
  };

  var CLASS_ENTER = 'is-enter';
  var CLASS_OPEN  = 'is-open';
  var CLASS_LEAVE = 'is-leave';

  var POSITIONS = {
    'top-center': 'top-center',
    'bottom-right': 'bottom-right'
  };

  function $(sel, ctx){ return (ctx || document).querySelector(sel); }
  function create(html){
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /* ===== 스택 컨테이너(위치별) ===== */
  function ensureStack(position){
    var pos = POSITIONS[position] || POSITIONS['top-center'];
    var selector = '.toast-stack[data-position="' + pos + '"]';
    var stack = $(selector);
    if (stack) return stack;

    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('data-position', pos);

    // 접근성: 스택 컨테이너에서 라이브 영역 운용
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-relevant', 'additions removals');

    // CSS 훅(선택): 포지션별 클래스도 같이 부여
    stack.classList.add(pos === 'bottom-right' ? 'toast-stack--br' : 'toast-stack--tc');

    document.body.appendChild(stack);
    return stack;
  }

  /* ===== 항목 생성 ===== */
  function makeItem(type, message){
    var cls = TYPE_CLASS[type] || TYPE_CLASS.information;

    var icon =
      (type === 'danger')      ? '<span class="icon22 icon--error-fill icon--danger"></span>' :
      (type === 'success')     ? '<span class="icon22 icon--check-fill icon--success"></span>' :
                                 '<span class="icon22 icon--info-fill icon--info"></span>';

    var el = create(
      '<div class="toast-item ' + cls + ' ' + CLASS_ENTER + '" aria-live="polite">' +
        '<div class="toast-panel">' + icon + '<p></p></div>' +
      '</div>'
    );
    var p = el.querySelector('p');
    if (p) p.textContent = message || '';
    return el;
  }

  /* ===== 진입/퇴장 처리 ===== */
  function enter(el){
    requestAnimationFrame(function(){
      el.classList.add(CLASS_OPEN);
      el.classList.remove(CLASS_ENTER);
    });
  }

  function leave(el, cb){
    el.classList.add(CLASS_LEAVE);
    var finished = false;
    function done(){
      if (finished) return;
      finished = true;
      if (el && el.parentNode) el.parentNode.removeChild(el);
      if (typeof cb === 'function') cb();
    }
    el.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 500);
  }

  window.UIToast = {
    show: function(type, message, opts){
      opts = opts || {};
      var duration = Number(opts.duration || 3000);
      var position = opts.position || 'top-center';

      var stack = ensureStack(position);
      var item  = makeItem(type, message);

      // 새 항목을 위로
      if (stack.firstChild) {
        stack.insertBefore(item, stack.firstChild);
      } else {
        stack.appendChild(item);
      }

      enter(item);

      item._timer = setTimeout(function(){
        leave(item);
      }, duration);
    }
  };

  /* ===== 데모 : 03-toast.html 전용  ===== */
  function bindDemoButtons(){
    var btns = document.querySelectorAll('.btn-solid-primary-m');
    if (btns.length >= 3) {
      btns[0].addEventListener('click', function(){ UIToast.show('danger', '파일을 찾을 수 없습니다.'); });
      btns[1].addEventListener('click', function(){ UIToast.show('success', '링크가 복사되었습니다.'); });
      btns[2].addEventListener('click', function(){ UIToast.show('information', '진행 중입니다. 잠시만 기다려주세요.'); });
      btns[3].addEventListener('click', function(){ UIToast.show('information', '파일 다운로드를 준비 중입니다. 잠시만 기다려 주세요.', { position: 'bottom-right', duration: 6000 }); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindDemoButtons);
  } else {
    bindDemoButtons();
  }

})();
