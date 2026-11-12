// Cookie consent banner (Google Consent Mode v2).
// Default state is set inline in <head>: analytics_storage = denied.
// This script shows the banner, stores the choice and updates consent.
(function () {
  var KEY = 'cookie_consent';
  var lang = (document.documentElement.lang || 'ru').toLowerCase().slice(0, 2);
  if (lang === 'cz') lang = 'cs';
  var T = {
    ru: {
      text: 'Мы используем аналитические cookie Google Analytics, чтобы понимать, какие страницы полезны. Они включаются только с вашего согласия.',
      accept: 'Принять', decline: 'Отклонить', more: 'Подробнее', settings: 'Настройки cookie',
      policy: '/ru/privacy-policy.html'
    },
    en: {
      text: 'We use Google Analytics cookies to understand which pages are useful. They are switched on only with your consent.',
      accept: 'Accept', decline: 'Decline', more: 'Learn more', settings: 'Cookie settings',
      policy: '/en/privacy-policy.html'
    },
    cs: {
      text: 'Používáme analytické cookies Google Analytics, abychom věděli, které stránky jsou užitečné. Zapneme je pouze s vaším souhlasem.',
      accept: 'Přijmout', decline: 'Odmítnout', more: 'Více informací', settings: 'Nastavení cookies',
      policy: '/cz/privacy-policy.html'
    }
  };
  var t = T[lang] || T.ru;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function update(v) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' });
    }
  }
  function clearGaCookies() {
    var names = document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); });
    var host = location.hostname.replace(/^www\./, '');
    names.forEach(function (n) {
      if (n === '_ga' || n.indexOf('_ga_') === 0) {
        document.cookie = n + '=; Max-Age=0; path=/';
        document.cookie = n + '=; Max-Age=0; path=/; domain=.' + host;
      }
    });
  }

  var banner = null;
  function hide() { if (banner) { banner.parentNode.removeChild(banner); banner = null; } }
  function choose(v) {
    save(v);
    update(v);
    if (v !== 'granted') clearGaCookies();
    hide();
  }
  function btn(label, primary, handler) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = 'font:600 14px Inter,-apple-system,sans-serif;padding:10px 20px;border-radius:999px;cursor:pointer;' +
      (primary ? 'background:#1E6679;color:#FAFAF8;border:1px solid #1E6679;' : 'background:transparent;color:#2C3E46;border:1px solid #4E5E66;');
    b.addEventListener('click', handler);
    return b;
  }
  function show() {
    if (banner) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t.settings);
    banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:720px;margin:0 auto;' +
      'background:#FAFAF8;color:#2C3E46;border:1px solid #E0D6C7;border-radius:16px;padding:18px 20px;' +
      'box-shadow:0 12px 40px rgba(20,30,36,.18);font:400 14px/1.5 Inter,-apple-system,sans-serif;' +
      'display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;';
    var p = document.createElement('p');
    p.style.cssText = 'margin:0;flex:1 1 320px;';
    p.appendChild(document.createTextNode(t.text + ' '));
    var a = document.createElement('a');
    a.href = t.policy;
    a.textContent = t.more;
    a.style.cssText = 'color:#1E6679;text-decoration:underline;';
    p.appendChild(a);
    var box = document.createElement('div');
    box.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    box.appendChild(btn(t.decline, false, function () { choose('denied'); }));
    box.appendChild(btn(t.accept, true, function () { choose('granted'); }));
    banner.appendChild(p);
    banner.appendChild(box);
    document.body.appendChild(banner);
  }
  function addFooterLink() {
    var footer = document.querySelector('footer .container') || document.querySelector('footer');
    if (!footer || footer.querySelector('[data-cookie-settings]')) return;
    var a = document.createElement('a');
    a.href = '#';
    a.setAttribute('data-cookie-settings', '');
    a.textContent = t.settings;
    a.style.cssText = 'color:inherit;text-decoration:underline';
    a.addEventListener('click', function (e) { e.preventDefault(); show(); });
    footer.appendChild(document.createTextNode(' · '));
    footer.appendChild(a);
  }
  function init() {
    addFooterLink();
    if (!read()) show();
  }
  window.showCookieSettings = show;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
