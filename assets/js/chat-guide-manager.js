/*
 * ============================================================================
 * 공용 채팅 가이드 매니저
 * 1) 목적
 *    - 스마트도우미/프롬프트라이브러리가 동일한 #chat-guide 영역을 공유할 때
 *      문구 출력 및 "이전 소스 상태 초기화"를 관리
 * 2) 기능
 *    - set(text, source): 문구 출력 + source 기록 + 등록된 다른 소스 clear 실행
 *    - clear(): 문구 초기화 + 모든 소스 clear 실행
 *    - registerClearer(source, fn): 소스별 초기화 함수 등록 (예: smart, prompt)
 *    - #chat-guide .btn-aside-close 클릭 시 clear() 실행
 * 3) 대상
 *    - #chat-guide
 *    - #chat-guide .guide-em
 *    - #chat-guide .btn-aside-close
 * ============================================================================
 */


(function () {
  'use strict';

  if (window.ChatGuide && typeof window.ChatGuide.set === 'function') return;

  var guideEl = document.getElementById('chat-guide');
  var textEl  = guideEl ? guideEl.querySelector('.guide-em') : null;
  var closeEl = guideEl ? guideEl.querySelector('.btn-aside-close') : null;

  var clearers = {};
  var currentSource = '';

  function setText(text, source) {
    if (!textEl) return;

    // 소스가 바뀌면 이전 소스 상태 정리
    if (currentSource && source && currentSource !== source) {
      if (typeof clearers[currentSource] === 'function') clearers[currentSource]();
    }

    // 현재 소스 외 다른 소스도 정리
    Object.keys(clearers).forEach(function (k) {
      if (k !== source && typeof clearers[k] === 'function') clearers[k]();
    });

    currentSource = source || '';
    textEl.textContent = text || '';
    if (guideEl) guideEl.dataset.source = currentSource;
  }

  function clearAll() {
    if (!textEl) return;
    textEl.textContent = '';
    currentSource = '';
    if (guideEl) guideEl.dataset.source = '';
    Object.keys(clearers).forEach(function (k) {
      if (typeof clearers[k] === 'function') clearers[k]();
    });
  }

  function registerClearer(source, fn) {
    if (!source || typeof fn !== 'function') return;
    clearers[source] = fn;
  }

  // X 버튼은 한 번만
  if (closeEl && !closeEl.__chatGuideBound) {
    closeEl.__chatGuideBound = true;
    closeEl.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearAll();
    });
  }

  window.ChatGuide = {
    set: setText,
    clear: clearAll,
    registerClearer: registerClearer
  };
})(); 
