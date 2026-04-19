import { MAZE } from "./constants.js";

const GLYPHS = {
    wall: "\u2588",
    path: "\u00b7",
    visited: "\u2022",
    player: "@",
    exit: "X"
};

function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMaze(engine) {
    const { grid, visited } = engine;
    const lines = [];
    for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        const out = [];
        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            const key = `${r},${c}`;
            if (cell === MAZE.WALL) {
                out.push(`<span class="cell-wall">${GLYPHS.wall}</span>`);
            } else if (cell === MAZE.PLAYER) {
                out.push(`<span class="cell-player">${GLYPHS.player}</span>`);
            } else if (cell === MAZE.EXIT) {
                out.push(`<span class="cell-exit">${GLYPHS.exit}</span>`);
            } else if (cell === MAZE.PATH) {
                if (visited && visited.has(key)) {
                    out.push(`<span class="cell-visited">${GLYPHS.visited}</span>`);
                } else {
                    out.push(`<span class="cell-path">${GLYPHS.path}</span>`);
                }
            } else {
                out.push(`<span>${esc(String(cell))}</span>`);
            }
        }
        lines.push(out.join(" "));
    }
    return lines.join("\n");
}

export function flashFault(el) {
    el.classList.add("fault");
    setTimeout(() => el.classList.remove("fault"), 260);
}
