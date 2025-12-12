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
    constructor(speed, capacity, loadingTime, people, currentFloor, destinationFloor, getNextDestination, getPeopleOnFloor) {
        this.speed = speed; // in floors per second
        this.capacity = capacity; // in number of people
        this.loadingTime = loadingTime; // in seconds
        this.people = people; // current list of people
        this.currentFloor = currentFloor; // current floor
        this.destinationFloor = destinationFloor; // destination floor
        this.getNextDestination = getNextDestination; // function to get next destination floor
        this.getPeopleOnFloor = getPeopleOnFloor; // function to get number of people on a floor
    }
}

class Floor {
    constructor(floorNumber) {
        this.floorNumber = floorNumber; // floor number
        this.people = new Queue();
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
            //this.elevators.push(new Elevator(1, 5, 2, [], 0, 0, () => { }, () => { }));
        }
    }
    getFloor(floorNumber) {
        return this.floors.find(floor => floor.floorNumber === floorNumber);
    }
    getNumberFloors() {
        return this.floors.length;
    }
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
        this.building = new Building(this.numElevators, this.numFloors)
    }
    run() {
        // Implement the logic to run the simulation
    }
}

export { Simulation };
