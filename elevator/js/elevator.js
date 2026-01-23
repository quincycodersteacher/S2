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

    // Helper to draw rounded rectangle
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // Get color for person based on destination
    getPersonColor(destinationFloor) {
        const colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEAA7', // Yellow
            '#DDA0DD', // Plum
            '#98D8C8', // Mint
            '#F7DC6F', // Gold
        ];
        return colors[destinationFloor % colors.length];
    }

    animateCanvas() {
        this.timer++;
        const ctx = this.ctx;
        const canvas = this.canvas;
        const floorHeight = (canvas.height - 60) / this.numFloors; // Reserve space for header
        const headerHeight = 60;
        const elevatorWidth = 100;
        const elevatorGap = 15;
        const elevatorAreaWidth = (elevatorWidth + elevatorGap) * this.numElevators + 30;
        const elevatorStartX = canvas.width - elevatorAreaWidth + 20;
        const personRadius = 14;

        // Clear canvas with gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#1a1a2e');
        bgGradient.addColorStop(1, '#16213e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw header panel
        const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        headerGradient.addColorStop(0, '#0f3460');
        headerGradient.addColorStop(1, '#533483');
        ctx.fillStyle = headerGradient;
        this.roundRect(ctx, 10, 10, canvas.width - 20, 45, 10);
        ctx.fill();

        // Header text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('🏢 Elevator Simulation', 25, 40);

        // Stats
        ctx.font = '14px Arial';
        ctx.fillStyle = '#e94560';
        ctx.fillText(`⏱ Time: ${this.timer}s`, canvas.width - 280, 38);

        let totalWaiting = 0;
        for (let floor of this.building.floors) {
            totalWaiting += floor.queue.people.length;
        }
        ctx.fillStyle = '#4ECDC4';
        ctx.fillText(`👥 Waiting: ${totalWaiting}`, canvas.width - 170, 38);

        let totalInElevators = 0;
        for (let elev of this.building.elevators) {
            totalInElevators += elev.queue.people.length;
        }
        ctx.fillStyle = '#96CEB4';
        ctx.fillText(`🛗 In Transit: ${totalInElevators}`, canvas.width - 70, 38);

        // Draw elevator shaft background
        ctx.fillStyle = 'rgba(15, 52, 96, 0.6)';
        this.roundRect(ctx, elevatorStartX - 15, headerHeight + 5, elevatorAreaWidth - 10, canvas.height - headerHeight - 15, 10);
        ctx.fill();

        // Draw floors
        for (let f = 0; f < this.numFloors; f++) {
            const y = canvas.height - (f + 1) * floorHeight;

            // Floor background
            const floorGradient = ctx.createLinearGradient(0, y, 0, y + floorHeight);
            floorGradient.addColorStop(0, 'rgba(30, 55, 90, 0.4)');
            floorGradient.addColorStop(1, 'rgba(20, 40, 70, 0.4)');
            ctx.fillStyle = floorGradient;
            this.roundRect(ctx, 10, y + 2, elevatorStartX - 30, floorHeight - 4, 8);
            ctx.fill();

            // Floor divider line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(10, y + floorHeight);
            ctx.lineTo(canvas.width - 10, y + floorHeight);
            ctx.stroke();

            // Floor label badge
            ctx.fillStyle = '#e94560';
            this.roundRect(ctx, 15, y + floorHeight / 2 - 15, 55, 30, 6);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`F${f}`, 42, y + floorHeight / 2 + 5);
            ctx.textAlign = 'left';

            // Draw up/down buttons
            const floor = this.building.getFloor(f);
            const btnX = 75;
            const btnY = y + floorHeight / 2 - 12;

            // Up button
            if (f < this.numFloors - 1) {
                ctx.fillStyle = floor.upButtonPressed ? '#4ECDC4' : 'rgba(78, 205, 196, 0.3)';
                this.roundRect(ctx, btnX, btnY - 2, 20, 12, 3);
                ctx.fill();
                ctx.fillStyle = floor.upButtonPressed ? '#1a1a2e' : 'rgba(255,255,255,0.5)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('▲', btnX + 10, btnY + 7);
            }

            // Down button
            if (f > 0) {
                ctx.fillStyle = floor.downButtonPressed ? '#FF6B6B' : 'rgba(255, 107, 107, 0.3)';
                this.roundRect(ctx, btnX, btnY + 14, 20, 12, 3);
                ctx.fill();
                ctx.fillStyle = floor.downButtonPressed ? '#1a1a2e' : 'rgba(255,255,255,0.5)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('▼', btnX + 10, btnY + 23);
            }
            ctx.textAlign = 'left';
        }

        // Draw elevators
        for (let i = 0; i < this.building.elevators.length; i++) {
            const elevator = this.building.elevators[i];
            const x = elevatorStartX + i * (elevatorWidth + elevatorGap);
            const y = canvas.height - (elevator.currentFloor + 1) * floorHeight;

            // Elevator car shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.roundRect(ctx, x + 4, y + 6, elevatorWidth - 8, floorHeight - 10, 8);
            ctx.fill();

            // Elevator car body
            const elevGradient = ctx.createLinearGradient(x, y, x + elevatorWidth, y);
            elevGradient.addColorStop(0, '#2d4a6d');
            elevGradient.addColorStop(0.5, '#3d5a7d');
            elevGradient.addColorStop(1, '#2d4a6d');
            ctx.fillStyle = elevGradient;
            this.roundRect(ctx, x, y + 2, elevatorWidth - 8, floorHeight - 8, 8);
            ctx.fill();

            // Elevator doors
            ctx.fillStyle = '#1a1a2e';
            const doorWidth = (elevatorWidth - 20) / 2 - 2;
            ctx.fillRect(x + 6, y + 20, doorWidth, floorHeight - 35);
            ctx.fillRect(x + 10 + doorWidth, y + 20, doorWidth, floorHeight - 35);

            // Elevator floor indicator
            ctx.fillStyle = '#e94560';
            this.roundRect(ctx, x + (elevatorWidth - 8) / 2 - 15, y + 6, 30, 14, 4);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`F${elevator.currentFloor}`, x + (elevatorWidth - 8) / 2, y + 16);

            // Direction indicator
            const direction = elevator.destinationFloor > elevator.currentFloor ? '▲' :
                             elevator.destinationFloor < elevator.currentFloor ? '▼' : '●';
            const dirColor = elevator.destinationFloor > elevator.currentFloor ? '#4ECDC4' :
                            elevator.destinationFloor < elevator.currentFloor ? '#FF6B6B' : '#888';
            ctx.fillStyle = dirColor;
            ctx.font = '12px Arial';
            ctx.fillText(direction, x + (elevatorWidth - 8) / 2 + 22, y + 16);
            ctx.textAlign = 'left';

            // Draw people in elevator
            const people = elevator.queue.people;
            const maxPerRow = 2;
            for (let idx = 0; idx < people.length; idx++) {
                const p = people[idx];
                const row = Math.floor(idx / maxPerRow);
                const col = idx % maxPerRow;
                const personX = x + 20 + col * 30;
                const personY = y + 35 + row * 30;

                // Person shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(personX + 2, personY + 2, personRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Person circle
                ctx.fillStyle = this.getPersonColor(p.destinationFloor);
                ctx.beginPath();
                ctx.arc(personX, personY, personRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Person border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Destination text
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(p.destinationFloor.toString(), personX, personY + 4);
                ctx.textAlign = 'left';
            }

            // Elevator label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Elevator ${i + 1}`, x + (elevatorWidth - 8) / 2, y + floorHeight - 12);
            ctx.textAlign = 'left';
        }

        // Draw people on floors
        for (let f = 0; f < this.numFloors; f++) {
            const floor = this.building.getFloor(f);
            const y = canvas.height - (f + 1) * floorHeight;
            const people = floor.queue.people;
            const startX = 105;
            const maxPerRow = 8;

            for (let idx = 0; idx < people.length; idx++) {
                const p = people[idx];
                const row = Math.floor(idx / maxPerRow);
                const col = idx % maxPerRow;
                const personX = startX + col * 32;
                const personY = y + 25 + row * 35;

                // Person shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(personX + 2, personY + 2, personRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Person circle with destination color
                ctx.fillStyle = this.getPersonColor(p.destinationFloor);
                ctx.beginPath();
                ctx.arc(personX, personY, personRadius, 0, 2 * Math.PI);
                ctx.fill();

                // Person border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Destination text
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(p.destinationFloor.toString(), personX, personY + 4);
                ctx.textAlign = 'left';
            }
        }

        // Legend
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Arial';
        ctx.fillText('● Person (number = destination floor)', 15, canvas.height - 8);
    }
}
export { Simulation };
