
export default class Queue {
    constructor() {
        this.storage = [];
    }

    // Add an element to the end of the queue
    enqueue(element) {
        this.storage.push(element);
    }

    // Remove and return the first element from the queue
    dequeue() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }
        return this.storage.shift();
    }

    // Return the first element without removing it
    peek() {
        if (this.isEmpty()) {
            return "Queue is empty";
        }
        return this.storage[0];
    }

    // Check if the queue is empty
    isEmpty() {
        return this.storage.length === 0;
    }

    // Return the size of the queue
    size() {
        return this.storage.length;
    }
}