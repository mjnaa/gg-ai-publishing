/*
 * ============================================================================
 * 파일 첨부 칩 UI
 * 1) 트리거  
 *    - #file-upload (라벨 클릭으로 오픈)
 * 2) 출력영역  
 *    - 같은 form 내 .file-list
 * 3) 기능  
 *    - 파일 선택 시 즉시 커스텀 칩 UI 렌더 + .is-uploading + .file-spinner 
 *      · 이미지: .file-item-image (미리보기 썸네일 표시)  
 *      · 일반문서: .file-item (확장자별 아이콘 클래스/레이블 적용)  
 *        → 주요 확장자: .file-thumb-hwp, .file-thumb-doc, .file-thumb-pdf, .file-thumb-xls, .file-thumb-ppt  
 *        → 기타 확장자: .file-thumb-etc
 *    - X 버튼 클릭 시 개별 삭제 (input.value 초기화로 동일 파일 재선택 가능)
 *    - 접근성: .file-list는 시각적 역할만, 실제 업로드는 숨겨진 input이 담당
 *    - 업로드 완료 시: .is-complete, 실패 시: .is-error
 *    - 드래그앤드롭: 화면 중앙 콘텐츠(.layout-main) 위에서 파일 드래그 시 화이트 딤 표시
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

      // 업로드를 시작할 시작 인덱스 저장
      var startIdx = filesState.length;

      list.forEach(function (f) { filesState.push(f); });

      render();

      // 추가된 항목들에 대해 업로드/스피너 적용
      startUploadsFrom(startIdx);
    });

    // 삭제 버튼
    fileListEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.file-remove');
      if (!btn) return;

      var idx = btn.getAttribute('data-remove-index');
      if (idx == null) return;

      idx = Number(idx);
      if (Number.isNaN(idx)) return;

      filesState.splice(idx, 1);
      input.value = ''; // 동일 파일 재선택 허용
      render();
    });

    function render() {
      fileListEl.innerHTML = '';

      filesState.forEach(function (f, i) {
        var ext = getExt(f.name);
        var isImage = /^image\//.test(f.type) || ['png','jpg','jpeg','gif','webp','svg'].indexOf(ext) !== -1;
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

          // 업로딩 스피너 표시
          imageItem.classList.add('is-uploading');
          if (!imageItem.querySelector('.file-spinner')) {
            var sp = document.createElement('span');
            sp.className = 'file-spinner';
            sp.setAttribute('aria-hidden', 'true');
            imageItem.appendChild(sp);
          }

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

          // 업로딩 스피너 표시
          item.classList.add('is-uploading');
          var thumb = item.querySelector('.file-thumb');
          if (thumb && !thumb.querySelector('.file-spinner')) {
            var sp2 = document.createElement('span');
            sp2.className = 'file-spinner';
            sp2.setAttribute('aria-hidden', 'true');
            thumb.appendChild(sp2);
          }

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


    /* ===== 로딩 스피너 / 업로드 데모 ===== */
    function startUploadsFrom(startIdx) {
      for (var i = startIdx; i < filesState.length; i++) {
        attachSpinner(i);     // 스피너/업로딩 상태 부여
        startSingleUpload(i); // 업로드 시작
      }
    }

    function attachSpinner(index) {
      var row = fileListEl.children[index];
      if (!row) return;

      if (row.classList.contains('file-item-image')) {
        row.classList.add('is-uploading'); 
        if (!row.querySelector('.file-spinner')) {
          var sp = document.createElement('span');
          sp.className = 'file-spinner';
          sp.setAttribute('aria-hidden', 'true');
          row.appendChild(sp);
        }
      } else if (row.classList.contains('file-item')) {
        row.classList.add('is-uploading'); 
        var thumb = row.querySelector('.file-thumb');
        if (thumb && !thumb.querySelector('.file-spinner')) {
          var sp2 = document.createElement('span');
          sp2.className = 'file-spinner';
          sp2.setAttribute('aria-hidden', 'true');
          thumb.appendChild(sp2);
        }
      }
    }

    function clearSpinner(index) {
      var row = fileListEl.children[index];
      if (!row) return;
      row.classList.remove('is-uploading');
      var sp = row.querySelector('.file-spinner');
      if (sp) sp.remove();
    }

    function markComplete(index) {
      var row = fileListEl.children[index];
      if (!row) return;
      row.classList.add('is-complete');
    }

    function markError(index) {
      var row = fileListEl.children[index];
      if (!row) return;
      row.classList.add('is-error');
    }

    function startSingleUpload(index) {
      var file = filesState[index];
      if (!file) return;

      var uploader = (window.ChatUpload && typeof window.ChatUpload.start === 'function')
        ? window.ChatUpload
        : { start: fakeUpload }; // 퍼블리싱용 데모

      uploader.start(file)
        .then(function () {
          clearSpinner(index);
          markComplete(index);
        })
        .catch(function () {
          clearSpinner(index);
          markError(index); 
        });
    }

    // 퍼블리싱용 데모
    function fakeUpload(file) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({}); }, 1200 + Math.random() * 1800);
      });
    }

  }
  
})();


/* ===== 드래그앤드롭 ===== */
(function () {
  'use strict';

  var input = document.getElementById('file-upload');
  if (!input) return;

  var dragDepth   = 0;          // 중첩 dragenter 보정
  var overlayEl   = null;       // 생성된 오버레이 캐시
  var hideTimer   = null;       // 지연 숨김 타이머
  var hbTimer     = null;       // 이벤트 끊김 감시
  var lastInside  = false;      // 직전 포인터가 .layout-main 내부였는지
  var lastOverTS  = 0;          // 마지막 dragover 타임스탬프
  var HB_TIMEOUT  = 300;        // dragover 무응답 허용 시간
  var HIDE_DELAY  = 120;        // 경계 지연 숨김

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    var main = document.querySelector('.layout-main');
    if (!main) return null;
    overlayEl = document.createElement('div');
    overlayEl.className = 'drag-overlay';
    overlayEl.innerHTML =
      '<div class="drag-overlay-inner" role="status" aria-live="polite">' +
        '<span class="icon36 icon--upload icon--basic" aria-hidden="true"></span>' +
        '<p class="txt">대화에 추가하려면<br>파일을 드래그해서 이곳에 놓아주세요.</p>' +
      '</div>';
    // 깜빡임 방지
    overlayEl.style.pointerEvents = 'none';
    main.appendChild(overlayEl);
    return overlayEl;
  }

  function isFileDrag(e) {
    var dt = e.dataTransfer;
    if (!dt) return false;
    var types = dt.types || [];
    return Array.prototype.indexOf.call(types, 'Files') !== -1;
  }

  function isPointerInsideMain(e) {
    var main = document.querySelector('.layout-main');
    if (!main) return false;
    var r = main.getBoundingClientRect();
    var x = e.clientX, y = e.clientY;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function startHeartbeat() {
    stopHeartbeat();
    lastOverTS = Date.now();
    hbTimer = setInterval(function () {
      if (Date.now() - lastOverTS > HB_TIMEOUT) {
        hideOverlay();
      }
    }, HB_TIMEOUT);
  }
  function stopHeartbeat() {
    if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
  }

  function showOverlay() {
    if (!ensureOverlay()) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    document.body.classList.add('is-dragging-files');
    startHeartbeat();
  }

  function hideOverlay() {
    dragDepth  = 0;
    lastInside = false;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    stopHeartbeat();
    document.body.classList.remove('is-dragging-files');
  }

  function onDragEnter(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth++;
    lastInside = isPointerInsideMain(e);
    if (lastInside) showOverlay();
  }

  function onDragOver(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    lastOverTS = Date.now();
    var inside = isPointerInsideMain(e);
    lastInside = inside;
    if (inside) {
      showOverlay();
    } else {
      if (!hideTimer) {
        hideTimer = setTimeout(function () {
          if (!lastInside) hideOverlay();
        }, HIDE_DELAY);
      }
    }
  }

  function onDragLeave(/* e */) {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0 && !hideTimer) {
      hideTimer = setTimeout(function () {
        if (!lastInside) hideOverlay();
      }, HIDE_DELAY);
    }
  }

  function onDrop(e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();

    var insideMain = isPointerInsideMain(e);
    hideOverlay();

    if (!insideMain) return;

    var files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    try {
      var dt = new DataTransfer();
      files.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
    } catch (err) {
    }

    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.addEventListener('dragenter', onDragEnter);
  window.addEventListener('dragover',  onDragOver,  { passive: false });
  window.addEventListener('dragleave', onDragLeave);
  window.addEventListener('drop',      onDrop,      { passive: false });
  window.addEventListener('dragend',   hideOverlay);

  window.addEventListener('blur',      hideOverlay);
  window.addEventListener('pagehide',  hideOverlay);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) hideOverlay();
  });

  window.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) {
      if (!hideTimer) {
        hideTimer = setTimeout(function () {
          hideOverlay();
        }, HIDE_DELAY);
      }
    }
  });

})();




