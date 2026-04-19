const CODE_KEY = "maze-ide.playerBrain.v1";
const BEST_KEY = "maze-ide.bestSteps.v1";

export const DEFAULT_BRAIN = `class PlayerBrain {
    constructor() {
        this.memory = []; // Good for tracking visited spots
    }

    calculateNextMove(sensors) {
        // sensors: { up, down, left, right }
        // Each is 0 (path), 1 (wall), '@' (you), or 'X' (exit)
        // Return: DIRECTION.UP / DOWN / LEFT / RIGHT / STAY

        // DEFAULT: head toward the exit if you see it, else try UP.
        if (sensors.up    === MAZE.EXIT) return DIRECTION.UP;
        if (sensors.down  === MAZE.EXIT) return DIRECTION.DOWN;
        if (sensors.left  === MAZE.EXIT) return DIRECTION.LEFT;
        if (sensors.right === MAZE.EXIT) return DIRECTION.RIGHT;

        if (sensors.up !== MAZE.WALL) return DIRECTION.UP;
        return DIRECTION.STAY;
    }
}`;

export function loadCode() {
    try {
        return localStorage.getItem(CODE_KEY) || DEFAULT_BRAIN;
    } catch {
        return DEFAULT_BRAIN;
    }
}

function saveCode(source) {
    try {
        localStorage.setItem(CODE_KEY, source);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message || String(err) };
    }
}

export function resetCode() {
    try { localStorage.removeItem(CODE_KEY); } catch {}
    return DEFAULT_BRAIN;
}

export function loadBestSteps() {
    try {
        const raw = localStorage.getItem(BEST_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function recordBest(levelKey, steps) {
    const best = loadBestSteps();
    if (best[levelKey] === undefined || steps < best[levelKey]) {
        best[levelKey] = steps;
        try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch {}
        return steps;
    }
    return best[levelKey];
}

export async function createEditor(hostEl, statusEl, initialSource) {
    const showStatus = (cls, text) => {
        statusEl.className = `save-status ${cls}`;
        statusEl.textContent = text;
    };

    let getValue;
    let setValue;

    try {
        const [{ EditorView, basicSetup }, { javascript }, { oneDark }, { EditorState }] = await Promise.all([
            import("https://esm.sh/codemirror@6.0.1"),
            import("https://esm.sh/@codemirror/lang-javascript@6.2.2"),
            import("https://esm.sh/@codemirror/theme-one-dark@6.1.2"),
            import("https://esm.sh/@codemirror/state@6.4.1")
        ]);

        const updateListener = EditorView.updateListener.of((u) => {
            if (u.docChanged) scheduleSave();
        });

        const view = new EditorView({
            state: EditorState.create({
                doc: initialSource,
                extensions: [basicSetup, javascript(), oneDark, updateListener]
            }),
            parent: hostEl
        });

        getValue = () => view.state.doc.toString();
        setValue = (s) => {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: s }
            });
        };
    } catch (err) {
        console.warn("CodeMirror load failed, falling back to textarea:", err);
        const ta = document.createElement("textarea");
        ta.value = initialSource;
        ta.style.width = "100%";
        ta.style.height = "100%";
        ta.style.background = "#000";
        ta.style.color = "#58a6ff";
        ta.style.border = "none";
        ta.style.padding = "12px";
        ta.style.fontFamily = "inherit";
        ta.style.fontSize = "13px";
        ta.style.resize = "none";
        ta.spellcheck = false;
        hostEl.appendChild(ta);
        ta.addEventListener("input", scheduleSave);
        getValue = () => ta.value;
        setValue = (s) => { ta.value = s; };
    }

    let saveTimer = null;
    function scheduleSave() {
        showStatus("saving", "saving\u2026");
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const res = saveCode(getValue());
            if (res.ok) showStatus("saved", "saved");
            else showStatus("error", "save failed: " + res.error);
        }, 300);
    }

    showStatus("saved", "saved");

    return {
        getValue,
        setValue,
        reset: () => {
            const fresh = resetCode();
            setValue(fresh);
            showStatus("saved", "saved");
            return fresh;
        }
    };
}
