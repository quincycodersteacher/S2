import { MAZE } from "./constants.js";

function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function oddify(n) {
    n = Math.max(3, Math.floor(n));
    return n % 2 === 0 ? n + 1 : n;
}

export function generateMaze(width, height, seed) {
    const W = oddify(width);
    const H = oddify(height);
    const rng = (seed === undefined) ? Math.random : mulberry32(seed);

    const grid = Array.from({ length: H }, () => Array(W).fill(MAZE.WALL));

    const startR = 1;
    const startC = 1;
    grid[startR][startC] = MAZE.PATH;

    const stack = [[startR, startC]];
    const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];

    while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const shuffled = dirs
            .map((d) => [d, rng()])
            .sort((a, b) => a[1] - b[1])
            .map(([d]) => d);

        let carved = false;
        for (const [dr, dc] of shuffled) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr > 0 && nr < H - 1 && nc > 0 && nc < W - 1 && grid[nr][nc] === MAZE.WALL) {
                grid[r + dr / 2][c + dc / 2] = MAZE.PATH;
                grid[nr][nc] = MAZE.PATH;
                stack.push([nr, nc]);
                carved = true;
                break;
            }
        }
        if (!carved) stack.pop();
    }

    const { farthestR, farthestC } = bfsFarthest(grid, startR, startC);

    grid[startR][startC] = MAZE.PLAYER;
    grid[farthestR][farthestC] = MAZE.EXIT;

    return grid;
}

function bfsFarthest(grid, startR, startC) {
    const H = grid.length;
    const W = grid[0].length;
    const dist = Array.from({ length: H }, () => Array(W).fill(-1));
    dist[startR][startC] = 0;
    const queue = [[startR, startC]];
    let farthestR = startR;
    let farthestC = startC;
    let maxDist = 0;

    while (queue.length) {
        const [r, c] = queue.shift();
        if (dist[r][c] > maxDist) {
            maxDist = dist[r][c];
            farthestR = r;
            farthestC = c;
        }
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < H && nc >= 0 && nc < W &&
                grid[nr][nc] === MAZE.PATH && dist[nr][nc] === -1) {
                dist[nr][nc] = dist[r][c] + 1;
                queue.push([nr, nc]);
            }
        }
    }

    return { farthestR, farthestC };
}
