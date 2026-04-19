export const DIRECTION = {
    UP:    { dr: -1, dc:  0, name: "UP" },
    DOWN:  { dr:  1, dc:  0, name: "DOWN" },
    LEFT:  { dr:  0, dc: -1, name: "LEFT" },
    RIGHT: { dr:  0, dc:  1, name: "RIGHT" },
    STAY:  { dr:  0, dc:  0, name: "STAY" }
};

export const MAZE = {
    PATH:   0,
    WALL:   1,
    PLAYER: '@',
    EXIT:   'X'
};
