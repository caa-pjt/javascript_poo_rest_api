export class Subject {
    constructor() {
        this.observers = [];
    }

    subscribe(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            console.log('Observer subscribed:', observer);
        }
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
        console.log('Observer unsubscribed:', observer);
    }

    notify(notification) {
        console.log('Notify:', notification);
        this.observers.forEach(observer => observer.update(notification));
    }
}
