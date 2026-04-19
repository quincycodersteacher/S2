import { MazeEngine } from "./engine.js";
import { LEVELS } from "./levels.js";
import { generateMaze } from "./generator.js";
import { compileBrain, instantiateBrain } from "./brain-loader.js";
import { stepOnce, autoRun, testAll } from "./runner.js";
import { renderMaze, flashFault } from "./renderer.js";
import { createEditor, loadCode, loadBestSteps, recordBest } from "./editor.js";

const $ = (id) => document.getElementById(id);

const el = {
    editorHost: $("editor-host"),
    saveStatus: $("save-status"),
    resetCodeBtn: $("btn-reset-code"),
    levelSelect: $("level-select"),
    sizeSelect: $("size-select"),
    genBtn: $("btn-generate"),
    testBtn: $("btn-test-all"),
    stepBtn: $("btn-step"),
    runBtn: $("btn-run"),
    resetBtn: $("btn-reset"),
    speed: $("speed-slider"),
    speedLabel: $("speed-label"),
    maze: $("maze-display"),
    sensors: $("val-sensors"),
    steps: $("val-steps"),
    best: $("val-best"),
    level: $("val-level"),
    status: $("val-status"),
    log: $("log-line"),
    errorBox: $("error-box"),
    testPanel: $("test-panel"),
    testGrid: $("test-grid"),
};

const state = {
    editor: null,
    currentLevelKey: "builtin-0",
    currentGrid: LEVELS[0],
    engine: null,
    autoHandle: null,
};

function buildEngine() {
    stopAutoRun();
    const source = state.editor.getValue();
    const { BrainClass, error: compileErr } = compileBrain(source);
    if (compileErr) {
        showError("Compile error: " + compileErr.message + (compileErr.line ? ` (line ${compileErr.line})` : ""));
        state.engine = null;
        return false;
    }
    const { brain, error: instErr } = instantiateBrain(BrainClass);
    if (instErr) {
        showError("Constructor error: " + instErr.message);
        state.engine = null;
        return false;
    }
    clearError();
    state.engine = new MazeEngine(state.currentGrid, brain);
    return true;
}

function ensureEngine() {
    if (!state.engine) return buildEngine();
    return true;
}

function stopAutoRun() {
    if (state.autoHandle) {
        state.autoHandle.stop();
        state.autoHandle = null;
    }
    el.runBtn.textContent = "\u25B6\u25B6 Run";
}

function showError(msg) {
    el.errorBox.textContent = msg;
    el.errorBox.classList.add("visible");
    flashFault(el.maze);
}

function clearError() {
    el.errorBox.classList.remove("visible");
    el.errorBox.textContent = "";
}

function updateDisplay(log) {
    const eng = state.engine;
    if (!eng) {
        el.maze.innerHTML = "";
        el.sensors.textContent = "\u2014";
        el.steps.textContent = "0";
        el.status.textContent = "NO ENGINE";
        el.log.textContent = log || "";
        return;
    }
    el.maze.innerHTML = renderMaze(eng);
    const s = eng.getSensors();
    el.sensors.innerHTML = `U:${fmt(s.up)} D:${fmt(s.down)} &nbsp; L:${fmt(s.left)} R:${fmt(s.right)}`;
    el.steps.textContent = eng.steps;

    if (eng.isFinished) {
        el.status.textContent = "MISSION SUCCESS";
        el.status.className = "value win";
        const best = recordBest(state.currentLevelKey, eng.steps);
        el.best.textContent = best;
    } else {
        el.status.textContent = log || "READY";
        el.status.className = String(log || "").startsWith("BRAIN_FAULT") || String(log || "").startsWith("REJECTED") ? "value bad" : "value";
    }
    el.log.textContent = log || "";
}

function fmt(v) {
    if (v === 0) return "0";
    if (v === 1) return "1";
    return String(v);
}

function refreshBestBadge() {
    const best = loadBestSteps()[state.currentLevelKey];
    el.best.textContent = best === undefined ? "\u2014" : best;
}

function setLevel(grid, label, key) {
    stopAutoRun();
    state.currentGrid = grid;
    state.currentLevelKey = key;
    el.level.textContent = label;
    state.engine = null;
    buildEngine();
    refreshBestBadge();
    updateDisplay("READY");
}

function populateLevelDropdown() {
    el.levelSelect.innerHTML = "";
    LEVELS.forEach((_, i) => {
        const opt = document.createElement("option");
        opt.value = `builtin-${i}`;
        opt.textContent = `Level ${i}`;
        el.levelSelect.appendChild(opt);
    });
    const random = document.createElement("option");
    random.value = "random";
    random.textContent = "Random\u2026";
    el.levelSelect.appendChild(random);
}

function onLevelChange() {
    const v = el.levelSelect.value;
    if (v === "random") {
        generateAndLoad();
    } else if (v.startsWith("builtin-")) {
        const i = parseInt(v.slice(8), 10);
        setLevel(LEVELS[i], `Level ${i}`, `builtin-${i}`);
    }
}

function generateAndLoad() {
    const size = parseInt(el.sizeSelect.value, 10) || 11;
    const grid = generateMaze(size, size);
    const seed = Date.now().toString(36).slice(-4).toUpperCase();
    setLevel(grid, `Random ${size}\u00d7${size} #${seed}`, `random-${size}-${seed}`);
    if (!Array.from(el.levelSelect.options).some((o) => o.value === "random")) {
        const opt = document.createElement("option");
        opt.value = "random";
        opt.textContent = "Random\u2026";
        el.levelSelect.appendChild(opt);
    }
    el.levelSelect.value = "random";
}

function doStep() {
    stopAutoRun();
    if (!ensureEngine()) return;
    const res = stepOnce(state.engine);
    if (res.error) showError(res.error.message + (res.error.line ? ` (line ${res.error.line})` : ""));
    updateDisplay(res.log);
}

function doRun() {
    if (state.autoHandle) { stopAutoRun(); return; }
    if (!ensureEngine()) return;
    if (state.engine.isFinished) return;
    const interval = parseInt(el.speed.value, 10);
    el.runBtn.textContent = "\u25A0 Stop";
    state.autoHandle = autoRun(state.engine, {
        intervalMs: interval,
        maxSteps: 1000,
        onTick: (res) => updateDisplay(res.log),
        onDone: ({ reason, result }) => {
            state.autoHandle = null;
            el.runBtn.textContent = "\u25B6\u25B6 Run";
            if (reason === "error" && result.error) {
                showError(result.error.message + (result.error.line ? ` (line ${result.error.line})` : ""));
            } else if (reason === "max-steps") {
                updateDisplay("TIMEOUT: brain exceeded 1000 steps without reaching exit");
            }
        }
    });
}

function doReset() {
    stopAutoRun();
    buildEngine();
    updateDisplay("RESET");
}

function doTestAll() {
    stopAutoRun();
    const source = state.editor.getValue();
    const { BrainClass, error: compileErr } = compileBrain(source);
    if (compileErr) {
        showError("Compile error: " + compileErr.message + (compileErr.line ? ` (line ${compileErr.line})` : ""));
        return;
    }
    clearError();
    const results = testAll(BrainClass, LEVELS, 300);
    renderTestResults(results);
}

function renderTestResults(results) {
    el.testPanel.classList.add("visible");
    el.testGrid.innerHTML = "";
    const passed = results.filter((r) => r.pass).length;
    el.testPanel.querySelector("h3").textContent =
        `Test Results \u2014 ${passed}/${results.length} passed  (click a cell to load & debug)`;

    results.forEach((r) => {
        const cell = document.createElement("div");
        cell.className = `test-cell ${r.pass ? "pass" : "fail"}`;
        cell.innerHTML = `<div><strong>Level ${r.levelIndex}</strong> \u2014 ${r.pass ? "PASS" : "FAIL"}</div>
                          <div class="meta">${r.pass ? `${r.steps} steps` : escapeHTML(String(r.log).slice(0, 60))}</div>`;
        cell.addEventListener("click", () => {
            setLevel(LEVELS[r.levelIndex], `Level ${r.levelIndex}`, `builtin-${r.levelIndex}`);
            el.levelSelect.value = `builtin-${r.levelIndex}`;
            updateDisplay(r.pass ? "LOADED (passed in test)" : "LOADED — step through to debug");
        });
        el.testGrid.appendChild(cell);
    });
}

function escapeHTML(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bindControls() {
    populateLevelDropdown();
    el.levelSelect.addEventListener("change", onLevelChange);
    el.genBtn.addEventListener("click", generateAndLoad);
    el.stepBtn.addEventListener("click", doStep);
    el.runBtn.addEventListener("click", doRun);
    el.resetBtn.addEventListener("click", doReset);
    el.testBtn.addEventListener("click", doTestAll);
    el.resetCodeBtn.addEventListener("click", () => {
        if (confirm("Reset editor to the starter template? Your current code will be erased.")) {
            state.editor.reset();
        }
    });
    el.speed.addEventListener("input", () => {
        el.speedLabel.textContent = `${el.speed.value}ms`;
    });
    el.speedLabel.textContent = `${el.speed.value}ms`;

    window.addEventListener("keydown", (e) => {
        if (e.target && (e.target.tagName === "TEXTAREA" || e.target.closest(".cm-editor"))) return;
        if (e.code === "Space") { e.preventDefault(); doStep(); }
        if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); doReset(); }
    });
}

async function init() {
    state.editor = await createEditor(el.editorHost, el.saveStatus, loadCode());
    bindControls();
    setLevel(LEVELS[0], "Level 0", "builtin-0");
}

init();
