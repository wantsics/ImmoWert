export const APP_VERSION = 'V0.2.17';
export const APP_LABEL = `LAB7784 Immowert ${APP_VERSION}`;

let applying = false;

function setVisibleAppVersion() {
  if (typeof document === 'undefined' || applying) return;
  applying = true;

  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    if (element.textContent !== APP_LABEL) element.textContent = APP_LABEL;
  });

  const badge = document.getElementById('fixedAppVersionBadge');
  if (badge) {
    if (badge.textContent !== APP_LABEL) badge.textContent = APP_LABEL;
    badge.setAttribute('aria-label', `App-Version ${APP_LABEL}`);
  }

  const title = `${APP_LABEL} – Analyse & Datenerhebung`;
  if (document.title !== title) document.title = title;

  applying = false;
}

function installVersionObserver() {
  if (typeof MutationObserver === 'undefined') return;
  if (window.__immowertVersionObserverInstalled) return;
  window.__immowertVersionObserverInstalled = true;

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(setVisibleAppVersion);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function installVisibleAppVersion() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.IMMOWERT_APP_VERSION = APP_VERSION;
  window.IMMOWERT_APP_LABEL = APP_LABEL;
  window.setImmowertAppVersion = setVisibleAppVersion;

  setVisibleAppVersion();
  installVersionObserver();

  document.addEventListener('DOMContentLoaded', () => {
    setVisibleAppVersion();
    installVersionObserver();
  });

  [0, 25, 50, 100, 200, 300, 700, 1200, 1800, 2600, 4000, 6000, 8000].forEach(
    (delay) => {
      window.setTimeout(setVisibleAppVersion, delay);
    },
  );
}

installVisibleAppVersion();
