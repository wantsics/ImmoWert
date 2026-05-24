function switchView(viewName) {
  document.querySelectorAll('[data-view]').forEach(view => {
    view.classList.toggle('active', view.dataset.view === viewName);
  });

  document.querySelectorAll('[data-switch-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.switchView === viewName);
  });
}

function injectRndMethodSelector() {
  if (document.getElementById('rndMethodSelector')) return;
  const modernContainer = document.getElementById('modernizationContainer');
  if (!modernContainer) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'rndMethodSelector';
  wrapper.className = 'rnd-method-selector full-width';
  wrapper.innerHTML = `
    <div class="section-title-inline">
      <strong>RND-Ermittlung</strong>
      <small>Tabellenverfahren als Standard, Formel nur als Fallback</small>
    </div>
    <div class="method-radio-list">
      <label class="method-radio">
        <input type="radio" name="rndMethod" value="table" checked>
        <span><strong>Tabellenverfahren ImmoWertA</strong><small>Alter + GND + Modernisierungspunkte → Tabellenwert</small></span>
      </label>
      <label class="method-radio">
        <input type="radio" name="rndMethod" value="formula">
        <span><strong>Formel / Näherung</strong><small>Nur verwenden, wenn keine passende Tabelle hinterlegt ist</small></span>
      </label>
    </div>
  `;
  modernContainer.parentNode.insertBefore(wrapper, modernContainer);
  wrapper.querySelectorAll('input[name="rndMethod"]').forEach(input => {
    input.addEventListener('change', () => {
      localStorage.setItem('immowert-rnd-method', input.value);
      if (typeof update === 'function') update();
    });
  });
  const saved = localStorage.getItem('immowert-rnd-method') || 'table';
  const selected = wrapper.querySelector(`input[name="rndMethod"][value="${saved}"]`);
  if (selected) selected.checked = true;
}

function injectRadioAlignmentCss() {
  if (document.getElementById('radioAlignmentCss')) return;
  const style = document.createElement('style');
  style.id = 'radioAlignmentCss';
  style.textContent = `
    .yield-radio,
    .method-radio {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid #dbeafe;
      border-radius: 12px;
      background: #f8fafc;
      cursor: pointer;
    }
    .method-radio { grid-template-columns: 22px minmax(0, 1fr); }
    .yield-radio input,
    .method-radio input {
      width: 16px;
      height: 16px;
      margin: 0;
      padding: 0;
      align-self: center;
    }
    .yield-radio span,
    .method-radio span {
      min-width: 0;
      line-height: 1.25;
    }
    .method-radio span {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .method-radio small {
      color: #64748b;
      font-size: 12px;
    }
    .yield-radio strong {
      justify-self: end;
      white-space: nowrap;
    }
    .yield-radio-list,
    .method-radio-list {
      display: grid;
      gap: 8px;
    }
    .rnd-method-selector {
      margin: 0 0 14px 0;
      padding: 12px;
      border: 1px solid #bae6fd;
      border-radius: 14px;
      background: #f0f9ff;
    }
  `;
  document.head.appendChild(style);
}

function installRndTableOverride() {
  if (window.__rndTableOverrideInstalled || typeof calculateModifiedRND !== 'function') return;
  window.__rndTableOverrideInstalled = true;
  const formulaCalculateModifiedRND = calculateModifiedRND;
  const rndTableGnd80 = {
    68:[16,16,19,21,24,27,29,32,34,36,39,41,43,45,48,50,52,55,57,57,57],
    69:[15,15,18,21,24,26,29,31,34,36,38,41,43,45,47,50,52,55,57,57,57],
    70:[15,15,18,21,23,26,29,31,34,36,38,40,43,45,47,50,52,54,57,57,57],
    71:[14,14,17,20,23,26,28,31,33,36,38,40,43,45,47,50,52,54,57,57,57],
    72:[14,14,17,20,23,25,28,31,33,36,38,40,42,45,47,49,52,54,57,57,57],
    73:[14,14,17,20,23,25,28,30,33,35,38,40,42,45,47,49,52,54,57,57,57],
    74:[13,13,16,19,22,25,28,30,33,35,37,40,42,44,47,49,52,54,56,56,56],
    75:[13,13,16,19,22,25,27,30,33,35,37,40,42,44,47,49,52,54,56,56,56],
    76:[13,13,16,19,22,25,27,30,33,35,37,40,42,44,47,49,51,54,56,56,56],
    77:[13,13,16,19,22,24,27,30,32,35,37,39,42,44,47,49,51,54,56,56,56],
    78:[12,12,15,18,22,24,27,30,32,35,37,39,42,44,46,49,51,54,56,56,56],
    79:[12,12,15,18,21,24,27,29,32,34,37,39,42,44,46,49,51,54,56,56,56],
    80:[12,12,15,18,21,24,27,29,32,34,37,39,41,44,46,49,51,54,56,56,56]
  };
  function lookupTable(gnd, tableAge, points) {
    if (Number(gnd) !== 80) return null;
    const age = Math.max(68, Math.min(80, Math.round(tableAge)));
    const p = Math.max(0, Math.min(20, Math.round(points)));
    return { rnd: rndTableGnd80[age][p], age, points: p };
  }
  calculateModifiedRND = function(d) {
    const method = document.querySelector('input[name="rndMethod"]:checked')?.value || localStorage.getItem('immowert-rnd-method') || 'table';
    if (method === 'formula') {
      const result = formulaCalculateModifiedRND(d);
      result.info = result.info.replace('RND transparent:', 'RND transparent: Methode Formel/Näherung;');
      return result;
    }
    const gnd = Math.max(1, Number(d.totalUsefulLife) || 80);
    const realAge = buildingAge(d);
    const tableAge = Math.min(realAge, gnd);
    const baseRnd = Math.max(0, gnd - realAge);
    const points = Math.max(0, Math.min(20, modernizationPoints()));
    const lookup = lookupTable(gnd, tableAge, points);
    if (!lookup) {
      const result = formulaCalculateModifiedRND(d);
      result.info = `RND transparent: Methode Tabellenverfahren gewählt, aber für GND ${gnd} ist noch keine Tabelle hinterlegt. Fallback auf Formel/Näherung. ${result.info}`;
      return result;
    }
    return {
      gnd,
      realAge,
      tableAge,
      baseRnd,
      points,
      rnd: lookup.rnd,
      info: `RND transparent: Methode Tabellenverfahren ImmoWertA; Bewertungsjahr ${getYearFromDate(d.valuationDate)}; Baujahr ${d.constructionYear || '–'}; reales Gebäudealter ${realAge} J.; GND ${gnd} J.; Basis-RND = max(0, ${gnd} − ${realAge}) = ${baseRnd} J.; Tabellenalter = ${lookup.age} J.; Modernisierung ${lookup.points}/20 Punkte; ImmoWertA Anlage 2 Tabelle b → modifizierte RND = ${lookup.rnd} J.`
    };
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-switch-view]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.switchView));
  });
  injectRadioAlignmentCss();
  injectRndMethodSelector();
  installRndTableOverride();
  if (typeof update === 'function') update();
});
