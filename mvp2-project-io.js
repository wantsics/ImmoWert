(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function safeName(s) {
    return (
      String(s || "immowert-projekt")
        .trim()
        .replace(/[^a-z0-9_-]+/gi, "_")
        .replace(/^_+|_+$/g, "") || "immowert-projekt"
    );
  }
  function readFields() {
    const ids = [
      "objectName",
      "borisAddress",
      "valuationDate",
      "constructionYear",
      "totalArea",
      "baseLandValuePerSqm",
      "timeAdjustmentFactor",
      "landFeatureFactor",
      "plotArea",
      "relevantFloorArea",
      "buildingLandArea",
      "gardenArea",
      "gardenFactor",
      "operatingCostRate",
      "propertyYield",
      "propertyYieldNote",
      "totalUsefulLife",
      "remainingLife",
      "marketAdjustment",
      "bogDeductions",
      "bogAdditions",
      "purchasePrice",
      "purchaseCostsRate",
      "negotiationBuffer",
      "wgfzActive",
      "wgfzModel",
      "wgfzSoll",
      "wgfzIst",
      "wgfzCorrectionFactor",
      "manualLocationFactor",
      "marketProfileSelect",
      "yieldSourceSelect",
    ];
    const out = {};
    ids.forEach((id) => {
      const el = $(id);
      if (el) out[id] = el.value;
    });
    return out;
  }
  function writeFields(fields) {
    Object.entries(fields || {}).forEach(([id, v]) => {
      const el = $(id);
      if (el) el.value = v ?? "";
    });
  }
  function getGlobal(name, fallback) {
    try {
      return window[name] !== undefined ? window[name] : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function setGlobal(name, value) {
    try {
      window[name] = value;
    } catch (e) {}
  }
  function projectPayload() {
    if (typeof readCase === "function") readCase();
    return {
      schema: "immowert-project-v1",
      savedAt: new Date().toISOString(),
      fields: readFields(),
      units: getGlobal("units", []),
      brwHistory: getGlobal("brwHistory", []),
      modernization: getGlobal("modernization", {}),
      bogItems: getGlobal("bogItems", []),
      activeMarketProfile:
        localStorage.getItem("immowert-active-market-profile") || "",
    };
  }
  function saveProject() {
    const p = projectPayload();
    const blob = new Blob([JSON.stringify(p, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download =
      safeName(p.fields.objectName) +
      "_" +
      new Date().toISOString().slice(0, 10) +
      ".immowert.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }
  function loadProject(p) {
    if (!p || p.schema !== "immowert-project-v1") {
      alert("Keine gültige ImmoWert-Projektdatei.");
      return;
    }
    if (p.activeMarketProfile)
      localStorage.setItem(
        "immowert-active-market-profile",
        p.activeMarketProfile,
      );
    writeFields(p.fields);
    if (Array.isArray(p.units)) setGlobal("units", p.units);
    if (Array.isArray(p.brwHistory)) setGlobal("brwHistory", p.brwHistory);
    if (p.modernization) setGlobal("modernization", p.modernization);
    if (Array.isArray(p.bogItems)) setGlobal("bogItems", p.bogItems);
    if (typeof renderUnits === "function") renderUnits();
    if (typeof renderBrwHistory === "function") renderBrwHistory();
    if (typeof renderModernization === "function") renderModernization();
    if (typeof renderBogItems === "function") renderBogItems();
    setTimeout(function () {
      if (typeof syncWgfzFactor === "function") syncWgfzFactor();
      if (typeof update === "function") update();
    }, 0);
  }
  function chooseProject() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.immowert.json,application/json";
    input.onchange = function () {
      const f = input.files && input.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = function () {
        try {
          loadProject(JSON.parse(String(r.result)));
        } catch (e) {
          alert("Projekt konnte nicht geladen werden: JSON ungültig.");
        }
      };
      r.readAsText(f);
    };
    input.click();
  }
  function install() {
    const bar = document.querySelector(".top-actions");
    if (!bar || $("loadCase")) return;
    const save = $("saveCase");
    if (save) {
      save.textContent = "Projekt speichern";
      save.onclick = saveProject;
    }
    const load = document.createElement("button");
    load.type = "button";
    load.id = "loadCase";
    load.textContent = "Projekt laden";
    load.onclick = chooseProject;
    save ? bar.insertBefore(load, save.nextSibling) : bar.appendChild(load);
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", install);
  else install();
})();
