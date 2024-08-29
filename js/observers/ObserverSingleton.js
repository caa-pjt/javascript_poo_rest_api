import { Subject } from './Subject.js';

export class ObserverSingleton {
	// L'instance de singleton est stockée ici
	static instance = null;
	
	constructor() {
		// Si une instance existe déjà, l'instance est retournée
		if (ObserverSingleton.instance) {
			return ObserverSingleton.instance;
		}
		
		// Sinon, créez une nouvelle instance de Subject
		ObserverSingleton.instance = new Subject();
		return ObserverSingleton.instance;
	}
	
	// Méthode statique pour obtenir l'instance du singleton
	static getInstance() {
		// Si l'instance n'existe pas encore elle est initialisée
		if (!ObserverSingleton.instance) {
			ObserverSingleton.instance = new Subject();
		}
		return ObserverSingleton.instance;
	}
}
