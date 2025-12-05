/*
 * ============================================================================
 * 뉴스 검색 필터
 * 1) 기능
 *    - 날짜 제어: 라디오 버튼 선택 시 start/end date 자동 계산 및 칩 생성
 *    - 체크박스 로직: 상향(Child->Parent)/하향(Parent->Child) 전파
 *    - 스마트 카운트: 하위 기준으로 상위 카테고리 카운트 집계
 *    - UI 인터랙션: 아코디언 토글, 형제 패널 닫기, '더보기' 버튼 제어
 *    - 필터 칩: 선택된 항목에 대한 칩(Tag) 자동 생성/삭제 및 동기화
 *    - 초기화: data-reset-type 속성을 통한 영역별/전체 초기화 분기 처리
 * ============================================================================
 */


(function () {
  'use strict';

  /* ===== 1. 상수 및 선택자 ===== */
  const SEL = {
    DATE: {
      RADIO: 'input[name="period-type"]',
      START: '#date-start',
      END: '#date-end',
      CHIP_ID: 'date-range-chip'
    },
    CHIP: {
      GROUP: '.filter-chip-group',
      ITEM: '.filter-chip',
      LABEL: '.filter-chip-label',
      REMOVE: '.filter-chip-remove'
    },
    // 필터 영역 및 카운트
    FILTER: {
      TAB_BTN: '.tab-btn',
      TAB_COUNT: '.tab-count',
      PRESS_BODY: '.filter-body-press',
      INTEGRATED_BODY: '.filter-body-integrated',
      INCIDENT_BODY: '.filter-body-incident',
      MAIN_COUNT: 'span[class$="-main-count"]'
    },
    // UI 컴포넌트
    UI: {
      TOGGLE_BTN: '.integrated-toggle-btn, .integrated-middle-toggle-btn, .incident-toggle-btn, .incident-middle-toggle-btn',
      BTN_GROUP: '.integrated-main-group, .incident-main-group, .integrated-middle-list, .incident-middle-list',
      CHECKBOX: 'input[type="checkbox"]',
      CHECKBOX_CHECKED_LEAF: 'input[type="checkbox"]:checked:not([data-target])' 
    }
  };


  /* ===== 2. 날짜 처리 로직 ===== */
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function setDateRange(rangeValue) {
    const startInput = document.querySelector(SEL.DATE.START);
    const endInput = document.querySelector(SEL.DATE.END);
    if (!startInput || !endInput) return;

    const today = new Date();
    const start = new Date(today);
    endInput.value = formatDate(today);

    switch (rangeValue) {
      case '1d': start.setDate(today.getDate()); break;
      case '1w': start.setDate(today.getDate() - 7); break;
      case '1m': start.setMonth(today.getMonth() - 1); break;
      case '3m': start.setMonth(today.getMonth() - 3); break;
      case '6m': start.setMonth(today.getMonth() - 6); break;
      case '1y': start.setFullYear(today.getFullYear() - 1); break;
      default: break;
    }
    
    startInput.value = formatDate(start);
    // 값 변경 후 input 이벤트 트리거 (칩 갱신용)
    startInput.dispatchEvent(new Event('input', { bubbles: true })); 
  }


  /* ===== 3. UI 제어 (아코디언 & 아이콘) ===== */
  // 버튼 아이콘(+, -) 및 활성 클래스 토글
  function updateToggleIcon(btn, isOpen) {
    const addIcon = btn.querySelector('.icon--add');
    const minusIcon = btn.querySelector('.icon--minus');
    
    if (addIcon && minusIcon) {
      addIcon.style.display = isOpen ? 'none' : 'inline-block';
      minusIcon.style.display = isOpen ? 'inline-block' : 'none';
    }
    
    btn.classList.toggle('is-open', isOpen);
    const parentItem = btn.parentElement;
    if (parentItem) {
      parentItem.classList.toggle('is-open', isOpen);
    }
  }

  // 패널 표시 및 형제/하위 패널 초기화
  function showColumnPanel(targetId, activeBtn) {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    // 1) 형제 패널 닫기
    const wrapper = targetEl.parentElement; 
    if (wrapper) {
      const listClass = Array.from(targetEl.classList).find(c => c.endsWith('-list'));
      if (listClass) {
        wrapper.querySelectorAll('.' + listClass).forEach(el => {
          if (el !== targetEl) el.style.display = 'none';
        });
      }
    }

    // 2) 하위 뎁스 초기화 (상위 뎁스 변경 시 하위 패널 닫기)
    if (targetEl.classList.contains('integrated-middle-list')) {
      closeAllPanels('.integrated-detail-list');
      resetAllToggleIcons('.integrated-middle-toggle-btn');
    }
    if (targetEl.classList.contains('incident-middle-list')) {
      closeAllPanels('.incident-detail-list');
      resetAllToggleIcons('.incident-middle-toggle-btn');
    }

    // 3) 타겟 패널 활성화
    targetEl.style.display = 'block';
  }

  // 토글 버튼 핸들러
  function handleToggleBtn(btn) {
    // 그룹 내 형제 버튼 초기화
    const group = btn.closest(SEL.UI.BTN_GROUP);
    if (group) {
      group.querySelectorAll('button[class*="-toggle-btn"]').forEach(sibling => {
        if (sibling !== btn) updateToggleIcon(sibling, false);
      });
    }

    // 현재 버튼 상태 토글
    const willOpen = !btn.classList.contains('is-open');
    updateToggleIcon(btn, willOpen);

    // 연동된 패널 제어
    const wrapper = btn.closest('div') || btn.closest('li');
    const input = wrapper.querySelector(SEL.UI.CHECKBOX);
    
    if (input && input.dataset.target) {
      const targetEl = document.getElementById(input.dataset.target);
      if (targetEl) {
        if (willOpen) showColumnPanel(input.dataset.target, btn);
        else targetEl.style.display = 'none';
      }
    }
  }


  /* ===== 4. 체크박스 & 카운트 로직 ===== */
  // 전체 카운트 갱신 (탭 및 메인 카테고리)
  function updateAllCounts() {
    updateTabCount('news-filter-press', `${SEL.FILTER.PRESS_BODY} input[name="press"]`);
    updateTabCount('news-filter-integrated', `${SEL.FILTER.INTEGRATED_BODY} input[name="integrated-topic"]:not([data-target])`);
    updateTabCount('news-filter-incident', `${SEL.FILTER.INCIDENT_BODY} input[name="incident-topic"]:not([data-target])`);

    updateMainCount('.integrated-main-item', SEL.FILTER.INTEGRATED_BODY);
    updateMainCount('.incident-main-item', SEL.FILTER.INCIDENT_BODY);
  }

  function updateTabCount(tabId, selector) {
    const tabBtn = document.querySelector(`${SEL.FILTER.TAB_BTN}[data-target="${tabId}"]`);
    if (!tabBtn) return;

    const count = document.querySelectorAll(`${selector}:checked`).length;
    const countSpan = tabBtn.querySelector(SEL.FILTER.TAB_COUNT);
    if (countSpan) countSpan.textContent = count > 0 ? `(${count})` : '';
  }

  // 메인 카테고리 카운트
  function updateMainCount(itemSelector, bodySelector) {
    document.querySelectorAll(itemSelector).forEach(item => {
      const input = item.querySelector('input[name$="-category"]');
      if (!input) return;
      
      const rootVal = input.value;
      const body = document.querySelector(bodySelector);
      let total = 0;
      
      const checkedLeafs = body.querySelectorAll(SEL.UI.CHECKBOX_CHECKED_LEAF);
      
      checkedLeafs.forEach(leaf => {
        let parentVal = leaf.dataset.parent;
        let isChild = false;
        while(parentVal) {
          if (parentVal === rootVal) {
            isChild = true;
            break;
          }
          const parentInput = body.querySelector(`input[value="${parentVal}"]`);
          if (!parentInput) break;
          parentVal = parentInput.dataset.parent;
        }
        if (isChild) total++;
      });

      const countSpan = item.querySelector(SEL.FILTER.MAIN_COUNT);
      if (countSpan) countSpan.textContent = total > 0 ? `(${total})` : '';
    });
  }

  // 체크박스 변경 핸들러
  function handleCheckboxChange(target) {
    updateChipFromInput(target);
    
    // 1. 하향 전파 (Parent -> Children)
    propagateDown(target);

    // 2. 상향 전파 (Child -> Parent)
    if (target.dataset.parent) {
      propagateUp(target);
    }

    // 3. 카운트 갱신
    updateAllCounts();
  }

  function propagateDown(parent) {
    const isChecked = parent.checked;
    const myVal = parent.value;
    const container = parent.closest('.tab-panel');
    if (!container) return;

    const children = container.querySelectorAll(`input[data-parent="${myVal}"]`);
    children.forEach(child => {
      if (child.checked !== isChecked) {
        child.checked = isChecked;
        updateChipFromInput(child);
        propagateDown(child);
      }
    });
  }

  function propagateUp(child) {
    const container = child.closest('.tab-panel');
    if (!container) return;

    const parentVal = child.dataset.parent;
    const parent = container.querySelector(`input[value="${parentVal}"]`);
    if (!parent) return;

    const siblings = container.querySelectorAll(`input[data-parent="${parentVal}"]`);
    const someChecked = Array.from(siblings).some(c => c.checked);
    
    if (parent.checked !== someChecked) {
      parent.checked = someChecked;
      updateChipFromInput(parent);
      
      if (parent.dataset.parent) {
        propagateUp(parent); 
      }
    }
  }


  /* ===== 5. 칩(Chip) 제어 ===== */
  function createChipElement(id, label) {
    const div = document.createElement('div');
    div.className = 'filter-chip';
    div.dataset.relatedId = id; 
    div.innerHTML = `
      <span class="filter-chip-label">${label}</span>
      <button type="button" class="filter-chip-remove" aria-label="삭제">
        <span class="icon16 icon--close icon--basic"></span>
      </button>
    `;
    return div;
  }

  function updateChipFromInput(input) {
    const container = document.querySelector(SEL.CHIP.GROUP);
    if (!container) return;

    if (input.checked) {
      if (!input.id) input.id = 'chk-' + Math.random().toString(36).substr(2, 9);
      if (container.querySelector(`.filter-chip[data-related-id="${input.id}"]`)) return;

      const labelText = input.dataset.label || input.value;
      const chip = createChipElement(input.id, labelText);
      container.appendChild(chip);
    } else {
      if (input.id) {
        const chip = container.querySelector(`.filter-chip[data-related-id="${input.id}"]`);
        if (chip) chip.remove();
      }
    }
  }

  function updateDateChip() {
    const container = document.querySelector(SEL.CHIP.GROUP);
    if (!container) return;
    const start = document.querySelector(SEL.DATE.START);
    const end = document.querySelector(SEL.DATE.END);
    if (!start || !end) return;

    const dateStr = `${start.value}~${end.value}`;
    const dateChipId = SEL.DATE.CHIP_ID;
    let chip = container.querySelector(`.filter-chip[data-related-id="${dateChipId}"]`);

    if (start.value && end.value) {
      if (!chip) {
        chip = createChipElement(dateChipId, dateStr);
        container.appendChild(chip);  
      } else {
        chip.querySelector('.filter-chip-label').textContent = dateStr;
      }
    }
  }

  function handleChipRemove(btn) {
    const chip = btn.closest(SEL.CHIP.ITEM);
    const relatedId = chip.dataset.relatedId;
    if (!relatedId) return;

    // 날짜 칩 삭제 시
    if (relatedId === SEL.DATE.CHIP_ID) {
      const r3m = document.querySelector(`${SEL.DATE.RADIO}[value="3m"]`);
      chip.remove(); 
      if (r3m) { r3m.checked = true; setDateRange('3m'); }
      return; 
    }

    // 일반 칩 삭제 시
    const input = document.getElementById(relatedId);
    if (input) {
      input.checked = false;
      chip.remove();
      handleCheckboxChange(input); 
    }
  }


  /* ===== 6. 이벤트 핸들러 및 초기화 ===== */
  // 이벤트 위임 처리
  document.addEventListener('click', (e) => {
    const t = e.target;

    // 1. 날짜 라디오
    if (t.matches(SEL.DATE.RADIO)) {
      setDateRange(t.value);
      return;
    }

    // 2. 체크박스
    if (t.matches(SEL.UI.CHECKBOX)) {
      if (t.dataset.target) {
        // 체크박스 클릭 시 패널 열기 지원
        const btn = t.closest('label')?.previousElementSibling || t.parentElement.querySelector('button');
        if (btn && btn.tagName === 'BUTTON' && !btn.classList.contains('is-open')) {
           handleToggleBtn(btn);
        }
      }
      handleCheckboxChange(t);
      return;
    }

    // 3. 토글 버튼 (아코디언)
    const toggleBtn = t.closest(SEL.UI.TOGGLE_BTN);
    if (toggleBtn) {
      e.preventDefault();
      handleToggleBtn(toggleBtn);
      return;
    }

    // 4. 상세검색 펼쳐보기/접기 (뉴스 검색 후 우측패널)
    const moreBtn = t.closest('button');
    if (moreBtn && moreBtn.closest('.form-field')) {
       const hiddenArea = moreBtn.closest('.form-field').querySelector('.check-list-more');
       if (hiddenArea) {
          e.preventDefault();
          const wasHidden = hiddenArea.hidden; 
          hiddenArea.hidden = !wasHidden;
          moreBtn.innerHTML = wasHidden 
            ? '<span class="icon16 icon--minus icon--basic"></span>접기' 
            : '<span class="icon16 icon--add icon--basic"></span>펼쳐보기';
          moreBtn.classList.toggle('is-open', wasHidden);
          return;
       }
    }

    // 5. 칩 삭제
    if (t.closest(SEL.CHIP.REMOVE)) {
      handleChipRemove(t.closest(SEL.CHIP.REMOVE));
      return;
    }

    // 6. 초기화 버튼 (data-reset-type)
    const resetBtn = t.closest('[data-reset-type]');
    if (resetBtn) {
      handleResetButtons(resetBtn);
    }
  });

  // 초기화 버튼 로직
  function handleResetButtons(btn) {
    const type = btn.dataset.resetType; 
    
    switch (type) {
      case 'period':
        const r3m = document.querySelector(`${SEL.DATE.RADIO}[value="3m"]`);
        if (r3m) { r3m.checked = true; setDateRange('3m'); }
        break;

      case 'press':
        resetCheckboxes(`${SEL.FILTER.PRESS_BODY} input[type="checkbox"]`);
        break;

      case 'integrated':
        resetCheckboxes(`${SEL.FILTER.INTEGRATED_BODY} input[type="checkbox"]`);
        closeAllPanels('.integrated-middle-list, .integrated-detail-list');
        resetAllToggleIcons('.integrated-toggle-btn, .integrated-middle-toggle-btn');
        break;

      case 'incident':
        resetCheckboxes(`${SEL.FILTER.INCIDENT_BODY} input[type="checkbox"]`);
        closeAllPanels('.incident-middle-list, .incident-detail-list');
        resetAllToggleIcons('.incident-toggle-btn, .incident-middle-toggle-btn');
        break;

      case 'advanced':
        const container = document.querySelector('.filter-body-advanced');
        if (container) {
          container.querySelectorAll('input').forEach(i => i.value = '');
          container.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
        }
        break;

      case 'all':
        resetCheckboxes('input[type="checkbox"]');
        const r3mAll = document.querySelector(`${SEL.DATE.RADIO}[value="3m"]`);
        if (r3mAll) { r3mAll.checked = true; setDateRange('3m'); }
        break;
        
      default:
        console.warn('Undefined reset type:', type);
        break;
    }
  }

  function resetCheckboxes(selector) {
    document.querySelectorAll(selector).forEach(c => {
      c.checked = false;
      updateChipFromInput(c);
    });
    updateAllCounts();
  }
  
  function closeAllPanels(selector) {
    document.querySelectorAll(selector).forEach(el => el.style.display = 'none');
  }
  
  function resetAllToggleIcons(selector) {
    document.querySelectorAll(selector).forEach(btn => updateToggleIcon(btn, false));
  }
  
  // 날짜 직접 입력 감지
  document.addEventListener('input', (e) => {
    if (e.target.matches(SEL.DATE.START) || e.target.matches(SEL.DATE.END)) {
      updateDateChip();
    }
  });


  /* ===== 7. 초기화 ===== */
  document.addEventListener('DOMContentLoaded', () => {
    // 날짜 초기값 설정
    const startInput = document.querySelector(SEL.DATE.START);
    if (startInput && !startInput.value) {
      const r3m = document.querySelector(`${SEL.DATE.RADIO}[value="3m"]`);
      if (r3m) { r3m.checked = true; setDateRange('3m'); }
    } else {
      updateDateChip();
    }

    // UI 상태 초기화
    closeAllPanels('.integrated-middle-list, .integrated-detail-list, .incident-middle-list, .incident-detail-list');
    resetAllToggleIcons('button[class*="-toggle-btn"]');

    // 기선택된 체크박스 칩 생성
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
      updateChipFromInput(c);
    });
    updateAllCounts();
  });

})();