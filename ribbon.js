function switchView(viewName) {
  document.querySelectorAll('[data-view]').forEach(view => {
    view.classList.toggle('active', view.dataset.view === viewName);
  });
  document.querySelectorAll('[data-switch-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.switchView === viewName);
  });
}

let bogItems = JSON.parse(localStorage.getItem('immowert-bog-items') || '[]');
function saveBogItems() { localStorage.setItem('immowert-bog-items', JSON.stringify(bogItems)); }
function sumBogItems(type) { return bogItems.filter(i => i.type === type).reduce((s, i) => s + (Number(i.amount) || 0), 0); }
function syncBogTotals() {
  if (typeof setValue !== 'function') return;
  setValue('bogAdditions', sumBogItems('add'));
  setValue('bogDeductions', sumBogItems('deduct'));
}

function injectBogList() {
  if (document.getElementById('bogItemsContainer')) return;
  const deduction = document.getElementById('bogDeductions');
  const addition = document.getElementById('bogAdditions');
  const body = deduction?.closest('.section-body');
  if (!body || !deduction || !addition) return;
  deduction.closest('label').style.display = 'none';
  addition.closest('label').style.display = 'none';
  const wrapper = document.createElement('div');
  wrapper.className = 'bog-list-block full-width';
  wrapper.innerHTML = `
    <div class="section-title-inline">
      <strong>boG-Einzelpositionen <span class="info-tooltip" data-tooltip="boG = besondere objektspezifische Grundstücksmerkmale. Einzelpositionen werden als Zuschlag oder Abschlag erfasst und am Ende saldiert: boG = Summe Zuschläge − Summe Abschläge.">i</span></strong>
      <button type="button" id="addBogItem">+ boG hinzufügen</button>
    </div>
    <div id="bogItemsContainer" class="bog-items"></div>
    <p class="hint" id="bogItemsSummary">–</p>
  `;
  body.appendChild(wrapper);
  renderBogItems();
}

function renderBogItems() {
  const container = document.getElementById('bogItemsContainer');
  if (!container) return;
  container.innerHTML = bogItems.map((item, index) => `
    <div class="bog-row">
      <label>Art
        <select data-bog-index="${index}" data-bog-field="type">
          <option value="deduct" ${item.type === 'deduct' ? 'selected' : ''}>Abschlag</option>
          <option value="add" ${item.type === 'add' ? 'selected' : ''}>Zuschlag</option>
        </select>
      </label>
      <label>Betrag
        <input type="number" min="0" step="1000" value="${item.amount || 0}" data-bog-index="${index}" data-bog-field="amount" />
      </label>
      <label>Kommentar
        <input value="${(item.comment || '').replaceAll('"', '&quot;')}" placeholder="z. B. Sanierungsstau Dach / Ausbaureserve DG" data-bog-index="${index}" data-bog-field="comment" />
      </label>
      <button type="button" data-remove-bog="${index}">Entfernen</button>
    </div>
  `).join('');
  updateBogSummary();
}

function updateBogSummary() {
  syncBogTotals();
  const summary = document.getElementById('bogItemsSummary');
  if (!summary) return;
  const add = sumBogItems('add');
  const deduct = sumBogItems('deduct');
  summary.textContent = `boG saldiert: Zuschläge ${fmtEuro(add)} − Abschläge ${fmtEuro(deduct)} = ${fmtEuro(add - deduct)}`;
}

function injectRndMethodSelector() {
  if (document.getElementById('rndMethodSelector')) return;
  const modernContainer = document.getElementById('modernizationContainer');
  if (!modernContainer) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'rndMethodSelector';
  wrapper.className = 'rnd-method-selector full-width';
  wrapper.innerHTML = `
    <div class="section-title-inline"><strong>RND-Ermittlung</strong><small>Tabellenverfahren als Standard, Formel nur als Fallback</small></div>
    <div class="method-radio-list">
      <label class="method-radio"><input type="radio" name="rndMethod" value="table" checked><span><strong>Tabellenverfahren ImmoWertA</strong><small>Alter + GND + Modernisierungspunkte → Tabellenwert</small></span></label>
      <label class="method-radio"><input type="radio" name="rndMethod" value="formula"><span><strong>Formel / Näherung</strong><small>Nur verwenden, wenn keine passende Tabelle hinterlegt ist</small></span></label>
    </div>`;
  modernContainer.parentNode.insertBefore(wrapper, modernContainer);
  wrapper.querySelectorAll('input[name="rndMethod"]').forEach(input => input.addEventListener('change', () => {
    localStorage.setItem('immowert-rnd-method', input.value);
    if (typeof update === 'function') update();
    setTimeout(updateResultTooltips, 0);
  }));
  const saved = localStorage.getItem('immowert-rnd-method') || 'table';
  const selected = wrapper.querySelector(`input[name="rndMethod"][value="${saved}"]`);
  if (selected) selected.checked = true;
}

function injectRadioAlignmentCss() {
  if (document.getElementById('radioAlignmentCss')) return;
  const style = document.createElement('style');
  style.id = 'radioAlignmentCss';
  style.textContent = `
    .yield-radio,.method-radio{display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 12px;border:1px solid #dbeafe;border-radius:12px;background:#f8fafc;cursor:pointer}.method-radio{grid-template-columns:22px minmax(0,1fr)}.yield-radio input,.method-radio input{width:16px;height:16px;margin:0;padding:0;align-self:center}.yield-radio span,.method-radio span{min-width:0;line-height:1.25}.method-radio span{display:flex;flex-direction:column;gap:3px}.method-radio small{color:#64748b;font-size:12px}.yield-radio strong{justify-self:end;white-space:nowrap}.yield-radio-list,.method-radio-list{display:grid;gap:8px}.rnd-method-selector,.bog-list-block{margin:0 0 14px 0;padding:12px;border:1px solid #bae6fd;border-radius:14px;background:#f0f9ff}.result-list div span:first-child{display:inline-flex;align-items:center;gap:4px}.result-info{flex:0 0 auto;margin-left:4px}.bog-items{display:grid;gap:10px}.bog-row{display:grid;grid-template-columns:150px 150px minmax(0,1fr) auto;gap:10px;align-items:end;padding:12px;border:1px solid #dbeafe;border-radius:12px;background:white}.bog-row button{height:44px}@media(max-width:900px){.bog-row{grid-template-columns:1fr}.bog-row button{height:auto}}
  `;
  document.head.appendChild(style);
}

function installRndTableOverride() {
  if (window.__rndTableOverrideInstalled || typeof calculateModifiedRND !== 'function') return;
  window.__rndTableOverrideInstalled = true;
  const formulaCalculateModifiedRND = calculateModifiedRND;
  const rndTableGnd80 = {
    68:[16,16,19,21,24,27,29,32,34,36,39,41,43,45,48,50,52,55,57,57,57],69:[15,15,18,21,24,26,29,31,34,36,38,41,43,45,47,50,52,55,57,57,57],70:[15,15,18,21,23,26,29,31,34,36,38,40,43,45,47,50,52,54,57,57,57],71:[14,14,17,20,23,26,28,31,33,36,38,40,43,45,47,50,52,54,57,57,57],72:[14,14,17,20,23,25,28,31,33,36,38,40,42,45,47,49,52,54,57,57,57],73:[14,14,17,20,23,25,28,30,33,35,38,40,42,45,47,49,52,54,57,57,57],74:[13,13,16,19,22,25,28,30,33,35,37,40,42,44,47,49,52,54,56,56,56],75:[13,13,16,19,22,25,27,30,33,35,37,40,42,44,47,49,52,54,56,56,56],76:[13,13,16,19,22,25,27,30,33,35,37,40,42,44,47,49,51,54,56,56,56],77:[13,13,16,19,22,24,27,30,32,35,37,39,42,44,47,49,51,54,56,56,56],78:[12,12,15,18,22,24,27,30,32,35,37,39,42,44,46,49,51,54,56,56,56],79:[12,12,15,18,21,24,27,29,32,34,37,39,42,44,46,49,51,54,56,56,56],80:[12,12,15,18,21,24,27,29,32,34,37,39,41,44,46,49,51,54,56,56,56]
  };
  function lookupTable(gnd, tableAge, points) { if (Number(gnd) !== 80) return null; const age = Math.max(68, Math.min(80, Math.round(tableAge))); const p = Math.max(0, Math.min(20, Math.round(points))); return { rnd: rndTableGnd80[age][p], age, points: p }; }
  calculateModifiedRND = function(d) {
    const method = document.querySelector('input[name="rndMethod"]:checked')?.value || localStorage.getItem('immowert-rnd-method') || 'table';
    if (method === 'formula') { const result = formulaCalculateModifiedRND(d); result.info = result.info.replace('RND transparent:', 'RND transparent: Methode Formel/Näherung;'); return result; }
    const gnd = Math.max(1, Number(d.totalUsefulLife) || 80), realAge = buildingAge(d), tableAge = Math.min(realAge, gnd), baseRnd = Math.max(0, gnd - realAge), points = Math.max(0, Math.min(20, modernizationPoints())), lookup = lookupTable(gnd, tableAge, points);
    if (!lookup) { const result = formulaCalculateModifiedRND(d); result.info = `RND transparent: Methode Tabellenverfahren gewählt, aber für GND ${gnd} ist noch keine Tabelle hinterlegt. Fallback auf Formel/Näherung. ${result.info}`; return result; }
    return { gnd, realAge, tableAge, baseRnd, points, rnd: lookup.rnd, info: `RND transparent: Methode Tabellenverfahren ImmoWertA; Bewertungsjahr ${getYearFromDate(d.valuationDate)}; Baujahr ${d.constructionYear || '–'}; reales Gebäudealter ${realAge} J.; GND ${gnd} J.; Basis-RND = max(0, ${gnd} − ${realAge}) = ${baseRnd} J.; Tabellenalter = ${lookup.age} J.; Modernisierung ${lookup.points}/20 Punkte; ImmoWertA Anlage 2 Tabelle b → modifizierte RND = ${lookup.rnd} J.` };
  };
}

function fmtEuro(v) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(v) || 0); }
function fmtNum(v, digits = 2) { return (Number(v) || 0).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
function fmtPercent(v) { return `${fmtNum(v, 2)} %`; }
function getCurrentCaseAndResult() { if (typeof readCase !== 'function' || typeof calculate !== 'function') return null; syncBogTotals(); const d = readCase(); const r = calculate(d); return { d, r }; }

function bogDetailText() {
  if (!bogItems.length) return 'Keine boG-Einzelpositionen erfasst.';
  return bogItems.map(i => `${i.type === 'add' ? '+' : '-'} ${fmtEuro(i.amount)}: ${i.comment || (i.type === 'add' ? 'Zuschlag' : 'Abschlag')}`).join('\n');
}

function buildResultExplanations(d, r) {
  const adjustedBrw=Number(r.adjustedBrw)||0, landValue=Number(r.landValue)||0, grossIncome=Number(r.grossIncome)||0, operatingCosts=Number(r.operatingCosts)||0, netIncome=Number(r.netIncome)||0, landInterest=Number(r.landInterest)||0, buildingIncome=Number(r.buildingIncome)||0, multiplier=Number(r.multiplier)||0, buildingValue=Number(r.buildingValue)||0, preliminaryIncomeValue=Number(r.preliminaryIncomeValue)||0, bogTotal=Number(r.bogTotal)||0, incomeValue=Number(r.incomeValue)||0, targetOffer=Number(r.targetOffer)||0, totalAcquisitionCost=Number(r.totalAcquisitionCost)||0, valueGap=Number(r.valueGap)||0, rentMultiplier=Number(r.rentMultiplier)||0, grossYield=Number(r.grossYield)||0, netYield=Number(r.netYield)||0;
  return {
    adjustedBrw:`Angepasster BRW = BRW × Zeitfaktor × WGFZ-/Lagefaktor\n${fmtEuro(d.baseLandValuePerSqm)}/m² × ${fmtNum(d.timeAdjustmentFactor,3)} × ${fmtNum(d.landFeatureFactor,2)} = ${fmtEuro(adjustedBrw)}/m²`,
    landValue:`Bodenwert = angepasster BRW × Bauland + angepasster BRW × Gartenfläche × Gartenfaktor\n${fmtEuro(adjustedBrw)}/m² × ${fmtNum(d.buildingLandArea,0)} m² + ${fmtEuro(adjustedBrw)}/m² × ${fmtNum(d.gardenArea,0)} m² × ${fmtNum(d.gardenFactor,2)} = ${fmtEuro(landValue)}`,
    grossIncome:`Jahresrohertrag = Summe aller Einheiten\nEinheiten: ${d.units.length}\nSumme = ${fmtEuro(grossIncome)} pro Jahr`,
    operatingCosts:`Bewirtschaftungskosten = Jahresrohertrag × Kostenquote\n${fmtEuro(grossIncome)} × ${fmtPercent(d.operatingCostRate)} = ${fmtEuro(operatingCosts)}`,
    netIncome:`Jahresreinertrag = Jahresrohertrag − Bewirtschaftungskosten\n${fmtEuro(grossIncome)} − ${fmtEuro(operatingCosts)} = ${fmtEuro(netIncome)}`,
    landInterest:`Bodenwertverzinsung = Bodenwert × Liegenschaftszins\n${fmtEuro(landValue)} × ${fmtPercent(d.propertyYield)} = ${fmtEuro(landInterest)}`,
    buildingIncome:`Gebäudereinertrag = Jahresreinertrag − Bodenwertverzinsung\n${fmtEuro(netIncome)} − ${fmtEuro(landInterest)} = ${fmtEuro(buildingIncome)}`,
    multiplier:`Kapitalisierungsfaktor V = (q^n − 1) / (q^n × p)\np = ${fmtNum(d.propertyYield/100,4)}, q = 1 + p, n = ${fmtNum(d.remainingLife,0)} Jahre\nV = ${fmtNum(multiplier,3)}`,
    buildingValue:`Gebäudeertragswert = Gebäudereinertrag × Kapitalisierungsfaktor\n${fmtEuro(buildingIncome)} × ${fmtNum(multiplier,3)} = ${fmtEuro(buildingValue)}`,
    preliminaryIncomeValue:`Vorläufiger Ertragswert = Gebäudeertragswert + Bodenwert\n${fmtEuro(buildingValue)} + ${fmtEuro(landValue)} = ${fmtEuro(preliminaryIncomeValue)}`,
    bogTotal:`boG saldiert = Summe Zuschläge − Summe Abschläge\nZuschläge: ${fmtEuro(d.bogAdditions)}\nAbschläge: ${fmtEuro(d.bogDeductions)}\nSaldo: ${fmtEuro(bogTotal)}\n\nEinzelpositionen:\n${bogDetailText()}`,
    incomeValue:`Ertragswert = vorläufiger Ertragswert + Marktanpassung + boG\nVorläufig: ${fmtEuro(preliminaryIncomeValue)}\nMarktanpassung: ${fmtPercent(d.marketAdjustment)}\nboG: ${fmtEuro(bogTotal)}\nErgebnis = ${fmtEuro(incomeValue)}`,
    targetOffer:`Ziel-Angebot = Ertragswert × (1 − Verhandlungspuffer)\n${fmtEuro(incomeValue)} × (1 − ${fmtPercent(d.negotiationBuffer)}) = ${fmtEuro(targetOffer)}`,
    totalAcquisitionCost:`Kaufpreis inkl. Nebenkosten = Kaufpreis × (1 + Kaufnebenkosten)\n${fmtEuro(d.purchasePrice)} × (1 + ${fmtPercent(d.purchaseCostsRate)}) = ${fmtEuro(totalAcquisitionCost)}`,
    valueGap:`Differenz inkl. NK = Ertragswert − Kaufpreis inkl. Nebenkosten\n${fmtEuro(incomeValue)} − ${fmtEuro(totalAcquisitionCost)} = ${fmtEuro(valueGap)}`,
    rentMultiplier:`Kaufpreisfaktor = Kaufpreis / Jahresrohertrag\n${fmtEuro(d.purchasePrice)} / ${fmtEuro(grossIncome)} = ${fmtNum(rentMultiplier,1)}x`,
    grossYield:`Bruttorendite = Jahresrohertrag / Kaufpreis × 100\n${fmtEuro(grossIncome)} / ${fmtEuro(d.purchasePrice)} × 100 = ${fmtPercent(grossYield)}`,
    netYield:`Nettorendite = Jahresreinertrag / Kaufpreis × 100\n${fmtEuro(netIncome)} / ${fmtEuro(d.purchasePrice)} × 100 = ${fmtPercent(netYield)}`
  };
}
function ensureResultTooltip(id, explanation) { const valueNode=document.getElementById(id); if(!valueNode)return; const row=valueNode.closest('div'); const label=row?.querySelector('span:first-child'); if(!label)return; let info=label.querySelector('.result-info'); if(!info){info=document.createElement('span'); info.className='info-tooltip result-info'; info.textContent='i'; label.appendChild(info);} info.dataset.tooltip=explanation; }
function updateResultTooltips() { const current=getCurrentCaseAndResult(); if(!current)return; const explanations=buildResultExplanations(current.d,current.r); Object.entries(explanations).forEach(([id,text])=>ensureResultTooltip(id,text)); }
function installResultTooltipUpdateHook() { if(window.__resultTooltipHookInstalled || typeof update !== 'function') return; window.__resultTooltipHookInstalled=true; const originalUpdate=update; update=function(...args){ syncBogTotals(); const result=originalUpdate.apply(this,args); updateBogSummary(); setTimeout(updateResultTooltips,0); return result; }; }

document.addEventListener('input', e => {
  const index = e.target.dataset.bogIndex, field = e.target.dataset.bogField;
  if (index === undefined || !field) return;
  bogItems[index][field] = field === 'amount' ? (parseFloat(e.target.value) || 0) : e.target.value;
  saveBogItems();
  updateBogSummary();
  if (typeof update === 'function') update();
});
document.addEventListener('change', e => {
  const index = e.target.dataset.bogIndex, field = e.target.dataset.bogField;
  if (index === undefined || !field) return;
  bogItems[index][field] = e.target.value;
  saveBogItems();
  updateBogSummary();
  if (typeof update === 'function') update();
});
document.addEventListener('click', e => {
  if (e.target.id === 'addBogItem') {
    bogItems.push({ type: 'deduct', amount: 0, comment: '' });
    saveBogItems();
    renderBogItems();
    if (typeof update === 'function') update();
  }
  if (e.target.dataset.removeBog !== undefined) {
    bogItems.splice(Number(e.target.dataset.removeBog), 1);
    saveBogItems();
    renderBogItems();
    if (typeof update === 'function') update();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-switch-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.switchView)));
  injectRadioAlignmentCss();
  injectRndMethodSelector();
  injectBogList();
  syncBogTotals();
  installRndTableOverride();
  installResultTooltipUpdateHook();
  if (typeof update === 'function') update();
  setTimeout(updateResultTooltips, 0);
});
