/* * ============================================================================
 * 탭바
 * 1) 트리거
 * - .tab-filter .tab-btn[data-target]
 * 2) 기능
 * - 탭 버튼 클릭 시 해당 패널만 표시
 * - .tab-filter 및 .tab-panels 그룹 단위 스코프 격리 (멀티 인스턴스 지원)
 * - 선택된 탭 버튼 상태 (.is-active) 동기화
 * - 비활성 패널 숨김 (hidden) 처리
 * ============================================================================
 */


(function () {
  'use strict';

  /* ===== 탭 활성화 동작 ===== */
  const activateTab = (btn) => {
    const targetId = btn.getAttribute('data-target');
    const targetPanel = document.getElementById(targetId);

    if (!targetPanel) return;

    // 1. 버튼 상태 동기화 (현재 그룹 내)
    const filterGroup = btn.closest('.tab-filter');
    if (filterGroup) {
      const btns = filterGroup.querySelectorAll('.tab-btn');
      btns.forEach(b => {
        const isActive = (b === btn);
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive);
      });
    }

    // 2. 패널 표시 제어 (현재 그룹 내)
    const panelGroup = targetPanel.closest('.tab-panels');
    if (panelGroup) {
      const panels = panelGroup.querySelectorAll('.tab-panel');
      panels.forEach(p => {
        p.hidden = true;
      });
    }
    
    // 타겟 패널 활성화
    targetPanel.hidden = false;
  };

  /* ===== 초기화 ===== */
  const initTabBar = () => {
    const filterGroups = document.querySelectorAll('.tab-filter');

    filterGroups.forEach(group => {
      const btns = group.querySelectorAll('.tab-btn');
      
      if (!btns.length) return;

      btns.forEach(btn => {
        // 접근성 속성 주입
        btn.setAttribute('role', 'tab');
        
        // 이벤트 바인딩
        btn.addEventListener('click', (e) => {
          if (btn.tagName === 'A') e.preventDefault();
          activateTab(btn);
        });
      });

      // 초기 상태 설정
      const initialActive = group.querySelector('.tab-btn.is-active') || btns[0];
      if (initialActive) {
        activateTab(initialActive);
      }
    });
  };

  /* ===== 실행 ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabBar);
  } else {
    initTabBar();
  }

})();