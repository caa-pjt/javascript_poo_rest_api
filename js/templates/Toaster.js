export class Toaster {
	
	static clearToasters() {
		// Supprime toutes les notifications existantes
		document.querySelectorAll('.alert').forEach(alert => alert.remove());
	}
	
	static createToaster(message, type = 'success') {
		// Supprime les anciennes notifications
		this.clearToasters();
		
		const toaster = document.createElement('div');
		toaster.classList.add("text-center", "alert", "alert-" + type);
		toaster.textContent = message;
		toaster.style.position = 'fixed';
		toaster.style.left = '50%';
		toaster.style.transform = 'translateX(-50%)';
		toaster.style.bottom = '15px';
		toaster.style.opacity = '0';
		toaster.style.zIndex = '9999';
		toaster.style.paddingRight = '40px';
		toaster.style.paddingLeft = '40px';
		toaster.style.transition = 'opacity 0.3s ease-in-out';
		
		document.body.appendChild(toaster);
		toaster.classList.add('show');
		
		this.show(toaster);
	}
	
	static show(toaster) {
		toaster.style.opacity = '1';
		
		setTimeout(() => {
			this.hide(toaster);
		}, 3000);
	}
	
	static hide(toaster) {
		toaster.style.opacity = '0';
		setTimeout(() => {
			toaster.remove();
		}, 300); // Temps correspondant à la durée de la transition
	}
}
