/*
 * ============================================================================
 * 파일 첨부 칩 UI
 * 1) 트리거  
 *    - #file-upload (라벨 클릭으로 오픈)
 * 2) 출력영역  
 *    - 같은 form 내 .file-list
 * 3) 기능  
 *    - 파일 선택 시 즉시 커스텀 칩 UI 렌더  
 *      · 이미지: .file-item-image (미리보기 썸네일 표시)  
 *      · 일반문서: .file-item (확장자별 아이콘 클래스/레이블 적용)  
 *        → 주요 확장자: .file-thumb-hwp, .file-thumb-doc, .file-thumb-pdf, .file-thumb-xls, .file-thumb-ppt  
 *        → 기타 확장자: .file-thumb-etc
 *    - X 버튼 클릭 시 개별 삭제 (input.value 초기화로 동일 파일 재선택 가능)
 *    - 접근성: .file-list는 시각적 역할만, 실제 업로드는 숨겨진 input이 담당
 * ============================================================================
 */


(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {

    var input = document.getElementById('file-upload');
    if (!input) return;

    var form = input.closest('form');
    if (!form) return;

    var fileListEl = form.querySelector('.file-list');
    if (!fileListEl) return;

    // 내부 상태 (미리보기용) 
    var filesState = [];

    // 확장자 → 썸네일 클래스 매핑
    var EXT_TO_THUMB = {
      // 주요 확장자 
      'hwp': 'file-thumb-hwp', 'hwpx': 'file-thumb-hwp',
      'doc': 'file-thumb-doc', 'docx': 'file-thumb-doc',
      'xls': 'file-thumb-xls', 'xlsx': 'file-thumb-xls',
      'ppt': 'file-thumb-ppt', 'pptx': 'file-thumb-ppt',
      'pdf': 'file-thumb-pdf'
    };

    // 확장자 → 타입 라벨 매핑
    var EXT_TO_LABEL = {
      'hwp': '한글문서', 'hwpx': '한글문서',
      'doc': 'Word 문서', 'docx': 'Word 문서',
      'xls': 'Excel 문서', 'xlsx': 'Excel 문서',
      'ppt': 'PPT 문서',  'pptx': 'PPT 문서',
      'pdf': 'PDF',
      'txt': '텍스트',
      'zip': '압축파일',
      'png': '이미지', 'jpg': '이미지', 'jpeg': '이미지', 'gif': '이미지', 'webp': '이미지', 'svg': '이미지'
    };

    // 파일 선택 이벤트
    input.addEventListener('change', function (e) {
      var list = Array.from(e.target.files || []);
      if (!list.length) return;

      list.forEach(function (f) { filesState.push(f); });


      render();
    });

    // 삭제 버튼
    fileListEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.file-remove');
      if (!btn) return;

      var idx = btn.getAttribute('data-remove-index');
      if (idx == null) return;

      idx = Number(idx);
      if (Number.isNaN(idx)) return;

      var removed = filesState.splice(idx, 1);
      input.value = ''; 

      render();
    });

    function render() {
      fileListEl.innerHTML = '';

      filesState.forEach(function (f, i) {
        var ext = getExt(f.name);
        var isImage = /^image\//.test(f.type) || ['png','jpg','jpeg','gif','webp','svg'].includes(ext);
        var removeBtnHtml =
          '<button class="file-remove btn-icon-normal-m" type="button" aria-label="첨부파일 삭제" data-remove-index="' + i + '">' +
            '<span class="icon20 icon--close icon--basic"></span>' +
          '</button>';

        if (isImage) {
          // 이미지 미리보기
          var url = URL.createObjectURL(f);
          var imageItem = document.createElement('div');
          imageItem.className = 'file-item-image';
          imageItem.innerHTML =
            '<img src="' + esc(url) + '" alt="첨부 이미지">' +
            removeBtnHtml;

          imageItem.querySelector('.file-remove').addEventListener('click', function () {
            URL.revokeObjectURL(url);
          }, { once: true });

          fileListEl.appendChild(imageItem);
        } else {
          // 일반 문서 칩
          var thumbClass = EXT_TO_THUMB[ext] || 'file-thumb-etc';
          var typeLabel = EXT_TO_LABEL[ext] || (f.type || '파일');
          var extText = ext ? ext.toUpperCase() : 'FILE';

          var item = document.createElement('div');
          item.className = 'file-item';
          item.innerHTML =
            '<div class="file-thumb ' + thumbClass + '"><span>' + esc(extText) + '</span></div>' +
            '<div class="file-info">' +
              '<p class="file-name" title="' + esc(f.name) + '">' + esc(f.name) + '</p>' +
              '<span class="file-type">' + esc(typeLabel) + '</span>' +
            '</div>' +
            removeBtnHtml;

          fileListEl.appendChild(item);
        }
      });
    }

    // 확장자 추출
    function getExt(name) {
      var n = String(name || '');
      var idx = n.lastIndexOf('.');
      return idx > -1 ? n.slice(idx + 1).toLowerCase() : '';
    }

    // HTML 이스케이프
    function esc(str) {
      return String(str).replace(/[&<>"']/g, function (m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
      });
    }
  }
  
})();
