/* 
 * ============================================================================
 * 채팅 버블 액션 제어
 * 1) 트리거
 *    - 복사: .msg-actions .btn-msg[aria-label="복사"]
 *    - 출처 토글: .msg-actions .source-toggle[aria-controls="<panelId>"]
 *    - 좋아요/별로에요: .msg.is-bot .msg-actions .btn-msg[aria-label="좋아요" | "별로에요"]
 * 2) 기능
 *    - 복사 클릭 → 3초간 체크아이콘 표시 후 원복 + 버블 텍스트 클립보드 복사
 *    - 출처 토글 클릭 → 대상 패널 show/hide, 아이콘 토글, 라벨 "출처 n개" ↔ "출처 닫기"
 *    - 좋아요/별로에요 → 클릭한 쪽 아이콘 fill 버전으로 전환
 * 3) 대상 DOM
 *    - 복사 대상 텍스트: 근접한 .msg-bubble 내부 p/코드/텍스트
 *    - 출처 패널: .msg-sources#<panelId> (패널 내부 .source-list > .source-item 갯수로 n 계산)
 *    - 아이콘 스팬: 버튼 내부 .iconXX + .icon--* 클래스 보유 엘리먼트
 * ============================================================================ 
 */


(function () {
  'use strict';

  var ICON = {
    CHECK: 'icon--check',
    ARROW_DOWN: 'icon--arrow-down',
    ARROW_UP: 'icon--arrow-up',
    LIKE_BASE: 'icon--thumb-up',
    LIKE_FILL: 'icon--thumb-up-fill',
    DISLIKE_BASE: 'icon--thumb-down',
    DISLIKE_FILL: 'icon--thumb-down-fill'
  };


  function findIconSpan(btn) {
    return btn ? (btn.querySelector('span[class*="icon--"], span[class^="icon"]') || null) : null;
  }

  function removeAllIconDashClasses(iconEl) {
    if (!iconEl) return;
    Array.from(iconEl.classList).forEach(function (c) {
      if (c.indexOf('icon--') === 0) iconEl.classList.remove(c);
    });
  }

  function setIcon(iconEl, targetIconClass) {
    if (!iconEl || !targetIconClass) return;
    removeAllIconDashClasses(iconEl);
    iconEl.classList.add(targetIconClass);
  }

  function getNearestBubbleText(startEl) {
    var msg = startEl.closest('.msg');
    if (!msg) return '';
    var bubble = msg.querySelector('.msg-bubble');
    if (!bubble) return '';
    var ps = bubble.querySelectorAll('p');
    if (ps.length) {
      var out = [];
      ps.forEach(function (p) { out.push((p.textContent || '').trim()); });
      return out.join('\n').trim();
    }
    var pre = bubble.querySelector('pre, code');
    if (pre) return (pre.textContent || '').trim();
    return (bubble.textContent || '').trim();
  }

  // 클립보드 복사
  function copyToClipboard(text) {
    if (!text) return Promise.resolve();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      resolve();
    });
  }

  // hidden 토글
  function setHidden(el, shouldHide) {
    if (!el) return;
    if ('hidden' in el) el.hidden = !!shouldHide;
  }

  /* ===== 복사 버튼 ===== */
  function handleCopyClick(e) {
    var btn = e.currentTarget;
    var icon = findIconSpan(btn);
    if (!icon) return;
    if (btn.dataset.copyBusy === '1') return;

    // 최초 1회만 원본 아이콘 저장
    if (!btn.dataset.originalIcon) {
      var origin = Array.from(icon.classList).find(function (c) { return c.indexOf('icon--') === 0; }) || '';
      btn.dataset.originalIcon = origin;
    }
    var originalIcon = btn.dataset.originalIcon;
    var originalAria = btn.getAttribute('aria-label') || '복사';

    // 체크 상태면 원복
    if (icon.classList.contains(ICON.CHECK)) {
      setIcon(icon, originalIcon);
    }

    var text = getNearestBubbleText(btn);
    copyToClipboard(text).then(function () {
      btn.dataset.copyBusy = '1';
      btn.setAttribute('aria-label', '복사됨');

      // 체크 아이콘으로 전환
      setIcon(icon, ICON.CHECK);

      // 3초 후 원복
      window.setTimeout(function () {
        setIcon(icon, originalIcon);
        btn.setAttribute('aria-label', originalAria);
        btn.dataset.copyBusy = '0';
      }, 3000);
    });
  }

  function bindCopyButtons(root) {
    var list = (root || document).querySelectorAll('.msg-actions .btn-msg[aria-label="복사"]');
    list.forEach(function (b) {
      b.removeEventListener('click', handleCopyClick);
      b.addEventListener('click', handleCopyClick);
    });
  }

  /* ===== 출처 토글 ===== */
  function countSources(panel) {
    if (!panel) return 0;
    var items = panel.querySelectorAll('.source-list .source-item');
    return items.length || 0;
  }

  function handleSourceToggle(e) {
    var btn = e.currentTarget;
    var panelId = btn.getAttribute('aria-controls');
    if (!panelId) return;
    var panel = document.getElementById(panelId);
    if (!panel) return;

    var willOpen = !(btn.getAttribute('aria-expanded') === 'true');
    setHidden(panel, !willOpen);
    btn.setAttribute('aria-expanded', String(willOpen));

    // 아이콘 화살표 토글
    var arrow = btn.querySelector('span.' + ICON.ARROW_DOWN + ', span.' + ICON.ARROW_UP);
    if (arrow) {
      arrow.classList.remove(ICON.ARROW_DOWN, ICON.ARROW_UP);
      arrow.classList.add(willOpen ? ICON.ARROW_UP : ICON.ARROW_DOWN);
    }

    // 라벨 토글: 클래스 없는 span을 라벨로 가정
    var labelSpan = btn.querySelector('span:not([class])');
    if (labelSpan) {
      if (willOpen) {
        labelSpan.textContent = '출처 닫기';
      } else {
        var n = btn.dataset.sourceCount;
        if (!n) {
          n = String(countSources(panel));
          btn.dataset.sourceCount = n;
        }
        labelSpan.textContent = '출처 ' + n + '개';
      }
    }
  }

  function bindSourceToggles(root) {
    var toggles = (root || document).querySelectorAll('.msg-actions .source-toggle[aria-controls]');
    toggles.forEach(function (t) {
      var panelId = t.getAttribute('aria-controls');
      var panel = panelId && document.getElementById(panelId);
      if (panel) {
        var hiddenNow = panel.hasAttribute('hidden') ? panel.hidden : panel.classList.contains('is-hidden');
        t.setAttribute('aria-expanded', String(!hiddenNow));

        // 초기 라벨 세팅 (닫혀 있으면 "출처 n개")
        var labelSpan = t.querySelector('span:not([class])');
        if (labelSpan && hiddenNow) {
          var n = String(countSources(panel));
          t.dataset.sourceCount = n;
          labelSpan.textContent = '출처 ' + n + '개';
        }

        // 초기 화살표 세팅
        var arrow = t.querySelector('span.' + ICON.ARROW_DOWN + ', span.' + ICON.ARROW_UP);
        if (arrow) {
          arrow.classList.remove(ICON.ARROW_DOWN, ICON.ARROW_UP);
          arrow.classList.add(hiddenNow ? ICON.ARROW_DOWN : ICON.ARROW_UP);
        }
      }
      t.removeEventListener('click', handleSourceToggle);
      t.addEventListener('click', handleSourceToggle);
    });
  }

  /* ===== 좋아요/별로에요 아이콘 fill 토글 ===== */
  function setThumbIconFilled(iconEl, isLike, makeFill) {
    if (!iconEl) return;
    setIcon(iconEl, makeFill ? (isLike ? ICON.LIKE_FILL : ICON.DISLIKE_FILL)
                             : (isLike ? ICON.LIKE_BASE : ICON.DISLIKE_BASE));
  }

  function handleThumbClick(e) {
    var btn = e.currentTarget;
    var actions = btn.closest('.msg-actions');
    if (!actions) return;

    var isLike = btn.getAttribute('aria-label') === '좋아요';
    var likeBtn = actions.querySelector('.btn-msg[aria-label="좋아요"]');
    var dislikeBtn = actions.querySelector('.btn-msg[aria-label="별로에요"]');
    if (!likeBtn || !dislikeBtn) return;

    var isActive = btn.dataset.active === '1';

    if (isActive) {
      btn.dataset.active = '0';
      setThumbIconFilled(findIconSpan(btn), isLike, false);
      return;
    }

    btn.dataset.active = '1';
    setThumbIconFilled(findIconSpan(btn), isLike, true);

    var other = isLike ? dislikeBtn : likeBtn;
    other.dataset.active = '0';
    setThumbIconFilled(findIconSpan(other), !isLike, false);
  }

  function bindThumbButtons(root) {
    var area = (root || document);
    var likes = area.querySelectorAll('.msg.is-bot .msg-actions .btn-msg[aria-label="좋아요"]');
    var dislikes = area.querySelectorAll('.msg.is-bot .msg-actions .btn-msg[aria-label="별로에요"]');
    likes.forEach(function (b) {
      b.removeEventListener('click', handleThumbClick);
      b.addEventListener('click', handleThumbClick);
    });
    dislikes.forEach(function (b) {
      b.removeEventListener('click', handleThumbClick);
      b.addEventListener('click', handleThumbClick);
    });
  }

  /* ===== 초기화 ===== */
  function init() {
    bindCopyButtons(document);
    bindSourceToggles(document);
    bindThumbButtons(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();