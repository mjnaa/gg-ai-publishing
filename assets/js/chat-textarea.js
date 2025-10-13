/*
 * ============================================================================
 * 채팅 입력창 자동 높이
 * 1) 대상  
 *    - #chat-input textarea  
 *    - (선택) .chat-m: 2줄 이상 시 .is-multi 토글
 * 2) 기능  
 *    - 입력 시 textarea 높이 자동 조절 (max-height까지 확장)  
 *    - 붙여넣기 / 잘라내기 / 리사이즈 / 로드시 자동 반영  
 *    - 줄 수 1줄 → 기본, 2줄 이상 → .is-multi 클래스 토글
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
