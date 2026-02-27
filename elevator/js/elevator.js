import { ElevatorQueue, FloorQueue } from './queue.js';
import { ElevatorCanvas } from './elevatorcanvas.js';
import { ElevatorConsole } from './elevatorconsole.js';

/**
 * Represents an individual person in the simulation.
 * Each person has a name, an origin floor, and a destination floor.
 * Persons are held in FloorQueues while waiting and in ElevatorQueues while riding.
 */
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

/**
 * Base class for elevators. Handles movement, passenger loading/unloading,
 * and destination selection. Each elevator holds an ElevatorQueue of passengers,
 * a reference to the building's floors, and tracks its current and destination floors.
 * Movement is one floor per step, and only one action (move, unload, or load)
 * occurs per call to moveAndLoad().
 */
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

/**
 * A standard elevator with a fixed capacity of 4 people.
 * Extends Elevator with no additional behavior.
 */
class RegularElevator extends Elevator {
    constructor(floors) {
        super(4, floors); //4 person capacity
    }
}

/**
 * Represents a single floor in the building. Manages a FloorQueue of
 * waiting people and tracks whether the up/down call buttons are pressed.
 * Button state is recalculated each step based on the destinations of
 * people currently waiting on this floor.
 */
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

/**
 * Represents the entire building containing floors and elevators.
 * Creates Floor and RegularElevator instances on construction.
 * Provides methods to advance all elevators one step and to
 * randomly generate new people on floors.
 */
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

/**
 * Top-level simulation controller. Creates a Building and a set of renderers
 * (ElevatorCanvas and ElevatorConsole), then runs a step loop on a 1-second
 * interval. Each step generates new people, updates floor buttons, advances
 * all elevators, and triggers rendering. Can be paused and resumed.
 */
class Simulation {
    constructor(numElevators, numFloors, peoplePerSecond, canvas) {
        this.numElevators = numElevators; // number of elevators in the building
        this.numFloors = numFloors; // number of floors in the building
        this.peoplePerSecond = peoplePerSecond; // number of people entering the building per second
        // create the Building instance
        this.isRunning = false;
        this.intervalId = null; // to store the interval ID for pausing
        this.building = new Building(this.numElevators, this.numFloors);
        this.renderers = [];
        if (canvas) {
            this.renderers.push(new ElevatorCanvas(canvas));
        }
        this.renderers.push(new ElevatorConsole());
    }
    set domStats(stats) {
        for (let renderer of this.renderers) {
            if (renderer.domStats !== undefined || renderer instanceof ElevatorCanvas) {
                renderer.domStats = stats;
            }
        }
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
        for (let renderer of this.renderers) {
            renderer.render(this.building);
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
}
export { Simulation, Building, ElevatorCanvas, ElevatorConsole };
