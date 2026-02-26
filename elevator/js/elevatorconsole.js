/**
 * ElevatorConsole - A standalone console renderer for elevator simulations.
 *
 * Usage:
 *   import { ElevatorConsole } from './elevatorconsole.js';
 *
 *   const renderer = new ElevatorConsole();
 *
 *   // Call render() each simulation step, passing your building object.
 *   // The building must have:
 *   //   .floors    - array of floor objects, each with:
 *   //                  .floorNumber, .queue.people (array of {destinationFloor})
 *   //   .elevators - array of elevator objects, each with:
 *   //                  .currentFloor, .queue.people (array of {destinationFloor})
 *   renderer.render(building);
 */

class ElevatorConsole {
    constructor() {
        this.timer = 0;
    }

    render(building) {
        console.clear();
        this.timer++;
        const numFloors = building.floors.length;

        for (let f = numFloors - 1; f >= 0; f--) {
            let line = `Floor ${f}: `;
            for (let e of building.elevators) {
                if (e.currentFloor === f) {
                    const dests = e.queue.people.map(p => p.destinationFloor).join(' ');
                    line += `[${dests}] `;
                } else {
                    line += '[ ] ';
                }
            }
            const floor = building.floors[f];
            const dests = floor.queue.people.map(p => p.destinationFloor).join(' ');
            line += `(${dests})`;
            console.log(line);
        }
        console.log(`Timer: ${this.timer}`);
    }
}

export { ElevatorConsole };
