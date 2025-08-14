(function(){
  const GA_ENABLED = typeof window.gtag === 'function';
  const FILE_EXTS = ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip','rar','7z','csv','txt','jpg','jpeg','png','gif','webp','svg','mp3','mp4','mov','avi','mkv','dwg','dxf'];

  function sendEvent(name, params){
    if (!GA_ENABLED) return;
    // 운영: debug_mode 주입 안 함. (디버그 시 콘솔에서 __ga4_debug(true))
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
    try{ const m = new URL(href, location.href).pathname.toLowerCase().match(/\.([a-z0-9]+)$/); return m?m[1]:''; }catch{ return ''; }
  }

  // 명시적/일반 버튼
  document.addEventListener('click', function(e){
    const t = e.target;
    const explicit = closestAttr(t, 'data-ga4-event');
    if (explicit){
      sendEvent(explicit, {
        label: closestAttr(t, 'data-ga4-label') || (t.innerText || '').trim().slice(0,100),
        category: closestAttr(t, 'data-ga4-category') || 'ui',
      });
      return;
    }
    const btn = t.closest && t.closest('button, [role="button"]');
    if (btn){
      sendEvent('click', {
        label: (btn.getAttribute('aria-label') || btn.innerText || btn.name || btn.id || 'button').trim().slice(0,100),
        category: 'button',
      });
    }
  }, { capture: true });

  // 파일 다운로드
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const ext = getExt(href);
    if (!ext || !FILE_EXTS.includes(ext)) return;
    let url; try{ url = new URL(href, location.href);}catch{ return; }
    const fileName = url.pathname.split('/').pop() || '(unknown)';
    sendEvent('file_download', { file_name: fileName, file_extension: ext, link_url: url.href });
  }, { capture: true });

  // 외부 링크
  document.addEventListener('click', function(e){
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    let url; try{ url = new URL(href, location.href);}catch{ return; }
    if (url.origin === location.origin) return;
    sendEvent('click_outbound', { link_url: url.href, link_host: url.host });
  }, { capture: true });

  // 폼 시작/제출
  const formStarted = new WeakSet();
  document.addEventListener('input', function(e){
    const form = e.target && e.target.form;
    if (!form || formStarted.has(form)) return;
    formStarted.add(form);
    sendEvent('form_start', { form_id: form.id || '(no-id)', form_name: form.getAttribute('name') || '(no-name)' });
  }, { capture: true });

  document.addEventListener('submit', function(e){
    const form = e.target;
    sendEvent('form_submit', {
      form_id: form.id || '(no-id)',
      form_name: form.getAttribute('name') || '(no-name)',
      form_action: form.getAttribute('action') || '(no-action)',
    });
  }, { capture: true });
})();
