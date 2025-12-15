import Queue from './queue.js';

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

class Elevator {
    constructor(capacity, loadingTime) {
        this.capacity = capacity; // in number of people
        this.loadingTime = loadingTime; // in seconds
        this.people = []; // current list of people
        this.currentFloor = 0; // current floor
        this.destinationFloor = 0; // destination floor
    }
}

class RegularElevator extends Elevator {
    constructor() {
        super(4, 3); //4 people and 3 seconds to load
    }
}

class Floor {
    constructor(floorNumber) {
        this.floorNumber = floorNumber; // floor number
        this.people = [];
    }
    getPeopleOnFloor() {
        return this.people.length;
    }
    addPerson(person) {
        this.people.push(person);
    }
    removePerson(person) {
        this.people = this.people.filter(p => p !== person);
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
            this.elevators.push(new RegularElevator());
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
        const names = ["a", "b", "c", "d", "e", "f", "g", "h"];
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
    constructor(numElevators, numFloors, peoplePerSecond) {
        this.numElevators = numElevators; // number of elevators in the building
        this.numFloors = numFloors; // number of floors in the building
        this.peoplePerSecond = peoplePerSecond; // number of people entering the building per second

        // create the Building instance
        this.building = new Building(this.numElevators, this.numFloors);
    }
    step() {
        // Implement the logic to simulate one step of the simulation
        // generate people randomly
        this.building.generatePeopleRandomly(this.peoplePerSecond);
        // update the state of the building and elevators
        // check if all people have reached their destination
        console.log(this.building);
    }
    run() {
        setInterval(() => this.step(), 1000);
    }
}

export { Simulation };
