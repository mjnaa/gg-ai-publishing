/* 공통 레이아웃 */

(function () {
  'use strict';

  const $body = document.body;
  const $overlay = document.querySelector('.layout-overlay');

  // 브레이크포인트 (CSS와 일치해야 함)
  const BP = { MOBILE: 768, DESKTOP: 1120 };

  /* ===== 뷰포트 상태 ===== */
  const vw = () => window.innerWidth;
  const isMobile = () => vw() < BP.MOBILE;
  const isTablet = () => vw() >= BP.MOBILE && vw() < BP.DESKTOP;
  const isDesktop = () => vw() >= BP.DESKTOP;
  const getViewportKind = () => (isMobile() ? 'mobile' : (isTablet() ? 'tablet' : 'desktop'));
  let __prevViewport = null; 

  /* ===== 오버레이 제어 ===== */
  function syncOverlay() {
    const needOverlay =
      // 모바일 네비 슬라이드 열림
      $body.classList.contains('is-mobile-nav-open') ||
      // 보조패널이 열려있고 (모바일/태블릿 이거나 데스크탑 플로팅)
      ($body.classList.contains('is-aside-open') &&
        (isMobile() || isTablet() || $body.classList.contains('is-aside-floating')));

    if (needOverlay) $body.classList.add('is-overlay');
    else $body.classList.remove('is-overlay');
  }

  /* ===== 보조패널 제어 ===== */
  function openAsideDocked() {
    $body.classList.add('is-aside-open');
    $body.classList.remove('is-aside-floating');
    syncOverlay();
  }

  function toggleAsideDocked() {
    const willOpen = !$body.classList.contains('is-aside-open');
    if (willOpen) openAsideDocked();
    else closeAside();
  }

  function toggleAsideFloatingDesktop() {
    if (!$body.classList.contains('is-aside-open')) return;
    if (!isDesktop()) return; // 플로팅은 데스크탑 전용
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
  }

  function openMobileNav() {
    $body.classList.add('is-mobile-nav-open');
    syncOverlay();
  }

  function closeMobileNav() {
    $body.classList.remove('is-mobile-nav-open');
    syncOverlay();
  }

  /* ===== 반응형: 뷰포트 전환 시 기본 상태 적용 ===== */
  function applyDefaultsFor(view) {
    // PC 기본: 열림
    if (view === 'desktop') {
      $body.classList.remove('is-mobile-nav-open');
      $body.classList.remove('is-nav-mini');
      syncOverlay();
      return;
    }
    // Tablet 기본: 미니 
    if (view === 'tablet') {
      $body.classList.remove('is-mobile-nav-open');
      $body.classList.add('is-nav-mini');
      syncOverlay();
      return;
    }
    // Mobile 기본: 닫힘
    $body.classList.remove('is-aside-open', 'is-aside-floating');
    $body.classList.remove('is-nav-mini');
    $body.classList.remove('is-mobile-nav-open');
    syncOverlay();
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
    const t = e.target.closest('button, a');

    if (e.target.closest && e.target.closest('.layout-overlay')) {
      closeMobileNav();
      closeAside();
      return;
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

    // 보조패널 : 열기/닫기(도킹)
    if (t.matches('.btn-aside-toggle')) {
      e.preventDefault();
      toggleAsideDocked();
      return;
    }

    // 보조패널 : 플로팅 전환(열림 상태에서만 가능)
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
    if (!isNaN(saved)) { _origSetUiScale(saved); }

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
