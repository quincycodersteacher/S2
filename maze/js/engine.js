import { DIRECTION, MAZE } from "./constants.js";

export class MazeEngine {
    constructor(gridData, brain) {
        this.grid = JSON.parse(JSON.stringify(gridData));
        this.brain = brain;
        this.pPos = { r: 0, c: 0 };
        this.exitPos = { r: 0, c: 0 };
        this.isFinished = false;
        this.steps = 0;
        this.visited = new Set();
        this.scan();
        this.visited.add(`${this.pPos.r},${this.pPos.c}`);
    }

    scan() {
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                if (this.grid[r][c] === MAZE.PLAYER) this.pPos = { r, c };
                if (this.grid[r][c] === MAZE.EXIT) this.exitPos = { r, c };
            }
        }
    }

    getSensors() {
        const peek = (dir) => {
            const r = this.pPos.r + dir.dr;
            const c = this.pPos.c + dir.dc;
            return (this.grid[r] && this.grid[r][c] !== undefined) ? this.grid[r][c] : MAZE.WALL;
        };
        return {
            up: peek(DIRECTION.UP),
            down: peek(DIRECTION.DOWN),
            left: peek(DIRECTION.LEFT),
            right: peek(DIRECTION.RIGHT)
        };
    }

    pulse() {
        if (this.isFinished) return "STASIS_ACTIVE";

        const sensors = this.getSensors();
        const rawAction = this.brain.calculateNextMove(sensors);

        const validDirs = Object.values(DIRECTION);
        if (rawAction === undefined || rawAction === null) {
            return "BRAIN_FAULT: returned nothing — check for typos like DIRECTION.down vs DIRECTION.DOWN";
        }
        if (!validDirs.includes(rawAction)) {
            return `BRAIN_FAULT: not a DIRECTION (got ${typeof rawAction})`;
        }

        const action = rawAction;
        const targetR = this.pPos.r + action.dr;
        const targetC = this.pPos.c + action.dc;
        const cell = this.grid[targetR] ? this.grid[targetR][targetC] : undefined;

        if (action === DIRECTION.STAY) return "IDLE_STAY";
        if (cell === undefined) return `REJECTED_${action.name}: off the grid`;
        if (cell === MAZE.WALL) return `REJECTED_${action.name}: blocked by wall`;

        this.grid[this.pPos.r][this.pPos.c] = MAZE.PATH;
        if (cell === MAZE.EXIT) this.isFinished = true;
        this.pPos = { r: targetR, c: targetC };
        this.grid[this.pPos.r][this.pPos.c] = MAZE.PLAYER;
        this.visited.add(`${this.pPos.r},${this.pPos.c}`);
        this.steps++;
        return `MOVED_${action.name}`;
    }
}
