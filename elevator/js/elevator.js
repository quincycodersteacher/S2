import { ElevatorQueue, FloorQueue } from './queue.js';

class Person {
    constructor(name, originFloor, destinationFloor) {
        this.name = name; // in pounds
        this.originFloor = originFloor; // origin floor
        this.destinationFloor = destinationFloor; // destination floor
    }
    equals(otherPerson) {
        return this.name === otherPerson.name;
    }
}

const DIRECTION = Object.freeze({
    UP: 100,
    DOWN: 200
});

class Elevator {
    constructor(capacity, floors) {
        this.capacity = capacity; // in number of people
        this.floors = floors; // list of floors
        this.queue = new ElevatorQueue(); // current list of people
        this.currentFloor = 0; // current floor
        this.destinationFloor = 0; // destination floor
    }

    isFull() {
        return this.queue.size() >= this.capacity;
    }

    /**
     * @returns false if elevator didn't move (is at destination), 
     * otherwise it moves the elevator up or down one floor and returns true
     */
    move() {
        if (this.currentFloor === this.destinationFloor) {
            return false;
        } else {
            if (this.currentFloor < this.destinationFloor) {
                this.currentFloor++;
            } else {
                this.currentFloor--;
            }
        }
        return true;
    }

    getNextDestinationFloor() {
        if (this.queue.isEmpty()) {
            //no one in elevator, so scan floors to find next destination
            for (let floor of this.floors) {
                if (floor.floorNumber === this.currentFloor) {
                    continue; //skip current floor
                }
                //currently returns first floor found with button pressed. this could be improved
                if (floor.upButtonPressed || floor.downButtonPressed) {
                    return floor.floorNumber;
                }
            }
            // no buttons pressed anywhere, stay on current floor
            return this.currentFloor;
        }
        return this.queue.peek().destinationFloor; // get the destination floor of the next person in the queue
    }

    getNextDirection() {
        let nextDestinationFloor = this.getNextDestinationFloor();
        if (nextDestinationFloor > this.currentFloor) {
            return DIRECTION.UP;
        } else {
            return DIRECTION.DOWN;
        }
    }

    /**
     * @description Unloads people from the elevator if they have reached their destination floor one at
     * a time.
     * @returns true if someone was unloaded, otherwise false
     */
    unLoadPeople() {
        const person = this.queue.dequeue(this.currentFloor);
        if (person != null) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @returns true if someone was loaded, otherwise false
     */
    loadPeople() {
        if (!this.isFull()) {
            let person = null;
            if (this.getNextDirection() === DIRECTION.UP) {
                person = this.floors[this.currentFloor].queue.dequeueNextWithDestinationAbove(this.currentFloor);
            } else {
                //going down
                person = this.floors[this.currentFloor].queue.dequeueNextWithDestinationBelow(this.currentFloor);
            }
            if (person == null) {
                //no one on this floor going in the same direction
                return false;
            } else {
                //person enters the elevator
                this.queue.enqueue(person);
                return true;
            }
        }
        return false;
    }

    moveAndLoad() {
        if (!this.move()) {
            //elevator didn't move, so it's at its destination floor. need to unload and load people
            if (!this.unLoadPeople()) {
                //no one to unload, so need to load people
                if (!this.loadPeople()) {
                    //no one to load, so set the next destination floor and return
                    this.destinationFloor = this.getNextDestinationFloor();
                    return;
                }
            }
        }
    }

}

class RegularElevator extends Elevator {
    constructor(floors) {
        super(4, floors); //4 person capacity
    }
}

class Floor {
    constructor(floorNumber) {
        this.floorNumber = floorNumber; // floor number
        this.queue = new FloorQueue();
        this.upButtonPressed = false;
        this.downButtonPressed = false;
    }
    getPeopleOnFloor() {
        return this.queue.size();
    }
    addPerson(person) {
        this.queue.enqueue(person);
    }
    removePerson(person) {
    }
    pressButtons() {
        this.upButtonPressed = false;
        this.downButtonPressed = false;
        if (!this.queue.isEmpty()) {
            for (let p of this.queue.people) {
                if (p.destinationFloor > this.floorNumber) {
                    this.upButtonPressed = true;
                } else if (p.destinationFloor < this.floorNumber) {
                    this.downButtonPressed = true;
                }
            }
        }
    }
}

class Building {
    constructor(numElevators, numFloors) {
        this.numElevators = numElevators; // number of elevators in the building
        this.numFloors = numFloors; // number of floors in the building
        this.elevators = [];
        this.floors = [];
        for (let i = 0; i < numFloors; i++) {
            this.floors.push(new Floor(i));
        }
        for (let i = 0; i < numElevators; i++) {
            this.elevators.push(new RegularElevator(this.floors));
        }
    }

    moveElevatorsAndLoad() {
        for (let elevator of this.elevators) {
            //move each elevator
            elevator.moveAndLoad();
        }
    }

    getFloor(floorNumber) {
        return this.floors.find(floor => floor.floorNumber === floorNumber);
    }

    getNumberFloors() {
        return this.floors.length;
    }

    /**
     * @description Generates people and places them on random floors in the building.
     * @param {number} numPeople - The number of people to generate and place in the building.
     */
    generatePeopleRandomly(numPeople) {
        const names = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        for (let i = 0; i < numPeople; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const originFloor = Math.floor(Math.random() * this.getNumberFloors());
            let destinationFloor;
            do {
                destinationFloor = Math.floor(Math.random() * this.getNumberFloors());
            } while (destinationFloor === originFloor);
            const person = new Person(name, originFloor, destinationFloor);
            this.getFloor(originFloor).addPerson(person);
        }
    }
}

class Simulation {
    constructor(numElevators, numFloors, peoplePerSecond, canvas) {
        this.numElevators = numElevators; // number of elevators in the building
        this.numFloors = numFloors; // number of floors in the building
        this.peoplePerSecond = peoplePerSecond; // number of people entering the building per second
        this.timer = 0;
        // create the Building instance
        this.isRunning = false;
        this.intervalId = null; // to store the interval ID for pausing
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.building = new Building(this.numElevators, this.numFloors);
    }
    step() {
        // Implement the logic to simulate one step of the simulation
        // generate people randomly
        this.building.generatePeopleRandomly(this.peoplePerSecond);
        for (let floor of this.building.floors) {
            floor.pressButtons();
        }
        // move elevators to their destination floors
        // load and unload people from the elevators
        this.building.moveElevatorsAndLoad();
        //this.animate();
        if (this.canvas) {
            this.animateCanvas();
        }
    }
    toggleRun() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.run();
        }
    }
    run() {
        this.intervalId = setInterval(() => this.step(), 1000);
        this.isRunning = true;
    }
    pause() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }
    animate() {
        console.clear();
        this.timer++;
        for (let f = this.numFloors - 1; f >= 0; f--) {
            let line = `Floor ${f}: `;
            for (let e of this.building.elevators) {
                if (e.currentFloor === f) {
                    const dests = e.queue.people.map(p => p.destinationFloor).join(' ');
                    line += `[${dests}] `;
                } else {
                    line += '[ ] ';
                }
            }
            const floor = this.building.getFloor(f);
            const dests = floor.queue.people.map(p => p.destinationFloor).join(' ');
            line += `(${dests})`;
            console.log(line);
        }
        console.log(`Timer: ${this.timer}`);
    }

    // Color palette - Retro-futuristic control room
    colors = {
        bgDeep: '#0a0a0c',
        bgPanel: '#12131a',
        amber: '#ffb000',
        amberDim: '#b37a00',
        amberGlow: 'rgba(255, 176, 0, 0.3)',
        cyan: '#00ffd0',
        cyanDim: '#00a088',
        cyanGlow: 'rgba(0, 255, 208, 0.3)',
        red: '#ff3366',
        redGlow: 'rgba(255, 51, 102, 0.3)',
        gridLine: 'rgba(255, 176, 0, 0.06)',
        textDim: 'rgba(255, 255, 255, 0.35)',
        shaftBg: '#0d0e12'
    };

    animateCanvas() {
        this.timer++;
        const ctx = this.ctx;
        const canvas = this.canvas;
        const c = this.colors;

        // Layout calculations
        const padding = 25;
        const shaftWidth = 140;
        const shaftGap = 8;
        const totalShaftWidth = (shaftWidth * this.numElevators) + (shaftGap * (this.numElevators - 1)) + 60;
        const floorHeight = canvas.height / this.numFloors;
        const shaftStartX = canvas.width - totalShaftWidth - padding + 30;

        // Update DOM stats if available
        if (this.domStats) {
            let totalWaiting = 0;
            let totalInTransit = 0;
            for (let floor of this.building.floors) {
                totalWaiting += floor.queue.people.length;
            }
            for (let elev of this.building.elevators) {
                totalInTransit += elev.queue.people.length;
            }
            this.domStats.timer.textContent = String(this.timer).padStart(3, '0');
            this.domStats.waiting.textContent = totalWaiting;
            this.domStats.transit.textContent = totalInTransit;
        }

        // Clear canvas
        ctx.fillStyle = c.bgPanel;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw subtle grid
        ctx.strokeStyle = c.gridLine;
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw building cross-section outline
        ctx.strokeStyle = c.amberDim;
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, 0, canvas.width - padding * 2, canvas.height);

        // Draw floor separators and floor areas
        for (let f = 0; f < this.numFloors; f++) {
            const y = canvas.height - (f + 1) * floorHeight;
            const floor = this.building.getFloor(f);

            // Floor separator line
            ctx.strokeStyle = c.amberDim;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, y + floorHeight);
            ctx.lineTo(canvas.width - padding, y + floorHeight);
            ctx.stroke();

            // Floor label - architectural style
            ctx.fillStyle = c.amber;
            ctx.font = '900 28px Orbitron, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${f}`, padding + 15, y + floorHeight - 20);

            // Floor sub-label
            ctx.fillStyle = c.textDim;
            ctx.font = '300 9px JetBrains Mono, monospace';
            ctx.fillText('LEVEL', padding + 15, y + floorHeight - 45);

            // Draw call buttons panel
            const btnPanelX = padding + 60;
            const btnPanelY = y + floorHeight / 2 - 25;

            // Button panel background
            ctx.fillStyle = 'rgba(255, 176, 0, 0.05)';
            ctx.fillRect(btnPanelX, btnPanelY, 32, 50);
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(btnPanelX, btnPanelY, 32, 50);

            // Up button
            if (f < this.numFloors - 1) {
                const upActive = floor.upButtonPressed;
                ctx.fillStyle = upActive ? c.cyan : 'rgba(0, 255, 208, 0.15)';
                ctx.beginPath();
                ctx.moveTo(btnPanelX + 16, btnPanelY + 8);
                ctx.lineTo(btnPanelX + 26, btnPanelY + 20);
                ctx.lineTo(btnPanelX + 6, btnPanelY + 20);
                ctx.closePath();
                ctx.fill();
                if (upActive) {
                    ctx.shadowColor = c.cyan;
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Down button
            if (f > 0) {
                const downActive = floor.downButtonPressed;
                ctx.fillStyle = downActive ? c.red : 'rgba(255, 51, 102, 0.15)';
                ctx.beginPath();
                ctx.moveTo(btnPanelX + 16, btnPanelY + 42);
                ctx.lineTo(btnPanelX + 26, btnPanelY + 30);
                ctx.lineTo(btnPanelX + 6, btnPanelY + 30);
                ctx.closePath();
                ctx.fill();
                if (downActive) {
                    ctx.shadowColor = c.red;
                    ctx.shadowBlur = 15;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Draw waiting area with people
            const people = floor.queue.people;
            const waitingStartX = padding + 110;
            const personSpacing = 38;
            const maxPerRow = Math.floor((shaftStartX - waitingStartX - 20) / personSpacing);

            for (let idx = 0; idx < people.length; idx++) {
                const p = people[idx];
                const row = Math.floor(idx / maxPerRow);
                const col = idx % maxPerRow;
                const px = waitingStartX + col * personSpacing;
                const py = y + 30 + row * 50;

                this.drawPerson(ctx, px, py, p.destinationFloor, p.destinationFloor > f);
            }
        }

        // Draw elevator shafts
        for (let i = 0; i < this.numElevators; i++) {
            const elevator = this.building.elevators[i];
            const shaftX = shaftStartX + i * (shaftWidth + shaftGap);

            // Shaft background
            ctx.fillStyle = c.shaftBg;
            ctx.fillRect(shaftX, 0, shaftWidth, canvas.height);

            // Shaft borders
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(shaftX, 0, shaftWidth, canvas.height);

            // Shaft label at top
            ctx.fillStyle = c.textDim;
            ctx.font = '500 10px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`SHAFT ${String.fromCharCode(65 + i)}`, shaftX + shaftWidth / 2, 15);

            // Draw guide rails
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.1)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(shaftX + 8, 0);
            ctx.lineTo(shaftX + 8, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(shaftX + shaftWidth - 8, 0);
            ctx.lineTo(shaftX + shaftWidth - 8, canvas.height);
            ctx.stroke();

            // Draw floor indicators in shaft
            for (let f = 0; f < this.numFloors; f++) {
                const indicatorY = canvas.height - (f + 1) * floorHeight + floorHeight - 5;
                ctx.fillStyle = elevator.currentFloor === f ? c.amber : 'rgba(255, 176, 0, 0.15)';
                ctx.font = '700 11px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(f.toString(), shaftX + shaftWidth / 2, indicatorY);
            }

            // Draw elevator car
            const carY = canvas.height - (elevator.currentFloor + 1) * floorHeight + 8;
            const carHeight = floorHeight - 16;
            const carX = shaftX + 12;
            const carWidth = shaftWidth - 24;

            // Car shadow/depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(carX + 4, carY + 4, carWidth, carHeight);

            // Determine elevator state and color
            const isMovingUp = elevator.destinationFloor > elevator.currentFloor;
            const isMovingDown = elevator.destinationFloor < elevator.currentFloor;
            const stateColor = isMovingUp ? c.cyan : isMovingDown ? c.red : c.amberDim;
            const stateGlow = isMovingUp ? c.cyanGlow : isMovingDown ? c.redGlow : c.amberGlow;

            // Car body with state-based border
            ctx.fillStyle = '#1a1b22';
            ctx.fillRect(carX, carY, carWidth, carHeight);

            // Car border glow
            ctx.strokeStyle = stateColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(carX, carY, carWidth, carHeight);

            // Add glow effect
            ctx.shadowColor = stateGlow;
            ctx.shadowBlur = 10;
            ctx.strokeRect(carX, carY, carWidth, carHeight);
            ctx.shadowBlur = 0;

            // Elevator doors (center split)
            const doorGap = 4;
            const doorWidth = (carWidth - doorGap) / 2 - 8;
            ctx.fillStyle = '#252730';
            ctx.fillRect(carX + 4, carY + 25, doorWidth, carHeight - 35);
            ctx.fillRect(carX + carWidth - doorWidth - 4, carY + 25, doorWidth, carHeight - 35);

            // Door frame
            ctx.strokeStyle = 'rgba(255, 176, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(carX + 4, carY + 25, doorWidth, carHeight - 35);
            ctx.strokeRect(carX + carWidth - doorWidth - 4, carY + 25, doorWidth, carHeight - 35);

            // Floor display panel at top of car
            ctx.fillStyle = '#0a0a0c';
            ctx.fillRect(carX + carWidth / 2 - 20, carY + 4, 40, 18);
            ctx.strokeStyle = stateColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(carX + carWidth / 2 - 20, carY + 4, 40, 18);

            // Floor number display
            ctx.fillStyle = stateColor;
            ctx.font = '700 12px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(elevator.currentFloor.toString(), carX + carWidth / 2, carY + 17);

            // Direction arrow
            if (isMovingUp || isMovingDown) {
                ctx.fillStyle = stateColor;
                ctx.font = '14px Arial';
                ctx.fillText(isMovingUp ? '▲' : '▼', carX + carWidth / 2 + 25, carY + 16);
            }

            // Draw people in elevator
            const people = elevator.queue.people;
            for (let idx = 0; idx < people.length; idx++) {
                const p = people[idx];
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const px = carX + 25 + col * 45;
                const py = carY + 45 + row * 45;

                this.drawPerson(ctx, px, py, p.destinationFloor, p.destinationFloor > elevator.currentFloor, true);
            }

            // Capacity indicator
            ctx.fillStyle = c.textDim;
            ctx.font = '300 8px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${people.length}/${elevator.capacity}`, carX + carWidth / 2, carY + carHeight - 5);
        }

        // Draw corner brackets for architectural feel
        this.drawCornerBracket(ctx, padding - 5, -5, 20, c.amber);
        this.drawCornerBracket(ctx, canvas.width - padding + 5, -5, 20, c.amber, true, false);
        this.drawCornerBracket(ctx, padding - 5, canvas.height + 5, 20, c.amber, false, true);
        this.drawCornerBracket(ctx, canvas.width - padding + 5, canvas.height + 5, 20, c.amber, true, true);
    }

    drawPerson(ctx, x, y, destFloor, goingUp, inElevator = false) {
        const c = this.colors;
        const color = goingUp ? c.cyan : c.red;
        const glow = goingUp ? c.cyanGlow : c.redGlow;

        // Person body - geometric humanoid shape
        const size = inElevator ? 14 : 16;

        // Glow effect
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8;

        // Head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - size * 0.6, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Body (trapezoid)
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4, y);
        ctx.lineTo(x + size * 0.4, y);
        ctx.lineTo(x + size * 0.25, y + size * 0.7);
        ctx.lineTo(x - size * 0.25, y + size * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Destination badge
        ctx.fillStyle = c.bgDeep;
        ctx.beginPath();
        ctx.arc(x, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = `700 ${size * 0.45}px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(destFloor.toString(), x, y + size * 0.25);
        ctx.textBaseline = 'alphabetic';
    }

    drawCornerBracket(ctx, x, y, size, color, flipX = false, flipY = false) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const dx = flipX ? -1 : 1;
        const dy = flipY ? -1 : 1;

        ctx.moveTo(x + size * dx, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + size * dy);

        ctx.stroke();
    }
}
export { Simulation };
