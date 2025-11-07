/*
 * ============================================================================
 * 채팅 입력 모듈 (자동 높이 + 전송/중지 버튼 상태)
 * 1) 대상
 *    - 입력창: #chat-input (textarea)
 *    - 컨테이너(선택): .chat-m → 2줄 이상 시 .is-multi 토글
 *    - 전송 버튼: .btn-send (button)
 *    - 아이콘 엘리먼트: .icon20 (icon--near / icon--stop 전환)
 * 2) 기능
 *    - 자동 높이
 *       · 입력 시 textarea 높이 자동 조절 (max-height까지 확장) 
 *       · 붙여넣기 / 잘라내기 / 리사이즈 / 로드시 자동 반영
 *       · 줄 수 1줄 → 기본, 2줄 이상 → .is-multi 클래스 토글
 *    - 전송/중지 버튼 상태
 *       · 입력값 공백 제외 0자 ⇒ disabled = true
 *       · 1자 이상 ⇒ disabled = false
 *       · "생성중"(isGenerating=true)일 때는 항상 버튼 활성(중지 가능)
 *       · 아이콘/라벨 전환: 전송(icon--near, aria-label="전송") ↔ 중지(icon--stop, aria-label="중지")
 *       · 초기 로드 시 상태 1회 동기화
 * 3) 비고
 *    - 오프스크린 미러 textarea 생성 후 scrollHeight 측정  
 *    - CSS max-height 재조회 후 높이 클램프 적용
 * ============================================================================
 */


(function () {
  'use strict';

  var ta = document.getElementById('chat-input');
  if (!ta) return;

  var box = document.querySelector('.chat-m');
  var rafId = null;
  var mirror = null;

  // 미러 1회 생성
  function ensureMirror() {
    if (mirror) return mirror;
    mirror = document.createElement('textarea');
    var s = mirror.style;
    s.position = 'absolute';
    s.top = '-99999px';
    s.left = '0';
    s.height = '0';
    s.minHeight = '0';
    s.maxHeight = 'none';
    s.opacity = '0';
    s.pointerEvents = 'none';
    s.overflow = 'hidden';
    s.whiteSpace = 'pre-wrap';
    s.wordWrap = 'break-word';
    s.border = '0';
    s.padding = '0';
    s.resize = 'none';
    document.body.appendChild(mirror);
    return mirror;
  }

  // 타깃의 텍스트 높이에 영향 주는 최소 속성만 복제
  function syncMirrorStyle() {
    var cs = getComputedStyle(ta);
    var ms = mirror.style;
    [
      'boxSizing','width','paddingTop','paddingRight','paddingBottom','paddingLeft',
      'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
      'fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','lineHeight',
      'textTransform','textIndent','wordSpacing','textAlign','whiteSpace'
    ].forEach(function (k) { ms[k] = cs[k]; });
    ms.width = ta.clientWidth + 'px'; // 스크롤바 보정
  }

  function readMaxH(el, fallback) {
    var mh = getComputedStyle(el).maxHeight;
    var n = parseFloat(mh);
    return (!mh || mh === 'none' || isNaN(n)) ? fallback : n;
  }

  function measureNeededHeight() {
    ensureMirror();
    syncMirrorStyle();
    mirror.value = ta.value && ta.value.length ? ta.value : ' ';
    mirror.style.height = '0px'; // 수축 후 측정
    mirror.scrollTop = 0;
    return mirror.scrollHeight;
  }

  function updateHeight() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      var needed = measureNeededHeight();
      var maxH = readMaxH(ta, 280);
      var nextH = Math.min(needed, maxH);
      ta.style.height = nextH + 'px';

      if (box) {
        var lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
        var lines = Math.round(needed / lh);
        box.classList.toggle('is-multi', lines > 1);
      }
    });
  }

  // 이벤트 최소화: 입력/붙여넣기/리사이즈만
  ta.addEventListener('input', updateHeight);
  ['cut','paste','change'].forEach(function (evt) {
    ta.addEventListener(evt, function(){ setTimeout(updateHeight, 0); });
  });
  window.addEventListener('resize', updateHeight);

  // 초기 1회
  window.addEventListener('load', updateHeight);
})();


/* ===== 전송 버튼 활성/비활성/중지 ===== */
(function () {
  'use strict';

  var textarea = document.getElementById('chat-input');
  var sendBtn = document.querySelector('.right-area .btn-icon-solid-m[aria-label="전송"]');
  if (!textarea || !sendBtn) return;

  var iconEl = sendBtn.querySelector('.icon20');
  var ICON_SEND = 'icon--near';
  var ICON_STOP = 'icon--stop';
  var GENERATING_CLASS = 'is-generating';
  var isGenerating = false;

  var form = sendBtn.closest('form');

  /* ----- 버튼 활성/비활성 ----- */
  function toggleButton() {
    // 생성중이면 항상 중지 가능해야 하므로 강제 활성
    if (isGenerating) {
      sendBtn.disabled = false;
      return;
    }
    var hasValue = textarea.value.trim().length > 0;
    sendBtn.disabled = !hasValue;
  }

  /* ----- 버튼 상태 전환 (전송 ↔ 중지) ----- */
  function setGenerating(state) {
    isGenerating = !!state;

    sendBtn.setAttribute('aria-pressed', String(isGenerating));
    var chatRoot = document.querySelector('.chat-root, .chat-m, .right-area'); 
    if (chatRoot) chatRoot.setAttribute('aria-busy', String(isGenerating));

    if (isGenerating) {
      sendBtn.setAttribute('aria-label', '중지');
      if (iconEl) {
        iconEl.classList.remove(ICON_SEND);
        iconEl.classList.add(ICON_STOP);
      }
      sendBtn.classList.add(GENERATING_CLASS);
      sendBtn.disabled = false;
    } else {
      sendBtn.setAttribute('aria-label', '전송');
      if (iconEl) {
        iconEl.classList.remove(ICON_STOP);
        iconEl.classList.add(ICON_SEND);
      }
      sendBtn.classList.remove(GENERATING_CLASS);
      // 상태 복원
      toggleButton();
    }
  }

  /* ----- 실제 전송 트리거 ----- */
  function triggerSend() {
    if (isGenerating) {
      setGenerating(false);
      // 중단 이벤트
      return;
    }

    if (sendBtn.disabled) return;
    setGenerating(true);
    // 전송 이벤트
  }

  /* ----- 클릭/submit 핸들링 ----- */
  sendBtn.addEventListener('click', function (e) {
    // 폼 기본동작 방지
    e.preventDefault();
    triggerSend();
  });

  // 폼 submit 대응
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      triggerSend();
    });
  }

  /* ----- 외부 연동 이벤트 훅 ----- */
  // 전송 시작
  document.addEventListener('gg:chat:started', function () { setGenerating(true); });
  // 생성 종료
  document.addEventListener('gg:chat:finished', function () { setGenerating(false); });
  // 강제 중단
  document.addEventListener('gg:chat:stop', function () { setGenerating(false); });

  /* ----- 입력 이벤트 ----- */
  textarea.addEventListener('input', toggleButton);

  /* ----- 초기 상태 동기화 ----- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', toggleButton, { once: true });
  } else {
    toggleButton();
  }
})();

