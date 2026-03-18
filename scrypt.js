// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');

if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
          const isOpen = mobileNav.classList.toggle('open');
          navToggle.setAttribute('aria-expanded', String(isOpen));
          mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });

  // Close menu on link click
  mobileNav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
        });
  });
}

// Bio accordion
const bioToggle = document.getElementById('bioToggle');
const bio = document.getElementById('bio');

if (bioToggle && bio) {
    bioToggle.addEventListener('click', () => {
          const isOpen = bio.classList.toggle('is-open');
          bioToggle.textContent = isOpen ? 'Hide full bio' : 'Read full bio';
          bioToggle.setAttribute('aria-expanded', String(isOpen));
          bio.setAttribute('aria-hidden', String(!isOpen));
    });
}

// Symptom reveals
document.querySelectorAll('[data-reveal]').forEach((btn) => {
    btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-reveal');
          const panel = document.getElementById(id);
          if (!panel) return;

                             const isOpen = panel.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(isOpen));
          panel.setAttribute('aria-hidden', String(!isOpen));
          btn.textContent = isOpen ? 'Hide' : 'What we check';
    });
});

// Form: character counter + demo submit (no backend)
const form = document.getElementById('enquiryForm');
const textarea = form?.querySelector('textarea[name="message"]');
const counter = document.getElementById('counter');
const note = document.getElementById('formNote');

if (textarea && counter) {
    const update = () => {
          counter.textContent = `${textarea.value.length}/400`;
    };
    textarea.addEventListener('input', update);
    update();
}

if (form && note) {
    form.addEventListener('submit', (e) => {
          e.preventDefault();
          note.textContent =
                  'Thank you. Your enquiry is prepared (demo). Connect this form to your email/CRM when ready.';
          form.reset();
          if (counter) counter.textContent = '0/400';
          setTimeout(() => (note.textContent = ''), 5000);
    });
}

// Footer year
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
