/**
 * @fileOverview
 * @author Carlos Antunes
 * @extends FormBuilder
 * @description ModalFormBuilder est une classe qui étend FormBuilder et qui permet de créer un formulaire dans une modal
 * @version 1.0.0
 */

import { FormBuilder } from "./FormBuilder.js";
import { ObserverSingleton } from '../observers/ObserverSingleton.js';
import { FormValidator } from './FormValidator.js';

/**
 * @class ModalFormBuilder
 * @extends FormBuilder
 * @property {HTMLElement} modalContainer - Conteneur de la modal
 * @property {HTMLElement} modal - Élément HTML de la modal
 * @property {Object} modalOptions - Options de la modal
 * @property {
 */
export class ModalFormBuilder extends FormBuilder {
    constructor(options) {
        super(options);

        this.subject = ObserverSingleton.getInstance();
        console.log("Modal observer instance:", this.subject);

        this.modalOptions = options.options || {};
        this.modalTitle = this.modalOptions.modalTitle || "Default Title";
        this.hiddenIdInput = this.form.querySelector('input[name="id"]');

        this.modalContainer = document.getElementById("add_item");
        this.buildModal();

        // Créer une instance de FormValidator pour valider le formulaire
        // avec les règles de validation passées en paramètre
        this.formValidator = new FormValidator({
            form: this.form,
            validationRules: this.modalOptions.validationOption.validate || {},
            local: this.modalOptions.validationOption.local || 'en',
            observeOnInput: this.modalOptions.validationOption.observeOnInput || false
        });

        // Ajout de l'écouteur d'événement pour la touche Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    /**
     * Construit la modal
     * @returns {void}
     *
     */
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

        this.form.addEventListener('submit', (e) => this.#handleSubmit(e));
    }

    /**
     * Gère la soumission du formulaire
     * @param e
     * @returns {void}
     */
    #handleSubmit(e) {
        e.preventDefault();

        // Valider le formulaire
        this.formValidator.validate(this.form);
        // Vérifier si le formulaire est valide
        if (!this.formValidator.isValide()) {
            // Traiter les erreurs
            console.log('Validation errors:', this.formValidator.getErrors());
            return;
        }

        this.formValidator.resetValidationClasses();

        // Récupérer les données du formulaire
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Ajouter les états des cases à cocher au data
        const checkboxes = this.form.querySelectorAll('input[type="checkbox"]');
        const checkboxStates = {};
        checkboxes.forEach((checkbox) => {
            checkboxStates[checkbox.name] = checkbox.checked;
        });
        Object.assign(data, checkboxStates);

        // Notifier avec les données validées
        this.subject.notify({ type: "addDataOnSubmitForm", data });
    }

    /**
     * Crée un bouton pour ajouter un nouvel article
     * @returns {void}
     */
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
     * Affiche la modal et met le focus sur le premier champ du formulaire
     * @returns {void}
     */
    showModal() {
        this.modal.style.display = "flex";

        // Focus sur le premier champ du formulaire
        const firstInput = this.form.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }

    /**
     * Ferme la modal et réinitialise le formulaire
     * @returns {void}
     */
    hideModal() {
        this.modal.style.display = "none";

        const hiddenIdInput = this.form.querySelector('input[name="id"]');
        if (hiddenIdInput) {
            hiddenIdInput.value = "";
        }
        this.form.reset();
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

    /**
     * Remplit le formulaire avec les données passées en paramètre et affiche la modal de modification de l'article
     * sélectionné dans le tableau de données de l'application principale
     * @param {Object} data - Données à afficher dans le formulaire
     */
    renderWithData(data = {}) {
        // Mettre à jour les champs du formulaire avec les données fournies
        Object.keys(data).forEach(key => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = data[key]; // Pour les cases à cocher
                } else {
                    input.value = data[key]; // Pour les autres champs
                }
            }
        });

        // Mettre à jour l'input caché pour l'ID
        const hiddenIdInput = this.form.querySelector('input[name="id"]');
        if (hiddenIdInput) {
            hiddenIdInput.value = data.id || "";
        }

        this.showModal();
    }

    /**
     * Rend les données dans le formulaire de la modal
     * @param {Object} data - Données à afficher dans le formulaire
     * @returns {void}
     */
    #renderData(data) {
        for (const [key, value] of Object.entries(data)) {
            const input = this.form.querySelector(`[name=${key}]`);
            if (input) {
                input.value = value;
            }
        }
    }

}
