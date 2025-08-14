/* GA4 Events for Jekyll
 * Tracks: button clicks, file downloads, outbound links, form start/submit
 * Optional overrides: data-ga4-event / data-ga4-label / data-ga4-category
 */
(function(){
  const GA_ENABLED = typeof window.gtag === 'function';
  const FILE_EXTS = [
    'pdf','doc','docx','xls','xlsx','ppt','pptx','zip','rar','7z','csv','txt',
    'jpg','jpeg','png','gif','webp','svg','mp3','mp4','mov','avi','mkv','dwg','dxf'
  ];

  function log(){ try{ console.log.apply(console, arguments); }catch(_){} }

  function sendEvent(name, params){
    if (!GA_ENABLED) return;
    log('[GA4] event →', name, params || {});
    window.gtag('event', name, params || {});
  }

  function closestAttr(el, attr){
    while (el && el !== document){
      if (el.getAttribute && el.hasAttribute(attr)) return el.getAttribute(attr);
      el = el.parentNode;
    }
    return null;
  }

  function getExt(href){
    try {
      const url = new URL(href, location.href);
      const m = url.pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
      return m ? m[1] : '';
    } catch { return ''; }
  }

  // 0) 디버그 버튼(id=enable-debug) 지원
  window.addEventListener('DOMContentLoaded', function(){
    const dbg = document.getElementById('enable-debug');
    if (dbg) dbg.addEventListener('click', function(){
      if (window.__ga4_debug) window.__ga4_debug(true);
      sendEvent('debug_toggle', { label: 'enable_debug', location: location.pathname });
    });
  });

  // 1) 명시적/일반 버튼 클릭
  document.addEventListener('click', function(e){
    const t = e.target;
    const explicit = closestAttr(t, 'data-ga4-event');
    if (explicit){
      sendEvent(explicit, {
        label: closestAttr(t, 'data-ga4-label') || (t.innerText || '').trim().slice(0,100),
        category: closestAttr(t, 'data-ga4-category') || 'ui',
        location: location.pathname
      });
      return;
    }
    const btn = t.closest && t.closest('button, [role="button"]');
    if (btn){
      sendEvent('click', {
        label: (btn.getAttribute('aria-label') || btn.innerText || btn.name || btn.id || 'button').trim().slice(0,100),
        category: 'button',
        location: location.pathname
      });
    }
  }, { capture: true });

  // 2) 파일 다운로드
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    const ext = getExt(href);
    if (!ext || !FILE_EXTS.includes(ext)) return;

    let url;
    try { url = new URL(href, location.href); } catch { return; }
    const fileName = url.pathname.split('/').pop() || '(unknown)';

    sendEvent('file_download', {
      file_name: fileName,
      file_extension: ext,
      link_url: url.href,
      location: location.pathname
    });
  }, { capture: true });

  // 3) 외부 링크
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    let url;
    try { url = new URL(href, location.href); } catch { return; }
    if (url.origin === location.origin) return;

    sendEvent('click_outbound', {
      link_url: url.href,
      link_host: url.host,
      location: location.pathname
    });
  }, { capture: true });

  // 4) 폼 시작/제출
  const formStarted = new WeakSet();

  document.addEventListener('input', function(e){
    const form = e.target && e.target.form;
    if (!form || formStarted.has(form)) return;
    formStarted.add(form);
    sendEvent('form_start', {
      form_id: form.id || '(no-id)',
      form_name: form.getAttribute('name') || '(no-name)',
      location: location.pathname
    });
  }, { capture: true });

  document.addEventListener('submit', function(e){
    const form = e.target;
    sendEvent('form_submit', {
      form_id: form.id || '(no-id)',
      form_name: form.getAttribute('name') || '(no-name)',
      form_action: form.getAttribute('action') || '(no-action)',
      location: location.pathname
    });
    // 데모에서는 실제 전송 막기
    if (form.getAttribute('data-demo') === '1') e.preventDefault();
  }, { capture: true });

})();
