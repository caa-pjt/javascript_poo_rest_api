export class Subject {
    constructor() {
        this.observers = [];
    }

    subscribe(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            console.log('Observer subscribed:', observer);
			console.log('Current Observers:', this.observers);
        }
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
        console.log('Observer unsubscribed:', observer);
    }

    notify(notification) {
        console.log('Notify:', notification);
		console.log('Observers count:', this.observers.length);
        this.observers.forEach(observer => observer.update(notification));
    }
}
