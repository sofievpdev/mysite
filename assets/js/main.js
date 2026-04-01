// Language switching - navigate to language URL
function switchLang(lang) {
  var path = window.location.pathname;
  var newPath = path.replace(/^\/(ru|en|cz)\//, '/' + lang + '/');
  if (newPath === path && !path.match(/^\/(ru|en|cz)\//)) {
    // Not in a language directory, redirect to one
    newPath = '/' + lang + '/';
  }
  window.location.href = newPath;
}

// Detect current language from URL
var currentLang = (function() {
  var match = window.location.pathname.match(/^\/(ru|en|cz)\//);
  return match ? match[1] : 'ru';
})();

// Navbar scroll
window.addEventListener('scroll', function() {
  var navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
  // Also support results page nav id
  var nav = document.getElementById('nav');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
});

// Mobile menu
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// About read more
function toggleAbout() {
  var full = document.getElementById('aboutFull');
  var btn = document.getElementById('readMoreBtn');
  if (!full || !btn) return;
  full.classList.toggle('expanded');
  btn.classList.toggle('expanded');
  var isExpanded = full.classList.contains('expanded');
  var texts = {
    ru: isExpanded ? 'Свернуть' : 'Читать далее',
    en: isExpanded ? 'Show less' : 'Read more',
    cz: isExpanded ? 'Zobrazit m\u00e9n\u011b' : '\u010c\u00edst d\u00e1le'
  };
  btn.querySelector('span').textContent = texts[currentLang] || texts.ru;
}

// Service accordion
function toggleService(id) {
  var card = document.getElementById(id);
  var wasOpen = card.classList.contains('open');
  document.querySelectorAll('.service-card').forEach(function(c) { c.classList.remove('open'); });
  if (!wasOpen) card.classList.add('open');
}

// FAQ accordion
function toggleFaq(el) {
  var item = el.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
  if (!wasOpen) item.classList.add('open');
}

// Scroll reveal
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(function(el) { revealObserver.observe(el); });

// Fallback: force reveal on mobile if observer doesn't trigger
if (window.innerWidth <= 768) {
  setTimeout(function() {
    document.querySelectorAll('.reveal').forEach(function(el) {
      el.classList.add('visible');
      el.classList.add('active');
    });
  }, 500);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var href = a.getAttribute('href');
    if (href !== '#') {
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

// Animated counters
var counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var el = entry.target;
      var target = parseInt(el.dataset.count);
      if (!target || el.dataset.animated) return;
      el.dataset.animated = 'true';
      var current = 0;
      var step = Math.max(1, Math.floor(target / 60));
      var interval = setInterval(function() {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = current + '+';
      }, 25);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(function(el) { counterObserver.observe(el); });

// ============================================================
// LEAD MAGNET POPUP
// ============================================================

// API endpoint for email subscription (Brevo key stored server-side)
var API_URL = 'https://sofievp-api.onrender.com';

// Guide configuration: multiple guides per language
var pageLang = document.documentElement.lang || 'ru';
var guideConfig = {
  '5-tests': {
    cs: { path: '/cz/guides/5-analyzu.html', templateId: 2 },
    ru: { path: '/guide-5-analizov.html', templateId: 1 },
    en: { path: '/guide-5-analizov.html', templateId: 1 }
  },
  'omega3': {
    cs: { path: '/cz/guides/omega3.html', templateId: 4 },
    ru: { path: '/ru/guides/omega3.html', templateId: 3 },
    en: { path: '/en/guides/omega3.html', templateId: 5 }
  }
};
var defaultGuideKey = '5-tests';

function getGuideInfo(guideKey) {
  var langKey = (pageLang === 'cs') ? 'cs' : (pageLang === 'en' ? 'en' : 'ru');
  var config = guideConfig[guideKey || defaultGuideKey];
  if (!config || !config[langKey]) config = guideConfig[defaultGuideKey];
  return config[langKey];
}

// Default guide for backward compatibility
var defaultGuide = getGuideInfo(defaultGuideKey);
var guidePath = defaultGuide.path;
var guideTemplateId = defaultGuide.templateId;

// Popup content per guide per language
var popupContent = {
  '5-tests': {
    cs: { badge: 'Bezplatný průvodce', title: 'Únava a váha po 30: 5 analýz, které odhalí příčinu', desc: 'Zjistěte, které markery skutečně odhalí příčinu — i když standardní testy vycházejí «v normě».' },
    ru: { badge: 'Бесплатный гайд', title: 'Усталость и вес после 30: 5 анализов, которые покажут причину', desc: 'Узнайте, какие маркеры действительно покажут причину — даже когда стандартные анализы «в норме».' },
    en: { badge: 'Free guide', title: 'Fatigue & weight after 30: 5 tests that reveal the cause', desc: 'Discover which markers truly reveal the cause — even when standard tests come back "normal".' }
  },
  'omega3': {
    cs: { badge: 'Zdarma', title: 'Checklist: Jak vybrat kvalitní Omega-3', desc: 'Na co se dívat při výběru, srovnání doplňků a doporučení od nutriční terapeutky.' },
    ru: { badge: 'Бесплатно', title: 'Чек-лист: Как выбрать качественную Омега-3', desc: 'На что обращать внимание при выборе, сравнение добавок и рекомендации нутрициолога.' },
    en: { badge: 'Free', title: 'Checklist: How to choose quality Omega-3', desc: 'What to look for when choosing, supplement comparison and dietitian recommendations.' }
  }
};

function updatePopupContent(guideKey) {
  var langKey = (pageLang === 'cs') ? 'cs' : (pageLang === 'en' ? 'en' : 'ru');
  var data = popupContent[guideKey] && popupContent[guideKey][langKey];
  if (!data) return;
  var badge = document.querySelector('#lmFormState .lm-badge');
  var title = document.querySelector('#lmFormState h3');
  var desc = document.querySelector('#lmFormState > p, #lmFormState .lm-form ~ p');
  if (!desc) desc = document.querySelector('#lmFormState p');
  if (badge) badge.textContent = data.badge;
  if (title) title.textContent = data.title;
  if (desc && !desc.closest('.lm-form')) desc.textContent = data.desc;
}

// Subscribe: add contact to list + send guide email
function brevoSubmit(email, customPath, customTemplateId) {
  var usePath = customPath || guidePath;
  var useTemplateId = customTemplateId || guideTemplateId;
  var guideLink = window.location.origin + usePath;

  fetch(API_URL + '/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, guide_link: guideLink, template_id: useTemplateId, lang: pageLang })
  }).catch(function(err) {
    console.log('Subscribe error:', err);
  });
}

// Show popup
var lmShown = false;
function showLM(guideKey) {
  if (lmShown || sessionStorage.getItem('lm_closed')) return;
  if (localStorage.getItem('lm_email')) return;
  lmShown = true;
  var key = guideKey || defaultGuideKey;
  var overlay = document.getElementById('lmOverlay');
  if (overlay) {
    overlay.dataset.guide = key;
    updatePopupContent(key);
    overlay.classList.add('active');
  }
}

// Timer: show after 10s
setTimeout(showLM, 10000);

// Exit intent (desktop only)
document.addEventListener('mouseout', function(e) {
  if (e.clientY < 5 && !e.relatedTarget) showLM();
});

function closeLM() {
  var overlay = document.getElementById('lmOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    // Reset to default state after close
    setTimeout(function() {
      overlay.dataset.guide = defaultGuideKey;
      document.getElementById('lmFormState').style.display = 'block';
      document.getElementById('lmSuccess').style.display = 'none';
      document.getElementById('lmEmail').value = '';
      document.getElementById('lmEmail').style.borderColor = '';
      updatePopupContent(defaultGuideKey);
    }, 300);
  }
  sessionStorage.setItem('lm_closed', '1');
}

// Close on overlay click (not popup)
(function() {
  var overlay = document.getElementById('lmOverlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) closeLM();
    });
  }
})();

function submitLM() {
  var email = document.getElementById('lmEmail').value.trim();
  if (!email || !email.includes('@')) {
    document.getElementById('lmEmail').style.borderColor = '#c44';
    return;
  }

  localStorage.setItem('lm_email', email);

  // Determine active guide
  var overlay = document.getElementById('lmOverlay');
  var activeKey = (overlay && overlay.dataset.guide) || defaultGuideKey;
  var guideInfo = getGuideInfo(activeKey);

  // Open guide immediately
  window.open(guideInfo.path, '_blank');

  // Show success state
  document.getElementById('lmFormState').style.display = 'none';
  document.getElementById('lmSuccess').style.display = 'block';

  // Update success link to correct guide
  var successLink = document.querySelector('#lmSuccess a');
  if (successLink) successLink.href = guideInfo.path;

  // Send to Brevo
  brevoSubmit(email, guideInfo.path, guideInfo.templateId);

  sessionStorage.setItem('lm_closed', '1');
  setTimeout(closeLM, 5000);
}

// Allow Enter key in email field
(function() {
  var emailField = document.getElementById('lmEmail');
  if (emailField) {
    emailField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') submitLM();
    });
  }
})();

// Guide popup logic for CTA buttons
function openGuideOrPopup(e, guideKey) {
  if (e) e.preventDefault();
  var key = guideKey || defaultGuideKey;
  var guideInfo = getGuideInfo(key);

  // If user already submitted email — open guide directly
  if (localStorage.getItem('lm_email')) {
    window.open(guideInfo.path, '_blank');
    // Still send email for this guide
    brevoSubmit(localStorage.getItem('lm_email'), guideInfo.path, guideInfo.templateId);
    return;
  }
  // Otherwise show popup for this guide
  var overlay = document.getElementById('lmOverlay');
  if (overlay) {
    overlay.dataset.guide = key;
    updatePopupContent(key);
    // Reset form state
    document.getElementById('lmFormState').style.display = 'block';
    document.getElementById('lmSuccess').style.display = 'none';
    overlay.classList.add('active');
  }
}

// Attach to the guide CTA link if present
(function() {
  var ctaLink = document.querySelector('.cta-link');
  if (ctaLink) {
    ctaLink.addEventListener('click', openGuideOrPopup);
  }
})();
