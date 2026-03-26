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

// Guide path and email template based on page language
var pageLang = document.documentElement.lang || 'ru';
var guidePath, guideTemplateId;

if (pageLang === 'cs') {
  guidePath = '/cz/guides/5-analyzu.html';
  guideTemplateId = 2;  // Czech Brevo template — update ID after creating
} else {
  guidePath = '/guide-5-analizov.html';
  guideTemplateId = 1;  // Russian Brevo template
}

// Subscribe: add contact to list + send guide email
function brevoSubmit(email) {
  var guideLink = window.location.origin + guidePath;

  fetch(API_URL + '/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, guide_link: guideLink, template_id: guideTemplateId, lang: pageLang })
  }).catch(function(err) {
    console.log('Subscribe error:', err);
  });
}

// Show popup
var lmShown = false;
function showLM() {
  if (lmShown || sessionStorage.getItem('lm_closed')) return;
  // Don't show if user already submitted email
  if (localStorage.getItem('lm_email')) return;
  lmShown = true;
  var overlay = document.getElementById('lmOverlay');
  if (overlay) overlay.classList.add('active');
}

// Timer: show after 10s
setTimeout(showLM, 10000);

// Exit intent (desktop only)
document.addEventListener('mouseout', function(e) {
  if (e.clientY < 5 && !e.relatedTarget) showLM();
});

function closeLM() {
  var overlay = document.getElementById('lmOverlay');
  if (overlay) overlay.classList.remove('active');
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

  // Save email so guide opens directly next time
  localStorage.setItem('lm_email', email);

  // Open guide immediately
  window.open(guidePath, '_blank');

  // Show success state
  document.getElementById('lmFormState').style.display = 'none';
  document.getElementById('lmSuccess').style.display = 'block';

  // Send to Brevo: add to list + send guide email
  brevoSubmit(email);

  sessionStorage.setItem('lm_closed', '1');

  // Auto-close popup after 5 seconds
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

// Guide popup logic for results page CTA
function openGuideOrPopup(e) {
  if (e) e.preventDefault();
  // If user already submitted email before - open guide directly
  if (localStorage.getItem('lm_email')) {
    window.open(guidePath, '_blank');
    return;
  }
  // Otherwise show popup
  var overlay = document.getElementById('lmOverlay');
  if (overlay) overlay.classList.add('active');
}

// Attach to the guide CTA link if present
(function() {
  var ctaLink = document.querySelector('.cta-link');
  if (ctaLink) {
    ctaLink.addEventListener('click', openGuideOrPopup);
  }
})();
