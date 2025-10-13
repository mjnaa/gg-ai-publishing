/*
 * ============================================================================
 * 툴팁
 * 1) 대상  
 *    - .tip-toggle
 * 2) 옵션  
 *    - data-tip-pos="bottom" → 위치 지정 (기본 right, bottom 지원)  
 *    - data-tip-offset-x="숫자" → X축 오프셋  
 *    - data-tip-offset-y="숫자" → Y축 오프셋  
 *    - data-tip-open="문구" → 열림 상태 문구  
 *    - data-tip-closed="문구" → 닫힘 상태 문구 (없을 시 open 문구 사용)  
 *    - data-tip-when="mini" → body.is-nav-mini 상태에서만 표시  
 *    - data-icon-open / data-icon-closed → 아이콘 교체 클래스
 * 3) 기능  
 *    - hover / focus 시 툴팁 표시  
 *    - click 시 상태 전환 및 aria-label 갱신  
 *    - 기본 title 속성 제거
 * ============================================================================
 */


(function () {
  'use strict';

  const GAP = 8;               // 버튼과 툴팁 간격 
  let clickBlock = false;      // 클릭 직후 hover 재실행 방지 플래그
  let TIP = null;              // 단일 툴팁 DOM (필요 시 생성)
  let TIP_TXT = null;
  let TIP_ARROW = null;
  let ACTIVE_EL = null;        // 현재 툴팁의 타깃 버튼 

  /* ===== 유틸 ===== */
  function $(sel, root){ return (root||document).querySelector(sel); }
  function labelOf(el){
    const expanded = el.getAttribute('aria-expanded');
    const isOpen = expanded === 'true';          // null이면 false
    const open   = el.getAttribute('data-tip-open')   || '';
    const closed = el.getAttribute('data-tip-closed') || '';
    // 닫힘 문구가 없으면 open 문구로 대체
    if (!isOpen && !closed) return open;
    return isOpen ? open : closed;
  }
  function stripNativeTitle(el){
    if (el.hasAttribute('title')) el.removeAttribute('title');
    el.querySelectorAll('svg title').forEach(function(t){ t.remove(); });
  }
  function swapIcon(el){
    const icon = el.querySelector('.icon20');
    if (!icon) return;
    const openCls = el.getAttribute('data-icon-open');
    const closedCls = el.getAttribute('data-icon-closed');
    if (!openCls || !closedCls) return;
    const isOpen = el.getAttribute('aria-expanded') === 'true';
    icon.classList.remove(openCls, closedCls);
    icon.classList.add(isOpen ? openCls : closedCls);
  }
  function ensureTip(){
    if (TIP) return;
    TIP = document.createElement('div');
    TIP.className = 'ui-tip';
    TIP_TXT = document.createTextNode('');
    TIP.appendChild(TIP_TXT);
    TIP_ARROW = document.createElement('div');
    TIP_ARROW.className = 'ui-tip-arrow';
    TIP.appendChild(TIP_ARROW);
    document.body.appendChild(TIP);
  }

  /* ===== 배치 ===== */
  function place(el){
    if (!TIP || !el) return;

    const pos = (el.getAttribute('data-tip-pos') || 'right').toLowerCase();
    const dx = parseFloat(el.getAttribute('data-tip-offset-x') || '0') || 0;
    const dy = parseFloat(el.getAttribute('data-tip-offset-y') || '0') || 0;

    const r = el.getBoundingClientRect();
    const t = TIP.getBoundingClientRect();
    let left, top;

    if (pos === 'bottom'){
      // 중앙 정렬 + 수평/수직 오프셋
      left = r.left + r.width/2 - t.width/2 + dx;
      top  = r.bottom + GAP + dy;

      TIP_ARROW.style.left = Math.round(t.width/2 - 4 - dx) + 'px';
      TIP_ARROW.style.top  = '-3px';
    } else { // right (기본)
      left = r.right + GAP + dx;
      top  = r.top + r.height/2 - t.height/2 + dy;

      TIP_ARROW.style.left = '-3px';
      TIP_ARROW.style.top  = Math.round(t.height/2 - 4 - dy) + 'px';
    }

    // 뷰포트 밖으로 나가지 않도록
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const pad = 4; // 여백
    left = Math.max(pad, Math.min(left, vw - t.width - pad));
    top  = Math.max(pad, Math.min(top,  vh - t.height - pad));

    TIP.style.left = Math.round(left) + 'px';
    TIP.style.top  = Math.round(top) + 'px';
  }

  /* ===== 열고/닫기 ===== */
  function openTip(el){
    ensureTip();
    ACTIVE_EL = el;
    TIP.style.left = '-9999px';
    TIP.style.top  = '-9999px';
    TIP_TXT.nodeValue = labelOf(el) || '';
    requestAnimationFrame(function(){ place(el); });
  }
  function closeTip(){
    ACTIVE_EL = null;
    if (!TIP) return;
    TIP.style.left = '-99999px';
    TIP.style.top  = '-99999px';
  }

  /* ===== 조건부 표시 ===== */
  function canShowTip(el){
    // mini 전용 설정이 있으면 body.is-nav-mini 상태에서만 허용
    const miniOnly = el.getAttribute('data-tip-when') === 'mini';
    if (miniOnly) return document.body.classList.contains('is-nav-mini');
    return true;
  }

  /* ===== 이벤트 바인딩 ===== */
  function onEnter(e){
    const el = e.currentTarget;
    if (clickBlock) return;
    if (!canShowTip(el)) return;
    openTip(el);
  }
  function onLeave(){ closeTip(); }
  function onFocus(e){
    const el = e.currentTarget;
    if (!canShowTip(el)) return;
    openTip(el);
  }
  function onBlur(){ closeTip(); }
  function onClick(e){
    const el = e.currentTarget;
    const isOpen = el.getAttribute('aria-expanded') === 'true';
    el.setAttribute('aria-expanded', String(!isOpen));

    const lbl = labelOf(el);
    if (lbl) el.setAttribute('aria-label', lbl);
    stripNativeTitle(el);
    swapIcon(el);

    if (ACTIVE_EL === el) {
      TIP_TXT.nodeValue = lbl || '';
      place(el);
    }

    closeTip();
    clickBlock = true;
    setTimeout(function(){ clickBlock = false; }, 250);
  }

  function initOne(el){
    stripNativeTitle(el);
    const lbl = labelOf(el);
    if (lbl) el.setAttribute('aria-label', lbl);
    swapIcon(el);

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);
    el.addEventListener('click', onClick);
  }

  function initAll(){
    document.querySelectorAll('.tip-toggle').forEach(initOne);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
