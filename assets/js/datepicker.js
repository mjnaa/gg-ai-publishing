/*
 * ============================================================================
 * 공통 날짜 선택기
 * 1) 기능
 *    - UI 제어: 화면 여백을 감지하여 달력 위치 자동 조정
 *    - 미래 날짜 선택 비활성화(disabled), 외부 클릭 시 닫기 처리
 *    - 상단 타이틀 'YYYY년 M월' 형식 / 주말(토,일) 식별 클래스 부여
 * ============================================================================
 */

(function () {
  'use strict';

  const SELECTORS = {
    WRAPPER: '.date-field',
    INPUT: 'input[type="text"]',
    TRIGGER: '.date-field-icon'
  };

  let activeInput = null;
  let calendarEl = null;

  /* ===== 1. 날짜 유틸리티 ===== */
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDate(str) {
    if (!str) return new Date();
    const sep = str.includes('.') ? '.' : '-';
    const parts = str.split(sep).map(Number);
    if (parts.length < 3) return new Date();
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }


  /* ===== 2. 달력 마크업 생성 ===== */
  function createCalendarMarkup() {
    if (document.getElementById('common-datepicker')) return;

    const html = `
      <div id="common-datepicker" class="calendar-popup" role="dialog" aria-modal="true" hidden>
        <div class="calendar-header">
          <div class="cal-nav-group">
            <button type="button" class="cal-nav-btn btn-cal-prev-year" aria-label="이전 연도">
              <span class="icon24 icon--double-arrow-left icon--basic"></span>
            </button>
            
            <button type="button" class="cal-nav-btn btn-cal-prev" aria-label="이전 달">
              <span class="icon24 icon--arrow-left icon--basic"></span>
            </button>
          </div>
          <strong class="current-ym"></strong>
          <div class="cal-nav-group">
            <button type="button" class="cal-nav-btn btn-cal-next" aria-label="다음 달">
              <span class="icon24 icon--arrow-right icon--basic"></span>
            </button>
            <button type="button" class="cal-nav-btn btn-cal-next-year" aria-label="다음 연도">
              <span class="icon24 icon--double-arrow-right icon--basic"></span>
            </button>
          </div>
        </div>
        <div class="calendar-body">
          <div class="weekdays">
            <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
          </div>
          <div class="days"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    calendarEl = document.getElementById('common-datepicker');
    
    // 내부 클릭 이벤트 위임
    calendarEl.addEventListener('click', handleCalendarClick);

    // 외부 클릭 닫기
    document.addEventListener('click', (e) => {
      if (activeInput && !calendarEl.contains(e.target) && !e.target.closest(SELECTORS.WRAPPER)) {
        closeCalendar();
      }
    });
    
    // 스크롤 시 달력 닫기
    window.addEventListener('scroll', () => {
       if (activeInput) closeCalendar();
    }, { passive: true });
  }


  /* ===== 3. 달력 렌더링 ===== */
  function renderCalendar(year, month) {
    const $days = calendarEl.querySelector('.days');
    const $title = calendarEl.querySelector('.current-ym');
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayYear = today.getFullYear();

    $title.textContent = `${year}년 ${month + 1}월`;
    $title.dataset.year = year;
    $title.dataset.month = month;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); 
    const totalDays = lastDay.getDate();

    let html = '';
    // 빈 날짜 채우기
    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<span class="day empty"></span>`;
    }
    // 날짜 생성
    for (let d = 1; d <= totalDays; d++) {
      const current = new Date(year, month, d);
      const dayOfWeek = current.getDay(); // 0:일, 6:토
      const isFuture = current > today; 
      const dateStr = formatDate(current);
      const isSelected = activeInput && activeInput.value === dateStr;
      const isToday = current.getTime() === today.getTime();
      
      // 클래스 조합: 기본 day + 상태/요일/주말 클래스
      let classList = 'day';
      if (isSelected) classList += ' is-selected';
      if (isToday) classList += ' is-today';
      if (dayOfWeek === 0) classList += ' is-sunday';
      if (dayOfWeek === 6) classList += ' is-saturday';
      
      const disabledAttr = isFuture ? 'disabled' : '';
      
      html += `<button type="button" class="${classList}" data-date="${dateStr}" ${disabledAttr}>${d}</button>`;
    }
    $days.innerHTML = html;

    // 미래 날짜 이동 제한
    const nextMonthBtn = calendarEl.querySelector('.btn-cal-next');
    const nextYearBtn = calendarEl.querySelector('.btn-cal-next-year');
    
    const nextMonthDate = new Date(year, month + 1, 1);
    const isNextMonthFuture = nextMonthDate > today;
    
    nextMonthBtn.disabled = isNextMonthFuture;

    const isNextYearFuture = (year + 1) > todayYear;
    nextYearBtn.disabled = isNextYearFuture;
  }


  /* ===== 4. 기능 함수 (열기/닫기/클릭) ===== */
  function openCalendar(input) {
    createCalendarMarkup();
    activeInput = input;
    
    const wrapper = input.closest(SELECTORS.WRAPPER);
    if (wrapper) wrapper.classList.add('is-focused');

    const val = input.value.trim();
    const date = (val && /^[\d.-]+$/.test(val)) ? parseDate(val) : new Date();
    renderCalendar(date.getFullYear(), date.getMonth());
    
    calendarEl.hidden = false;

    // 위치 계산 
    const rect = input.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const viewportHeight = window.innerHeight;
    const calendarHeight = calendarEl.offsetHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    const margin = 4;

    if (spaceBelow < calendarHeight && spaceAbove > calendarHeight) {
       calendarEl.style.top = (rect.top + scrollTop - calendarHeight - margin) + 'px';
       calendarEl.classList.add('is-top'); 
    } else {
       calendarEl.style.top = (rect.bottom + scrollTop + margin) + 'px';
       calendarEl.classList.remove('is-top');
    }
    
    calendarEl.style.left = rect.left + 'px';
  }

  function closeCalendar() {
    if (calendarEl) calendarEl.hidden = true;
    if (activeInput) {
      const wrapper = activeInput.closest(SELECTORS.WRAPPER);
      if (wrapper) wrapper.classList.remove('is-focused');
      activeInput = null;
    }
  }

  function handleCalendarClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const title = calendarEl.querySelector('.current-ym');
    let year = parseInt(title.dataset.year);
    let month = parseInt(title.dataset.month);

    if (target.matches('.day') && !target.disabled) {
      if (activeInput) {
        activeInput.value = target.dataset.date;
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      closeCalendar();
      return;
    }

    if (target.matches('.btn-cal-prev')) {
      month--;
      if (month < 0) { year--; month = 11; }
      renderCalendar(year, month);
    } else if (target.matches('.btn-cal-next')) {
      month++;
      if (month > 11) { year++; month = 0; }
      renderCalendar(year, month);
    } else if (target.matches('.btn-cal-prev-year')) {
      year--;
      renderCalendar(year, month);
    } else if (target.matches('.btn-cal-next-year')) {
      year++;
      renderCalendar(year, month);
    }
  }


  /* ===== 5. 초기화 (이벤트 위임) ===== */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(SELECTORS.TRIGGER);
    if (trigger) {
      const wrapper = trigger.closest(SELECTORS.WRAPPER);
      const input = wrapper.querySelector(SELECTORS.INPUT);
      
      if (activeInput === input && calendarEl && !calendarEl.hidden) {
        closeCalendar();
      } else {
        if (input) openCalendar(input);
      }
    }
  });

})();