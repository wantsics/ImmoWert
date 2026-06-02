export const APP_VERSION = 'V0.2.13';
export const APP_LABEL = `LAB7784 Immowert ${APP_VERSION}`;

function setVisibleAppVersion() {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = document.getElementById('fixedAppVersionBadge');
  if (badge) {
    badge.textContent = APP_LABEL;
    badge.setAttribute('aria-label', `App-Version ${APP_LABEL}`);
  }

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

function installVisibleAppVersion() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.IMMOWERT_APP_VERSION = APP_VERSION;
  window.IMMOWERT_APP_LABEL = APP_LABEL;
  window.setImmowertAppVersion = setVisibleAppVersion;

  setVisibleAppVersion();

  document.addEventListener('DOMContentLoaded', setVisibleAppVersion);

  [0, 50, 100, 300, 700, 1200, 1800, 2600, 4000, 6000].forEach((delay) => {
    window.setTimeout(setVisibleAppVersion, delay);
  });
}

installVisibleAppVersion();
