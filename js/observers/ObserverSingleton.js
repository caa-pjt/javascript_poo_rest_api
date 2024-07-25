import { Subject } from './Subject.js';

export class ObserverSingleton {
    static instance = null;

    constructor() {
        if (ObserverSingleton.instance) {
            return ObserverSingleton.instance;
        }

        ObserverSingleton.instance = new Subject();
        return ObserverSingleton.instance;
    }

    static getInstance() {
        if (!ObserverSingleton.instance) {
            new ObserverSingleton();
        }
        return ObserverSingleton.instance;
    }
}
