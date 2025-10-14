/*
 * ============================================================================
 * 파일 업로드
 * 1) 트리거
 *    - 각 input[type=file].file-input 의 change 이벤트
 * 2) 기능
 *    - 인스턴스별 파일명 1개 표시
 *    - 업로드 시 라벨에 .is-filled 토글 → 텍스트 색상 변경
 *    - 파일 선택 취소/리셋 시 placeholder 복구
 * ============================================================================
 */


(function () {
  'use strict';

  function setupFileInput(inputEl) {
    if (!inputEl || !inputEl.id) return;

    var labelEl = document.querySelector('label.file-input-like[for="' + inputEl.id + '"]');
    if (!labelEl) return;

    var placeholderEl = labelEl.querySelector('.file-placeholder');
    if (!placeholderEl) return;

    var DEFAULT_TEXT = '파일을 첨부하세요';

    function resetState() {
      placeholderEl.textContent = DEFAULT_TEXT;
      labelEl.classList.remove('is-filled');
    }

    inputEl.addEventListener('change', function (e) {
      var files = e.target.files;
      if (!files || files.length === 0) {
        resetState();
        return;
      }

      var file = files[0];
      placeholderEl.textContent = file ? file.name : DEFAULT_TEXT;
      labelEl.classList.add('is-filled');
    });

    var formEl = inputEl.closest('form');
    if (formEl) {
      formEl.addEventListener('reset', function () {
        setTimeout(resetState, 0);
      });
    }
  }

  var inputs = document.querySelectorAll('input[type="file"].file-input');
  inputs.forEach(function (input) {
    setupFileInput(input);
  });

})();
