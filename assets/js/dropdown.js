/*
 * ============================================================================
 * 드롭다운메뉴 / 다중옵션목록
 * 1) 트리거  
 *    - data-dd="template-id" (템플릿 id 기준으로 메뉴 로드)  
 *    - data-dd-pos="bottom-start|bottom-end|right-start|..." → 위치 지정
 * 2) 구성  
 *    - 템플릿: template#id 내부 .dd 구조 포함  
 *    - 서브메뉴: li.has-submenu[data-submenu="template-id"]
 * 3) 이벤트  
 *    - 클릭: 열기/닫기, 항목 선택 시 dd:select 이벤트 발생  
 *    - 키보드: ESC, 방향키(↑↓←→) 입력 지원
 * 4) 기능  
 *    - 메뉴/서브메뉴 뷰포트 보정 처리  
 *    - 서브메뉴 hover 시 열림, 마우스 아웃 시 지연 닫힘  
 *    - 스크롤/리사이즈 발생 시 위치 자동 재계산
 * ============================================================================
 */


(function () {
  'use strict';

  const LAYER_CLASS = 'dd-layer';
  const GAP = 8;
  const CONTAINER_SEL = '.viewport-scale';

  const container = document.querySelector(CONTAINER_SEL) || document.body;

  /* ===== 레이어(부모) 구성 ===== */
  let layer = container.querySelector(`.${LAYER_CLASS}`);
  if (!layer) {
    layer = document.createElement('div');
    layer.className = LAYER_CLASS;
    Object.assign(layer.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '0',
      height: '0',
      zIndex: '2147483000',
      pointerEvents: 'none'
    });
    container.appendChild(layer);
  }

  /* ===== 유틸 ===== */
  const qs  = (s, el=document)=>el.querySelector(s);
  const qsa = (s, el=document)=>Array.from(el.querySelectorAll(s));

  function fromTemplate(id){
    const t = document.getElementById(id);
    if (!t) {
      console.warn('[dropdown] <template id="%s"> not found.', id);
      return null;
    }
    const node = t.content?.firstElementChild?.cloneNode(true);
    if (!node) {
      console.warn('[dropdown] Template "%s" is empty.', id);
      return null;
    }
    return node;
  }

  function getScaleXY(el){
    const tr = getComputedStyle(el).transform;
    if (!tr || tr === 'none') return {sx:1, sy:1};
    const m = tr.startsWith('matrix3d')
      ? tr.slice(9,-1).split(',').map(parseFloat)
      : tr.slice(7,-1).split(',').map(parseFloat);

    if (m.length === 6) {
      return { sx: Math.hypot(m[0], m[1]) || 1, sy: Math.hypot(m[2], m[3]) || 1 };
    }
    if (m.length === 16) {
      return { sx: Math.hypot(m[0], m[1]) || 1, sy: Math.hypot(m[4], m[5]) || 1 };
    }
    return {sx:1, sy:1};
  }

  function containerRect(){
    const r = container.getBoundingClientRect();
    const {sx, sy} = getScaleXY(container);
    return {
      x: r.left,
      y: r.top,
      w: container.clientWidth,
      h: container.clientHeight,
      sx, sy
    };
  }

  function ensureMenuBasics(menu){
    menu.style.position = 'absolute';
    menu.style.pointerEvents = 'auto';
    menu.style.zIndex = '2147483600';
    menu.style.visibility = 'hidden';
    menu.style.left = '-10000px';
    menu.style.top  = '-10000px';
    layer.appendChild(menu);
  }

  function toLocal(dx, dy, rectInfo){
    return { x: dx / rectInfo.sx, y: dy / rectInfo.sy };
  }

  /* ===== 루트 메뉴 배치 ===== */
  function placeRoot(trigger, menu){
    ensureMenuBasics(menu);

    const t = trigger.getBoundingClientRect();
    const c = containerRect();

    const mW = menu.offsetWidth;
    const mH = menu.offsetHeight;

    const pos = trigger.dataset.ddPos || 'bottom-start';

    let dx, dy;
    if (pos === 'bottom-end') {
      dx = (t.right - c.x) - mW;
      dy = (t.bottom - c.y) + GAP;
    } else if (pos === 'right-start') {
      dx = (t.right - c.x) + GAP;
      dy = (t.top   - c.y);
    } else if (pos === 'right-end') {
      dx = (t.right - c.x) + GAP;
      dy = (t.bottom - c.y) - mH;
    } else if (pos === 'left-start') {
      dx = (t.left - c.x) - GAP - mW;
      dy = (t.top  - c.y);
    } else if (pos === 'left-end') {
      dx = (t.left - c.x) - GAP - mW;
      dy = (t.bottom - c.y) - mH;
    } else {
      dx = (t.left - c.x);
      dy = (t.bottom - c.y) + GAP;
    }

    const local = toLocal(dx, dy, c);
    let x = local.x;
    let y = local.y;

    if (x + mW > c.w - 8) x = c.w - mW - 8;
    if (x < 8) x = 8;
    if (y + mH > c.h - 8) y = Math.max(8, c.h - mH - 8);

    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    menu.style.visibility = 'visible';
  }

  /* ===== 서브메뉴 배치 ===== */
  function placeSub(parentLi, subMenu){
    subMenu.style.position = 'absolute';
    subMenu.style.pointerEvents = 'auto';
    subMenu.style.zIndex = '2147483601';
    subMenu.style.visibility = 'hidden';
    subMenu.style.left = '-10000px';
    subMenu.style.top  = '-10000px';
    layer.appendChild(subMenu);

    const liR = parentLi.getBoundingClientRect();
    const c = containerRect();
    const mW = subMenu.offsetWidth;
    const mH = subMenu.offsetHeight;

    let dx = (liR.right - c.x) + GAP;
    let dy = (liR.top   - c.y);

    const localDefault = toLocal(dx, dy, c);
    let x = localDefault.x;
    let y = localDefault.y;

    // 오른쪽 공간 부족 시 왼쪽으로 플립
    if (x + mW > c.w - 8) {
      dx = (liR.left - c.x) - GAP - mW;
      const localFlip = toLocal(dx, dy, c);
      x = localFlip.x;
      y = localFlip.y;
    }
    if (y + mH > c.h - 8) y = Math.max(8, c.h - mH - 8);

    /* 상단바에서 연 서브메뉴는 X축(오른쪽)으로 보정 */
    if (subMenu.dataset.origin === 'header') {
      x += 3; 
    }

    subMenu.style.left = x + 'px';
    subMenu.style.top  = y + 'px';
    subMenu.style.visibility = 'visible';
  }

  /* ===== 상태 ===== */
  let openMenu = null, openTrigger = null;
  let openSub = null, openSubParent = null;
  const hoverTimers = new Map();
  let subOpenLock = false;

  /* ===== 열기/닫기 ===== */
  function close(){
    if (!openMenu) return;
    layer.innerHTML = '';
    if (openTrigger){
      openTrigger.setAttribute('aria-expanded','false');
      openTrigger.classList.remove('dd-trigger-open');
    }
    openMenu = null; openTrigger = null;
    openSub = null; openSubParent = null;
    hoverTimers.forEach(t=>clearTimeout(t));
    hoverTimers.clear();
  }

  function open(trigger){
    const id = trigger.dataset.dd;
    const menu = fromTemplate(id);
    if (!menu) return;

    close();
    openTrigger = trigger; openMenu = menu;

    trigger.setAttribute('aria-expanded','true');
    trigger.classList.add('dd-trigger-open');

    qsa('.has-submenu', menu).forEach(li=>{
      const btn = li.querySelector('[role="menuitem"]');
      if (btn){ btn.setAttribute('aria-haspopup','menu'); btn.setAttribute('aria-expanded','false'); }
      li.addEventListener('mouseenter', ()=>openSubmenu(li));
      li.addEventListener('mouseleave', ()=>scheduleCloseSub(li));
    });

    placeRoot(trigger, menu);
    setTimeout(()=>{ qs('[role="menuitem"]', menu)?.focus(); }, 0);
  }

  function openSubmenu(li){
    if (subOpenLock) return;
    subOpenLock = true;
    requestAnimationFrame(()=>{ subOpenLock = false; });

    const id = li.dataset.submenu;
    if (!id) return;

    const btn = li.querySelector('[role="menuitem"]');

    if (openSub && openSubParent === li) {
      placeSub(li, openSub);
      btn && btn.setAttribute('aria-expanded','true');
      clearCloseTimer(li);
      return;
    }

    closeSubmenu();

    const subMenu = fromTemplate(id);
    if (!subMenu) return;

    openSub = subMenu;
    openSubParent = li;
    btn && btn.setAttribute('aria-expanded','true');

    
    /* 상단바에서 연 서브메뉴 식별 플래그 */
    if (openTrigger && openTrigger.dataset.dd === 'header-menu-chat') {
      subMenu.dataset.origin = 'header';
    }
subMenu.addEventListener('mouseenter', ()=>clearCloseTimer(li));
    subMenu.addEventListener('mouseleave', ()=>scheduleCloseSub(li));

    placeSub(li, subMenu);
    clearCloseTimer(li);
  }

  function closeSubmenu(){
    if (!openSub) return;
    const btn = openSubParent?.querySelector('[role="menuitem"]');
    btn && btn.setAttribute('aria-expanded','false');
    openSub.remove();
    openSub = null; openSubParent = null;
  }

  function scheduleCloseSub(li){
    clearCloseTimer(li);
    const t = setTimeout(()=>{ if (openSubParent === li) closeSubmenu(); }, 220);
    hoverTimers.set(li, t);
  }
  function clearCloseTimer(li){
    const t = hoverTimers.get(li);
    if (t) clearTimeout(t);
    hoverTimers.delete(li);
  }

  /* ===== 이벤트 위임 ===== */
  document.addEventListener('click', function(e){
    const trg = e.target.closest?.('[data-dd]');
    const isMenu = e.target.closest?.('.dd');

    if (trg){
      e.preventDefault();
      (openTrigger === trg) ? close() : open(trg);
      return;
    }

    if (isMenu){
      const itemBtn = e.target.closest?.('[role="menuitem"]');
      if (itemBtn && !itemBtn.closest('.has-submenu')){
        document.dispatchEvent(new CustomEvent('dd:select', {
          detail: {
            action: itemBtn.dataset.action || itemBtn.textContent.trim(),
            trigger: openTrigger,
            item: itemBtn
          }
        }));
        close();
      }
      return;
    }

    close();
  });

  document.addEventListener('keydown', function(e){
    if (!openMenu) return;

    const activeMenu = (openSub && document.activeElement && openSub.contains(document.activeElement))
      ? openSub : openMenu;

    const items = qsa('[role="menuitem"]:not([disabled])', activeMenu);
    const idx = items.indexOf(document.activeElement);

    if (e.key === 'Escape'){
      if (openSub){
        const parentBtn = openSubParent?.querySelector('[role="menuitem"]');
        closeSubmenu();
        parentBtn?.focus();
        e.preventDefault();
        return;
      }
      close(); openTrigger?.focus(); return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      if (!items.length) return;
      const next = e.key==='ArrowDown' ? (idx+1)%items.length : (idx-1+items.length)%items.length;
      items[next]?.focus();
    }

    if (e.key === 'ArrowRight'){
      const li = document.activeElement?.closest('.has-submenu');
      if (li){ e.preventDefault(); openSubmenu(li); qs('[role="menuitem"]', openSub)?.focus(); }
    }
    if (e.key === 'ArrowLeft'){
      if (openSub){
        e.preventDefault();
        const parentBtn = openSubParent?.querySelector('[role="menuitem"]');
        closeSubmenu();
        parentBtn?.focus();
      }
    }
  });

  /* ===== 리플로우(스크롤/리사이즈) ===== */
  function reflow(){
    if (openMenu && openTrigger) placeRoot(openTrigger, openMenu);
    if (openSub && openSubParent) placeSub(openSubParent, openSub);
  }
  addEventListener('scroll', reflow, true);
  addEventListener('resize', reflow);
})();