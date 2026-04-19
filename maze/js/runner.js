import { MazeEngine } from "./engine.js";
import { instantiateBrain, extractError } from "./brain-loader.js";

export function stepOnce(engine) {
    try {
        const log = engine.pulse();
        return { log, finished: engine.isFinished };
    } catch (err) {
        return { log: `BRAIN_FAULT: ${err.message}`, finished: false, error: extractError(err) };
    }
}

export function autoRun(engine, { intervalMs = 120, maxSteps = 500, onTick, onDone }) {
    let stopped = false;
    let stepsTaken = 0;

    const tick = () => {
        if (stopped) return;
        const result = stepOnce(engine);
        stepsTaken++;
        if (onTick) onTick(result, stepsTaken);
        if (result.finished) {
            stopped = true;
            if (onDone) onDone({ reason: "finished", steps: stepsTaken, result });
            return;
        }
        if (result.error) {
            stopped = true;
            if (onDone) onDone({ reason: "error", steps: stepsTaken, result });
            return;
        }
        if (stepsTaken >= maxSteps) {
            stopped = true;
            if (onDone) onDone({ reason: "max-steps", steps: stepsTaken, result });
            return;
        }
        setTimeout(tick, intervalMs);
    };

    setTimeout(tick, intervalMs);

    return { stop: () => { stopped = true; } };
}

export function testAll(BrainClass, levels, maxSteps = 200) {
    return levels.map((grid, levelIndex) => {
        const { brain, error: instErr } = instantiateBrain(BrainClass);
        if (instErr) {
            return { levelIndex, pass: false, steps: 0, log: `CONSTRUCTOR_FAULT: ${instErr.message}`, error: instErr };
        }
        const engine = new MazeEngine(grid, brain);
        let lastLog = "";
        let steps = 0;
        let error = null;

        while (!engine.isFinished && steps < maxSteps) {
            try {
                lastLog = engine.pulse();
            } catch (err) {
                error = extractError(err);
                lastLog = `BRAIN_FAULT: ${err.message}`;
                break;
            }
            if (String(lastLog).startsWith("BRAIN_FAULT")) break;
            steps++;
        }

        return {
            levelIndex,
            pass: engine.isFinished,
            steps,
            log: engine.isFinished ? `SOLVED in ${steps} steps` : (lastLog || "TIMEOUT"),
            error
        };
    });
}
