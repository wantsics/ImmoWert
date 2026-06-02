const VERSION = 'V0.2.17';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

function $(id) {
  return document.getElementById(id);
}

function setVersionLabel() {
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });

  const badge = $('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;

  document.title = `${APP_LABEL} – Analyse & Datenerhebung`;
}

function installMobileLayoutCss() {
  if ($('mobileLayoutCss')) return;

  const style = document.createElement('style');
  style.id = 'mobileLayoutCss';
  style.textContent = `
    @media (max-width: 760px) {
      html,
      body {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
      }

      body {
        background: #e0f2fe;
      }

      .top-ribbon {
        height: auto;
        min-height: 56px;
        padding: 10px 12px;
        gap: 10px;
        align-items: flex-start;
        flex-direction: column;
      }

      .ribbon-brand {
        min-width: 0;
        width: 100%;
      }

      .ribbon-eyebrow {
        font-size: 10px;
        letter-spacing: 0.08em;
        overflow-wrap: anywhere;
      }

      .ribbon-brand strong {
        font-size: 15px;
        line-height: 1.2;
      }

      .ribbon-tabs {
        width: 100%;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 2px;
        -webkit-overflow-scrolling: touch;
      }

      .ribbon-tab {
        flex: 0 0 auto;
        min-height: 40px;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 14px;
      }

      .workspace {
        height: calc(100vh - 112px);
      }

      .app {
        padding: 12px;
        max-width: 100%;
      }

      .hero {
        gap: 12px;
        margin-bottom: 14px;
      }

      h1 {
        font-size: 28px;
        line-height: 1.08;
        overflow-wrap: anywhere;
      }

      .subline {
        font-size: 14px;
        margin-bottom: 0;
      }

      .hero-card {
        min-width: 0;
        width: 100%;
        padding: 14px;
        border-radius: 14px;
      }

      .hero-card strong {
        font-size: 26px;
        line-height: 1.1;
        overflow-wrap: anywhere;
      }

      .layout,
      .grid,
      .grid.two,
      .grid.three,
      .section-body.grid,
      .section-body.grid.two,
      .section-body.grid.three,
      .history-row,
      .modernization-row {
        grid-template-columns: minmax(0, 1fr) !important;
      }

      .layout {
        gap: 12px;
      }

      .panel {
        padding: 14px;
        border-radius: 14px;
      }

      .results-panel {
        position: static;
        order: -1;
      }

      details.section,
      .source-subsection,
      .history-block,
      .unit-card,
      .yield-radio-block,
      .land-value-result-block {
        border-radius: 12px !important;
      }

      .section > summary,
      .source-subsection > summary {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 4px;
        align-items: start;
        padding: 12px 0;
      }

      .section > summary strong,
      .source-subsection > summary strong,
      [data-workflow-summary] {
        text-align: left !important;
        white-space: normal !important;
        overflow-wrap: anywhere;
        font-size: 13px;
        line-height: 1.35;
      }

      label {
        gap: 6px;
        min-width: 0;
      }

      input,
      select,
      textarea,
      button {
        min-height: 44px;
        font-size: 16px;
      }

      input,
      select,
      textarea {
        padding: 11px 12px;
        border-radius: 10px;
      }

      button {
        width: 100%;
        justify-content: center;
      }

      .button-row,
      .top-actions,
      .section-title-inline,
      .unit-head {
        align-items: stretch;
        gap: 8px;
      }

      .button-row > *,
      .top-actions > * {
        width: 100%;
      }

      .history-row {
        gap: 8px;
      }

      .result-list div {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 4px;
        padding: 10px 0;
      }

      .result-list strong {
        text-align: left;
        font-size: 17px;
        overflow-wrap: anywhere;
      }

      .modernization-row {
        gap: 8px;
        padding: 10px;
      }

      .modernization-label {
        align-items: flex-start;
      }

      .modernization-control input[type='range'] {
        width: 100%;
        min-height: 32px;
      }

      .yield-radio-block {
        padding: 10px !important;
      }

      .yield-radio-title {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr);
        gap: 3px !important;
      }

      .yield-radio-row {
        grid-template-columns: minmax(0, 1fr) auto 18px !important;
        min-height: 40px !important;
        padding: 7px 9px !important;
        gap: 8px !important;
      }

      .yield-radio-label {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        line-height: 1.25;
      }

      .yield-radio-rate {
        font-size: 14px;
      }

      .info-tooltip {
        width: 18px;
        min-width: 18px;
        height: 18px;
      }

      .info-tooltip:hover::after {
        position: fixed;
        left: 12px !important;
        right: 12px !important;
        top: 72px !important;
        width: auto !important;
        max-width: none !important;
        transform: none !important;
        z-index: 1000000;
      }

      .info-tooltip:hover::before {
        display: none;
      }

      #fixedAppVersionBadge {
        right: 8px !important;
        bottom: 8px !important;
        max-width: calc(100vw - 16px);
        padding: 4px 8px !important;
        font-size: 10px !important;
        opacity: 0.9;
      }
    }

    @media (max-width: 420px) {
      .workspace {
        height: calc(100vh - 122px);
      }

      .app {
        padding: 8px;
      }

      .panel {
        padding: 12px;
      }

      h1 {
        font-size: 24px;
      }

      .hero-card strong {
        font-size: 23px;
      }

      .ribbon-tab {
        font-size: 13px;
        padding: 8px 10px;
      }
    }
  `;
  document.head.appendChild(style);
}

function installMobileLayout() {
  installMobileLayoutCss();
  setVersionLabel();
  [0, 100, 500, 1200, 2500].forEach((delay) => window.setTimeout(setVersionLabel, delay));
}

installMobileLayout();
