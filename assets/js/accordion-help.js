/*
 * ============================================================================
 * 아코디언 메뉴 (도움말)
 * 1) 트리거
 *    - .help-acc 내부 .acc-btn 클릭 또는 Enter/Space
 * 2) 기능
 *    - 단일 오픈(다른 항목 자동 닫힘)
 *    - 패널 열릴 때 해당 패널로 스크롤/포커스 이동(가려짐 방지)
 * ============================================================================
 */


(function () {
  'use strict';

  var CONFIG = {
    scrollBehavior: 'smooth',  
    defaultOffset: 12 
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var ROOT = document.querySelector('.help-acc');
    if (!ROOT) return;

    var ITEMS = ROOT.querySelectorAll('.acc-item');

    ITEMS.forEach(function (item) {
      var btn   = item.querySelector('.acc-head .acc-btn');
      var panel = item.querySelector('.acc-panel');
      if (!btn || !panel) return;

      if (!btn.hasAttribute('aria-controls')) {
        if (!panel.id) panel.id = createPanelId(item);
        btn.setAttribute('aria-controls', panel.id);
      }

      preparePanel(panel);

      if (!panel.hasAttribute('tabindex')) {
        panel.setAttribute('tabindex', '-1');
      }

      var isOpen = item.classList.contains('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      setPanelImmediately(panel, isOpen);
    });

    /* ===== 이벤트 ===== */
    ROOT.addEventListener('click', function (e) {
      var btn = e.target.closest('.acc-btn');
      if (!btn || !ROOT.contains(btn)) return;
      e.preventDefault();
      onToggle(btn, ROOT);
    });

    // 키보드 접근성
    ROOT.addEventListener('keydown', function (e) {
      var btn = e.target.closest('.acc-btn');
      if (!btn || !ROOT.contains(btn)) return;
      var isEnter = e.key === 'Enter' || e.keyCode === 13;
      var isSpace = e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32;
      if (isEnter || isSpace) {
        e.preventDefault();
        onToggle(btn, ROOT);
      }
    });

    // 리사이즈 시, 열린 패널 높이 재계산
    window.addEventListener('resize', function () {
      var openPanels = ROOT.querySelectorAll('.acc-item.is-open .acc-panel');
      openPanels.forEach(function (panel) { snapOpenHeight(panel); });
    });
  }

  function onToggle(btn, root) {
    var item   = btn.closest('.acc-item');
    var panel  = item ? item.querySelector('.acc-panel') : null;
    var isOpen = item ? item.classList.contains('is-open') : false;
    if (!item || !panel) return;

    // 단일 오픈: 다른 항목 닫기
    closeAll(root, item);

    setOpen(item, panel, !isOpen, root);
  }

  function closeAll(root, exceptItem) {
    var openItems = root.querySelectorAll('.acc-item.is-open');
    openItems.forEach(function (it) {
      if (it === exceptItem) return;
      var btn   = it.querySelector('.acc-head .acc-btn');
      var panel = it.querySelector('.acc-panel');
      setOpen(it, panel, false, root);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function setOpen(item, panel, open, root) {
    var btn = item.querySelector('.acc-head .acc-btn');
    if (!btn || !panel) return;

    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));

    animatePanel(panel, open, function () {
      if (open) {
        scrollToPanel(panel, root);
        try { panel.focus(); } catch (e) {}
      }
    });
  }

  function preparePanel(panel) {
    panel.style.overflow = 'hidden';
    panel.style.height = '0px';
    panel.setAttribute('aria-hidden', 'true');
  }

  function setPanelImmediately(panel, open) {
    panel.style.transition = 'none';
    if (open) {
      panel.style.height = panel.scrollHeight + 'px';
      panel.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () {
        panel.style.height = 'auto';
        requestAnimationFrame(function () { panel.style.transition = ''; });
      });
    } else {
      panel.style.height = '0px';
      panel.setAttribute('aria-hidden', 'true');
      requestAnimationFrame(function () { panel.style.transition = ''; });
    }
  }

  function animatePanel(panel, open, onDone) {
    var DURATION = 200; // ms
    panel.style.transitionProperty = 'height';
    panel.style.transitionDuration = DURATION + 'ms';
    panel.style.transitionTimingFunction = 'ease';

    if (open) {
      panel.setAttribute('aria-hidden', 'false');
      var startOpen = panel.getBoundingClientRect().height || 0;
      panel.style.height = startOpen + 'px';
      var target = panel.scrollHeight;
      requestAnimationFrame(function () { panel.style.height = target + 'px'; });
      panel.addEventListener('transitionend', function te(e) {
        if (e.propertyName !== 'height') return;
        panel.removeEventListener('transitionend', te);
        panel.style.height = 'auto';
        if (typeof onDone === 'function') onDone();
      });
    } else {

      var startClose = panel.scrollHeight;
      panel.style.height = startClose + 'px';
      requestAnimationFrame(function () { panel.style.height = '0px'; });
      panel.addEventListener('transitionend', function te2(e) {
        if (e.propertyName !== 'height') return;
        panel.removeEventListener('transitionend', te2);
        panel.setAttribute('aria-hidden', 'true');
        if (typeof onDone === 'function') onDone();
      });
    }
  }

  function snapOpenHeight(panel) {
    if (!panel || panel.getAttribute('aria-hidden') === 'true') return;
    var prev = panel.style.transition;
    panel.style.transition = 'none';
    panel.style.height = panel.scrollHeight + 'px';
    requestAnimationFrame(function () {
      panel.style.height = 'auto';
      panel.style.transition = prev || '';
    });
  }

  /* ===== 스크롤/포커스 ===== */
  function scrollToPanel(panel, root) {
    var container = getScrollContainer(root) || document.scrollingElement || document.documentElement;
    var offset = getScrollOffset(root);

    if (container === document.scrollingElement || container === document.documentElement) {
      var panelTop = panel.getBoundingClientRect().top + window.pageYOffset;
      var target = Math.max(0, panelTop - offset);
      window.scrollTo({ top: target, behavior: CONFIG.scrollBehavior });
    } else {
      var cRect = container.getBoundingClientRect();
      var pRect = panel.getBoundingClientRect();
      var current = container.scrollTop;

      var targetTop = current + (pRect.top - cRect.top) - offset;
      var panelBottom = current + (pRect.bottom - cRect.top);
      var viewBottom = container.scrollTop + container.clientHeight;

      var next = current;
      if (pRect.top < cRect.top + offset) {
        next = targetTop;
      } else if (panelBottom > viewBottom) {
        next = panelBottom - container.clientHeight + offset;
      }
      container.scrollTo({ top: Math.max(0, next), behavior: CONFIG.scrollBehavior });
    }
  }

  function getScrollContainer(el) {
    if (el && el.dataset && el.dataset.scrollContainer === 'self') return el;

    var node = el;
    while (node && node !== document.body) {
      var style = window.getComputedStyle(node);
      var oy = style.overflowY;
      if (oy === 'auto' || oy === 'scroll') return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function getScrollOffset(root) {
    var v = (root && root.dataset) ? root.dataset.scrollOffset : null;
    var n = v ? parseInt(v, 10) : NaN;
    return isFinite(n) ? n : CONFIG.defaultOffset;
  }

  
  function createPanelId(item) {
    var siblings = item.parentElement ? item.parentElement.children : [];
    var idx = Array.prototype.indexOf.call(siblings, item);
    return 'acc-panel-' + String(idx + 1).padStart(2, '0');
  }
})();
