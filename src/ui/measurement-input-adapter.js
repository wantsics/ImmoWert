const VERSION = 'V0.2.18';
const APP_LABEL = `LAB7784 Immowert ${VERSION}`;

let installed = false;
let iframeLoadAttached = false;

function setVisibleVersion() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.ribbon-eyebrow, .hero .eyebrow').forEach((element) => {
    element.textContent = APP_LABEL;
  });
  const badge = document.getElementById('fixedAppVersionBadge');
  if (badge) badge.textContent = APP_LABEL;
}

function eventPointInCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
}

function dispatchMouse(canvas, type, event, detail = 1) {
  const mouse = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: canvas.ownerDocument.defaultView,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
    button: 0,
    buttons: type === 'mouseup' || type === 'click' || type === 'dblclick' ? 0 : 1,
    detail,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  });
  canvas.dispatchEvent(mouse);
}

function setInputMode(frameDocument, mode, label = '') {
  frameDocument.documentElement.dataset.inputMode = mode;
  frameDocument.body.dataset.inputMode = mode;

  const chip = frameDocument.getElementById('input-mode-chip');
  if (chip) {
    const labels = {
      pen: '✎ Pencil',
      touch: '☝ Touch',
      mouse: '⌁ Maus',
      keyboard: '⌨ Tastatur',
    };
    chip.textContent = `Eingabe: ${label || labels[mode] || mode}`;
  }

  const parentChip = document.getElementById('measurement-input-chip');
  if (parentChip) parentChip.textContent = `Datenerhebung: ${label || mode}`;
}

function ensureFrameUi(frameDocument) {
  if (!frameDocument.getElementById('measurementInputAdapterCss')) {
    const style = frameDocument.createElement('style');
    style.id = 'measurementInputAdapterCss';
    style.textContent = `
      #canvas {
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }
      #canvas-wrap {
        -webkit-user-select: none;
        user-select: none;
        overscroll-behavior: contain;
      }
      #input-mode-chip {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 3px 8px;
        border-radius: 999px;
        border: 1px solid #4b5563;
        background: #111827;
        color: #93c5fd;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }
      html[data-input-mode='pen'] #input-mode-chip {
        color: #facc15;
        border-color: #ca8a04;
      }
      html[data-input-mode='touch'] #input-mode-chip {
        color: #86efac;
        border-color: #16a34a;
      }
      @media (pointer: coarse), (max-width: 900px) {
        #toolbar {
          gap: 7px;
          padding: 7px 8px;
          overflow-x: auto;
          flex-wrap: nowrap;
          -webkit-overflow-scrolling: touch;
        }
        .btn {
          min-height: 34px;
          padding: 7px 10px;
        }
        #sidebar {
          width: 250px;
          min-width: 250px;
        }
        .meas-item {
          min-height: 38px;
        }
        .prop-input {
          min-height: 32px;
          font-size: 14px;
        }
      }
      @media (max-width: 760px) {
        #main {
          flex-direction: column;
        }
        #sidebar {
          width: 100%;
          min-width: 0;
          max-height: 36vh;
          border-left: 0;
          border-top: 1px solid #374151;
        }
        #canvas-wrap {
          min-height: 52vh;
        }
        #statusbar {
          display: none;
        }
      }
    `;
    frameDocument.head.appendChild(style);
  }

  const toolbar = frameDocument.getElementById('toolbar');
  if (toolbar && !frameDocument.getElementById('input-mode-chip')) {
    const chip = frameDocument.createElement('span');
    chip.id = 'input-mode-chip';
    chip.textContent = 'Eingabe: Auto';
    const spacer = toolbar.querySelector('.spacer');
    toolbar.insertBefore(chip, spacer || toolbar.firstChild);
  }
}

function installParentUi() {
  if (document.getElementById('measurement-input-chip')) return;
  const section = document.querySelector('[data-view="measurement"] .measurement-card');
  if (!section) return;
  const chip = document.createElement('div');
  chip.id = 'measurement-input-chip';
  chip.style.cssText = [
    'margin-top:10px',
    'padding:7px 9px',
    'border-radius:999px',
    'background:#0f172a',
    'border:1px solid rgba(255,255,255,0.12)',
    'color:#93c5fd',
    'font-size:12px',
    'font-weight:700',
  ].join(';');
  chip.textContent = 'Datenerhebung: Auto';
  section.appendChild(chip);
}

function installFrameAdapter(frame) {
  let frameDocument;
  try {
    frameDocument = frame.contentDocument || frame.contentWindow?.document;
  } catch {
    return;
  }
  if (!frameDocument || frameDocument.__immowertInputAdapterInstalled) return;

  const canvas = frameDocument.getElementById('canvas');
  if (!canvas) return;

  frameDocument.__immowertInputAdapterInstalled = true;
  ensureFrameUi(frameDocument);
  installParentUi();

  let activePenId = null;
  let penDown = null;
  let lastPenTap = null;

  const cancelNative = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const handlePenDown = (event) => {
    if (event.pointerType !== 'pen') return;
    setInputMode(frameDocument, 'pen', '✎ Pencil');
    activePenId = event.pointerId;
    penDown = { ...eventPointInCanvas(canvas, event), time: Date.now() };
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Safari may ignore setPointerCapture in some iframe contexts.
    }
    cancelNative(event);
    dispatchMouse(canvas, 'mousemove', event);
    dispatchMouse(canvas, 'mousedown', event);
  };

  const handlePenMove = (event) => {
    if (event.pointerType !== 'pen') return;
    setInputMode(frameDocument, 'pen', '✎ Pencil');
    cancelNative(event);
    dispatchMouse(canvas, 'mousemove', event);
  };

  const handlePenUp = (event) => {
    if (event.pointerType !== 'pen' || activePenId !== event.pointerId) return;
    setInputMode(frameDocument, 'pen', '✎ Pencil');
    cancelNative(event);
    dispatchMouse(canvas, 'mouseup', event);

    const point = eventPointInCanvas(canvas, event);
    const moved = penDown ? Math.hypot(point.offsetX - penDown.offsetX, point.offsetY - penDown.offsetY) : 0;
    const duration = penDown ? Date.now() - penDown.time : 0;
    const isTap = moved < 8 && duration < 650;

    if (isTap) {
      const now = Date.now();
      const isDoubleTap =
        lastPenTap &&
        now - lastPenTap.time < 420 &&
        Math.hypot(point.offsetX - lastPenTap.offsetX, point.offsetY - lastPenTap.offsetY) < 18;

      dispatchMouse(canvas, 'click', event, isDoubleTap ? 2 : 1);
      if (isDoubleTap) dispatchMouse(canvas, 'dblclick', event, 2);
      lastPenTap = { ...point, time: now };
    }

    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    activePenId = null;
    penDown = null;
  };

  const handlePointerCancel = (event) => {
    if (event.pointerType !== 'pen') return;
    activePenId = null;
    penDown = null;
  };

  canvas.addEventListener('pointerdown', handlePenDown, { capture: true, passive: false });
  canvas.addEventListener('pointermove', handlePenMove, { capture: true, passive: false });
  canvas.addEventListener('pointerup', handlePenUp, { capture: true, passive: false });
  canvas.addEventListener('pointercancel', handlePointerCancel, { capture: true, passive: false });

  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse') setInputMode(frameDocument, 'mouse', '⌁ Maus');
      if (event.pointerType === 'touch') setInputMode(frameDocument, 'touch', '☝ Touch');
    },
    { passive: true },
  );

  frameDocument.addEventListener(
    'keydown',
    () => {
      setInputMode(frameDocument, 'keyboard', '⌨ Tastatur');
    },
    { passive: true },
  );
}

function findMeasurementFrame() {
  return document.querySelector('iframe.measurement-frame');
}

function installMeasurementInputAdapter() {
  if (installed) return;
  installed = true;

  const tryInstall = () => {
    setVisibleVersion();
    const frame = findMeasurementFrame();
    if (!frame) return;
    installParentUi();
    installFrameAdapter(frame);
    if (!iframeLoadAttached) {
      iframeLoadAttached = true;
      frame.addEventListener('load', () => window.setTimeout(() => installFrameAdapter(frame), 80));
    }
  };

  document.addEventListener('DOMContentLoaded', tryInstall);
  document.addEventListener('click', tryInstall);
  [0, 100, 500, 1200, 2500, 5000].forEach((delay) => window.setTimeout(tryInstall, delay));
}

installMeasurementInputAdapter();
