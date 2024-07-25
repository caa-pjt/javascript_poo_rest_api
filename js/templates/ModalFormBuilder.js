import { FormBuilder } from "./FormBuilder.js";

export class ModalFormBuilder extends FormBuilder {
    constructor(options) {
        super(options);
        this.modalOptions = options.options || {};
        this.modalTitle = this.modalOptions.modalTitle || "Default Title";

        this.modalContainer = document.getElementById("add_item");
        this.buildModal();
    }

    buildModal() {
        // Crée les éléments de la modal en utilisant `insertAdjacentHTML`
        this.modalContainer.insertAdjacentHTML(
            "beforeend",
            `
        <div class="modal" id="editModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); justify-content: center; align-items: center; z-index: 10;">
            <div class="modal-dialog" style="background-color: white; padding: 20px; border-radius: 5px; width: 90%; max-width: 600px; position: relative;">
                <div class="modal-content" style="border:none; display:block;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                      <h5 class="modal-title">${this.modalTitle}</h5>
                      <button type="button" class="close-modal" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                    <div class="modal-body" id="modal-body">
                        <!-- Form will be injected here -->
                    </div>
                    <div class="modal-footer d-flex justify-content-end gap-2">
                        <button type="submit" id="modal-submit" form="${this.form.id}" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `
        );

        console.log("Form ID:", this.form.id);

        this.modal = document.getElementById("editModal");

        // Insère le formulaire dans le corps de la modal
        const modalBody = document.getElementById("modal-body");
        if (modalBody) {
            this.#appendForm(modalBody);
        }

        this.#newItemButton();

        // Ajoute des événements pour fermer la modal
        const closeModalButton = document.querySelector(".close-modal");
        if (closeModalButton) {
            closeModalButton.addEventListener("click", () => this.hideModal());
        }

        const dismissButtons = document.querySelectorAll('[data-dismiss="modal"]');
        dismissButtons.forEach((btn) => {
            btn.addEventListener("click", () => this.hideModal());
        });

        this.form.onsubmit = (e) => {
            e.preventDefault();
            console.log("Form submitted");
            let data = new FormData(e.target);
            debugger;
            //this.hideModal();
        };
    }

    #newItemButton() {
        // <div class="btn btn-primary" id="add-new">Ajouter un article</div>
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.classList.add("btn", "btn-primary");
        button.textContent = "Nouvel article";
        button.addEventListener("click", () => this.showModal());
        this.modalContainer.appendChild(button);
    }

    /**
     * Affiche la modal
     */
    showModal() {
        this.modal.style.display = "flex";
    }

    /**
     * Ferme la modal
     */
    hideModal() {
        this.modal.style.display = "none";
    }

    /**
     * Surcharge la méthode appendIn pour insérer le formulaire dans la modal
     * @param {HTMLElement} cible - Élément HTML où insérer le formulaire
     */
    #appendForm(cible) {
        if (cible instanceof HTMLElement) {
            return cible.appendChild(this.form);
        }
    }
}
