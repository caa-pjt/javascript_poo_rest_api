export class Subject {
    constructor() {
        this.observers = [];
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(notification) {
        console.log('Notify:', notification);
        this.observers.forEach(observer => observer.update(notification));
    }
}
