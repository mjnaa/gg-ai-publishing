/*
 * ============================================================================
 * 공통 레이아웃
 * 1) 대상/목적  
 *    - 전역 레이아웃 상태 제어: 좌측 네비, 보조패널, 오버레이, 뷰포트 전환, UI 스케일
 * 2) 브레이크포인트  
 *    - MOBILE: 최대 767px  
 *    - TABLET: 768px ~ 1119px  
 *    - DESKTOP: 1120px 이상
 * 3) 필수 DOM 요소  
 *    - .layout-overlay, .btn-nav-toggle, .btn-hamburger, .btn-aside-toggle, .btn-aside-float, .btn-aside-close, .layout-nav .logo
 * 4) 상태 클래스  
 *    - is-mobile-nav-open, is-nav-mini, is-aside-open, is-aside-floating, is-overlay
 * 5) 반응형 기본값  
 *    - DESKTOP: 보조패널 열림 / 네비 확장  
 *    - TABLET: 보조패널 닫힘 / 네비 미니  
 *    - MOBILE: 네비·보조패널 모두 닫힘
 * 6) 주요 기능  
 *    - 오버레이 동기화: 열림 상태에 따른 is-overlay 토글  
 *    - 보조패널 제어: 데스크탑=도킹, 태블릿/모바일=플로팅 열림  
 *    - 좌측 네비 제어: 데스크탑/태블릿은 is-nav-mini 토글, 모바일은 드로어 열림/닫힘  
 *    - 반응형 기본값 적용: 화면 전환 시 상태 초기화 및 동기화  
 *    - UI 스케일 제어: setUiScale 적용, zoom 인라인 값 이관
 * 7) 이벤트  
 *    - document 클릭 위임:  
 *      · .layout-overlay 클릭 → 모바일 네비/보조패널 닫기  
 *      · .btn-folder → .folder-item is-open 토글 및 아이콘 교체  
 *      · .layout-nav .logo → 미니 상태에서 확장  
 *      · .btn-nav-toggle, .btn-hamburger, .btn-aside-toggle, .btn-aside-float, .btn-aside-close 처리  
 *    - DOMContentLoaded: ui-scale 복원, zoom 이관, 초기 뷰포트 기본 적용  
 *    - window resize: debounce 120ms로 뷰포트 전환 감지 및 동기화
 * 8) 외부 호출 함수 
 *    - setUiScale(scale) → UI 배율 변경 (예: setUiScale(1.1))
 * ============================================================================
 */


(function () {
  'use strict';

  const $body = document.body;

  // 브레이크포인트 (CSS와 일치해야 함)
  const BP = { MOBILE: 768, DESKTOP: 1120 };
  // 범위 매핑: MOBILE <768, TABLET 768~1119, DESKTOP ≥1120

  /* ===== 뷰포트 상태 ===== */
  const vw = () => window.innerWidth;
  const isMobile = () => vw() < BP.MOBILE;
  const isTablet = () => vw() >= BP.MOBILE && vw() < BP.DESKTOP;
  const isDesktop = () => vw() >= BP.DESKTOP;
  const getViewportKind = () => (isMobile() ? 'mobile' : (isTablet() ? 'tablet' : 'desktop'));
  let __prevViewport = null; 

  /* ===== (추가) 사이드바 토글 버튼 툴팁/라벨 동기화 ===== */
  function syncNavToggleTip() {
    const btn = document.querySelector('.btn-nav-toggle'); // HTML: .btn-nav-toggle.tip-toggle
    if (!btn) return;

    // 바디 클래스만 보고 열림 여부 판별
    // - 모바일: .is-mobile-nav-open 이 있으면 열림(true)
    // - 데/태: .is-nav-mini 가 있으면 닫힘(false), 없으면 열림(true)
    let expanded;
    if ($body.classList.contains('is-mobile-nav-open')) {
      expanded = true;
    } else if ($body.classList.contains('is-nav-mini')) {
      expanded = false;
    } else {
      expanded = true;
    }

    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    const openTxt   = btn.getAttribute('data-tip-open')   || '';
    const closedTxt = btn.getAttribute('data-tip-closed') || openTxt;
    btn.setAttribute('aria-label', expanded ? openTxt : closedTxt);
  }

  /* ===== 오버레이 제어 ===== */
  function syncOverlay() {
    // 요약: 모바일 네비 열림 OR (보조패널 열림 AND (모바일/태블릿 OR 데스크탑-플로팅)) → is-overlay 추가
    const needOverlay =
      $body.classList.contains('is-mobile-nav-open') ||
      ($body.classList.contains('is-aside-open') &&
        (isMobile() || isTablet() || $body.classList.contains('is-aside-floating')));

    if (needOverlay) $body.classList.add('is-overlay');
    else $body.classList.remove('is-overlay');
  }

  /* ===== 보조패널 제어 ===== */
  function openAsideDocked() {
    $body.classList.add('is-aside-open');

    if (isDesktop()) {
      // 데스크탑: 도킹
      $body.classList.remove('is-aside-floating');
    } else {
      // 태블릿/모바일: 플로팅으로 노출
      $body.classList.add('is-aside-floating');
    }

    syncOverlay();
  }

  function toggleAsideDocked() {
    const willOpen = !$body.classList.contains('is-aside-open');
    if (willOpen) openAsideDocked();
    else closeAside();
  }

  function toggleAsideFloatingDesktop() {
    if (!$body.classList.contains('is-aside-open')) return;
    if (!isDesktop()) return; // 플로팅 전환은 데스크탑 전용
    $body.classList.toggle('is-aside-floating');
    syncOverlay();
  }

  function closeAside() {
    $body.classList.remove('is-aside-open', 'is-aside-floating');
    syncOverlay();
  }

  /* ===== 좌측네비 제어 ===== */
  function toggleNav() {
    // PC/태블릿 : 토글 = is-nav-mini
    if (isDesktop() || isTablet()) {
      $body.classList.toggle('is-nav-mini');
    } else {
      // 모바일 : 드로어 열림/닫힘
      $body.classList.toggle('is-mobile-nav-open');
    }
    syncOverlay();
    syncNavToggleTip(); // 상태 변경 직후 툴팁/aria 동기화
  }

  function openMobileNav() {
    $body.classList.add('is-mobile-nav-open');
    syncOverlay();
    syncNavToggleTip(); 
  }

  function closeMobileNav() {
    $body.classList.remove('is-mobile-nav-open');
    syncOverlay();
    syncNavToggleTip();
  }

  /* ===== 반응형: 뷰포트 전환 시 기본 상태 적용 ===== */
  function applyDefaultsFor(view) {
    // PC 기본: 열림
    if (view === 'desktop') {
      $body.classList.remove('is-mobile-nav-open');
      $body.classList.remove('is-nav-mini');
      syncOverlay();
      syncNavToggleTip(); // 리사이즈로 기본 상태 바뀔 때도 동기화
      return;
    }
    // Tablet 기본: 미니 
    if (view === 'tablet') {
      $body.classList.remove('is-mobile-nav-open');
      $body.classList.add('is-nav-mini');
      syncOverlay();
      syncNavToggleTip(); 
      return;
    }
    // Mobile 기본: 닫힘
    $body.classList.remove('is-aside-open', 'is-aside-floating');
    $body.classList.remove('is-nav-mini');
    $body.classList.remove('is-mobile-nav-open');
    syncOverlay();
    syncNavToggleTip(); 
  }

  function syncOnResize() {
    const now = getViewportKind();
    if (__prevViewport === null || __prevViewport !== now) {
      applyDefaultsFor(now);    // 전환 시에만 기본값 강제 
    } else {
      syncOverlay();            // 동일 뷰포트 내에선 오버레이만 동기화
    }
    __prevViewport = now;
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  /* ===== 이벤트 위임 ===== */
  document.addEventListener('click', (e) => {
    // 처리: 오버레이 닫기 / 폴더 토글 / 로고 확장 / 네비 토글 / 햄버거 / 보조패널(도킹/플로팅/닫기)
    const t = e.target.closest('button, a');

    // 오버레이 클릭 → 닫기
    if (e.target.closest && e.target.closest('.layout-overlay')) {
      closeMobileNav(); 
      closeAside();
      return;
    }

    // 미니 네비에서 빈 공간 클릭하면 확장
    // 인터랙티브 요소(button, a, form 요소, [role], [data-dd], [data-choice])는 제외
    if (($body.classList.contains('is-nav-mini')) && (isDesktop() || isTablet())) {
      const inNav = e.target.closest('.layout-nav'); 
      const onInteractive = e.target.closest('button, a, input, select, textarea, [role], [data-dd], [data-choice]');
      if (inNav && !onInteractive) {
        $body.classList.remove('is-nav-mini');
        syncNavToggleTip(); // 버튼 없이 확장된 경우 동기화
        return;
      }
    }

    if (!t) return;

    // 폴더 토글 버튼 (왼쪽 버튼)
    if (t.matches('.btn-folder')) {
      e.preventDefault();
      const fi = t.closest('.folder-item');
      if (fi) {
        const open = fi.classList.toggle('is-open');
        const icon = t.querySelector('[class*="icon--folder"]');
        if (icon) {
          // 접힘/펼침 상태에 따라 폴더 아이콘 동기화
          icon.classList.remove('icon--folder', 'icon--folder-open');
          icon.classList.add(open ? 'icon--folder-open' : 'icon--folder');
        }
      }
      return;
    }

    // 미니 네비 상태에서 : 로고 클릭으로 다시 펼침 (PC/태블릿 공통)
    const logo = t.closest('.layout-nav .logo');
    if (logo) {
      if ((isDesktop() || isTablet()) && $body.classList.contains('is-nav-mini')) {
        e.preventDefault();
        $body.classList.remove('is-nav-mini'); // 미니 → 풀
        syncNavToggleTip(); // 버튼 없이 확장된 경우 동기화
        return;
      }
    }

    // 좌측 네비 토글
    if (t.matches('.btn-nav-toggle')) {
      e.preventDefault();
      toggleNav();
      return;
    }

    // 모바일 햄버거
    if (t.matches('.btn-hamburger')) {
      e.preventDefault();
      openMobileNav(); 
      return;
    }

    // 보조패널 : 열기/닫기(도킹/플로팅 분기)
    if (t.matches('.btn-aside-toggle')) {
      e.preventDefault();
      toggleAsideDocked();
      return;
    }

    // 보조패널 : 플로팅 전환(열림 상태에서만 가능, 데스크탑 전용)
    if (t.matches('.btn-aside-float')) {
      e.preventDefault();
      toggleAsideFloatingDesktop();
      return;
    }

    // 보조패널 : 닫기
    if (t.matches('.btn-aside-close')) {
      e.preventDefault();
      closeAside();
      return;
    }
  });


  /* ===== UI 스케일 제어 (zoom 대체) ===== */
  function setUiScale(scale) {
    // 허용 범위: 0.5 ~ 2.0 
    const s = Math.max(0.5, Math.min(2, Number(scale) || 1));
    document.documentElement.style.setProperty('--ui-scale', String(s));
    syncOverlay();
  }
  window.setUiScale = setUiScale;
  // ---- UI 스케일 영구 저장(새로고침 유지) ----
  /* const _origSetUiScale = window.setUiScale;
  window.setUiScale = function(scale){
    _origSetUiScale(scale);
    try { localStorage.setItem('ui-scale', String(scale)); } catch(e) {}
  };*/

  /* ===== 초기화 ===== */
  document.addEventListener('DOMContentLoaded', () => {
    // UI 스케일 복원
    const saved = parseFloat(localStorage.getItem('ui-scale'));
    if (!isNaN(saved)) { setUiScale(saved); }

    // 인라인 zoom → ui-scale로 이관
    const inline = document.body.style.zoom;
    if (inline) {
      const s = parseFloat(inline) || 1;
      document.body.style.zoom = '';
      setUiScale(s);
    }

    // 초기 뷰포트 기본 적용
    __prevViewport = getViewportKind();
    applyDefaultsFor(__prevViewport); 
  });

  // 리사이즈
  window.addEventListener('resize', debounce(syncOnResize, 120));
})();
