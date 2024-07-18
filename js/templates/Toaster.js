export class Toaster {

    static createToaster(message, type = 'success') {
        this.toaster = document.createElement('div');
        this.toaster.classList.add("text-center", "alert", "alert-" + type);
        this.toaster.textContent = message;
        this.toaster.style.position = 'fixed';
        this.toaster.style.bottom = '10px';
        this.toaster.style.right = '20px';
        this.toaster.style.opacity = '0';
        this.toaster.style.zIndex = '9999';
        this.toaster.style.paddingRight = '30px';
        this.toaster.style.paddingLeft = '30px';
        this.toaster.style.transition = 'opacity 0.3s ease-in-out';

        document.body.appendChild(this.toaster);
        this.toaster.classList.add('show');

        this.show(message);
    }

    static show(message) {
        this.toaster.textContent = message;
        this.toaster.style.opacity = '1';

        setTimeout(() => {
            this.hide();
        }, 4000);
    }

    static hide() {
        this.toaster.style.opacity = '0';
        setTimeout(() => {
            this.toaster.remove();
        }, 300); // Temps correspondant à la durée de la transition
    }
}