/**
 * A basic FIFO queue data structure for managing people.
 * Uses an internal array (`people`) and provides standard queue operations.
 * Serves as the base class for FloorQueue and ElevatorQueue.
 */
export class Queue {
    constructor() {
        this.people = [];
    }

    // Add an element to the end of the queue
    enqueue(element) {
        this.people.push(element);
    }

    // Remove and return the first element from the queue
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        return this.people.shift();
    }

    // Return the first element without removing it
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.people[0];
    }

    // Check if the queue is empty
    isEmpty() {
        return this.people.length === 0;
    }

    // Return the size of the queue
    size() {
        return this.people.length;
    }
}

/**
 * A specialized queue for building floors, extending Queue.
 * Provides directional dequeue methods that remove the first person
 * whose destination is above or below a given floor number.
 * Used by Floor to manage people waiting for an elevator.
 */
export class FloorQueue extends Queue {
    dequeueNextWithDestinationAbove(floor) {
        if (!this.isEmpty()) {
            //find first person in queue who's destination is above the current floor
            for (let i = 0; i < this.people.length; i++) {
                if (this.people[i].destinationFloor > floor) {
                    return this.people.splice(i, 1)[0];
                }
            }
        }
        return null;
    }

    dequeueNextWithDestinationBelow(floor) {
        if (!this.isEmpty()) {
            //find first person in queue who's destination is below the current floor
            for (let i = 0; i < this.people.length; i++) {
                if (this.people[i].destinationFloor < floor) {
                    return this.people.splice(i, 1)[0];
                }
            }
        }
        return null;
    }
}

/**
 * A specialized queue for elevators, extending Queue.
 * Overrides dequeue to remove the first person whose destination
 * matches an exact floor number, used when unloading passengers.
 */
export class ElevatorQueue extends Queue {
    // Remove and return the first element from the queue
    dequeue(floor) {
        if (!this.isEmpty()) {
            //find first person in queue who's destination matches the current floor
            for (let i = 0; i < this.people.length; i++) {
                if (this.people[i].destinationFloor === floor) {
                    return this.people.splice(i, 1)[0];
                }
            }
        }
        return null;
    }
}