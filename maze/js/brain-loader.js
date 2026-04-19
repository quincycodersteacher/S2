import { DIRECTION, MAZE } from "./constants.js";

export function compileBrain(source) {
    try {
        const factory = new Function("DIRECTION", "MAZE",
            `"use strict";\n${source}\n;return PlayerBrain;`);
        const BrainClass = factory(DIRECTION, MAZE);
        if (typeof BrainClass !== "function") {
            return { error: { message: "Code must define a class named `PlayerBrain`.", line: null } };
        }
        const sample = new BrainClass();
        if (typeof sample.calculateNextMove !== "function") {
            return { error: { message: "`PlayerBrain` must have a `calculateNextMove(sensors)` method.", line: null } };
        }
        return { BrainClass };
    } catch (err) {
        return { error: extractError(err) };
    }
}

export function instantiateBrain(BrainClass) {
    try {
        return { brain: new BrainClass() };
    } catch (err) {
        return { error: extractError(err) };
    }
}

export function extractError(err) {
    const message = err && err.message ? err.message : String(err);
    let line = null;
    const stack = err && err.stack ? err.stack : "";
    const m = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/Function:(\d+):(\d+)/);
    if (m) {
        const rawLine = parseInt(m[1], 10);
        line = rawLine > 2 ? rawLine - 2 : rawLine;
    }
    return { message, line };
}
