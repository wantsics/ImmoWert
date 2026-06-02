function ensureMobileStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[href="mobile.css"]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'mobile.css';
  document.head.appendChild(link);
}

ensureMobileStylesheet();

document.addEventListener('DOMContentLoaded', ensureMobileStylesheet);
