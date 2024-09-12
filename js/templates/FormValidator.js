/**
 * @fileOverview Validates a form and returns List of errors in JSON format || Validation errors directly below
 * fields not validated
 * @version 1.2.1
 * @source https://github.com/caa-pjt/form-validator.git
 * @changelog
 * - [1.2.1] - 2024-08-01
 *  - Ajout de la méthode `resetValidationClassest` pour réinitialiser les classes de validation sur les champs du formulaire.
 * - modification de la méthode `#setHtmlError` pour vérifier si l'élément suivant est un élément `span` avant de l'ajouter.
 * - modification de la méthode `#removeHtmlError` pour vérifier si l'élément parent contient la classe `was-validated` avant de continuer.
 * - [1.2.0] - 2024-07-29
 *   - Ajout de la méthode `#removeInputListeners` pour supprimer les listeners d'événements `input` après validation réussie.
 *   - Mise à jour de la méthode `isValide()` pour supprimer les listeners après validation réussie.
 *   - Correction de la gestion des erreurs pour les éléments `input` lorsque les erreurs sont réinitialisées.
 *   - Correction de la méthode `#setError` pour initialiser les erreurs si elles sont `undefined`.
 *   - Correction de la méthode `#formData` pour vérifier si le formulaire contient des éléments avant de continuer.
 *   - Correction de la méthode `#addInputListeners` pour vérifier si le formulaire contient des éléments avant de continuer.
 *   - Correction de la méthode `#updateData` pour vérifier si l'élément `input` est une case à cocher.
 *   - Correction de la méthode `#validateSingleInput` pour réinitialiser les erreurs pour chaque champ avant la validation.
 *   - Déplacement des messages d'erreur dans un fichier séparé `locales.js`.
 *   - Méthode `validate` appel maintenant `setErrors` automatiquement après la validation.
 * - [1.1.0] - 2024-07-15
 *   - Ajout de la méthode `#removeHtmlError` pour supprimer les erreurs des éléments `input` du formulaire.
 *   - changée signature de la classe `FormValidator` pour initialiser les erreurs et les champs avant chaque validation.
 *   - Ajout de la méthode `#addInputListeners` pour ajouter des listeners d'événements `input` aux éléments `input` du formulaire.
 *   - Re factorisation de la méthode `validate` pour inclure la logique de gestion des listeners d'événements `input`.
 *   - Correction de l'initialisation des erreurs et des inputs avant chaque validation.
 * - [1.0.0] - 2024-07-01
 *   - Première version de `FormValidator` avec validation des champs du formulaire et gestion des erreurs.
 *   - Méthodes de validation pour les règles : `required`, `email`, `min`, `max`, et `match`.
 */

import locales from '../locales/Locales.js'

export class FormValidator {

    #FormValidatorDebug = false

    /* List of fields (inputs) in the form */
    inputs = []
    // Object containing the data of the form
    inputElements = {}

    /**
     * Default options
     */
    options = {
        form : null,
        local : "en",
        observeOnInput : false,
    }

    /**
     * @property {SubmitEvent} options.form          - form : event (form sent by the event)
     * @property {Object} options.validationRules    - validationRules : { attrInputName : rules separator pipe (|) }
     *                                               - Example: {'email' : 'required|email','textarea' : 'required|min:10|max:255'}
     * @property {string|undefined} options.local    - local : "en"
     *                                               - (two digits lowercase. Default value "en")
     * @param options
     */
    constructor(options = {}) {
		this.options = Object.assign({}, this.options || {}, options);
        this.errors = {};
        this.debounceDelay = 400; // Default debounce delay in milliseconds
        this.inputListeners = new Map(); // Map to store input listeners
    }

    /**
     * Validate the form and set errors if any are found
     *
     * @param {HTMLFormElement} formElement - The form element to validate
     */
    validate(formElement) {
        this.errors = {};  // Reset errors before each validation
        this.inputs = [];  // Reset inputs before each validation
        this.inputElements = {}; // Reset input elements
        this.#formData(formElement);

        // Add input listeners if observeOnInput is true
        if (this.options.observeOnInput) {
            this.#addInputListeners();
        }

        // Automatically set errors after validation
        this.setErrors();
    }

    /**
     * Create formData Object
     *
     * @param {HTMLFormElement} formElement - The form element to extract data from
     * @returns {object[]|error|boolean} - throws an error if no data is retrieved
     */
	#formData(formElement) {
		if (!formElement || !(formElement instanceof HTMLFormElement)) {
			console.error(`The provided element is not a valid HTMLFormElement.`);
			return false;
		}
		
		// Crée un objet FormData depuis le formulaire
		const formData = Object.fromEntries(new FormData(formElement).entries());
		this.data = formData;
		
		if (formElement.elements.length === 0) {
			console.error(`No FormData inputs detected! Please ensure the form contains inputs.`);
			return;
		}
		Array.from(formElement.elements).forEach((input) => {
			this.inputs.push(input);
			
			const inputName = input.getAttribute('name');
			if (inputName) {
				this.inputElements[inputName] = input;
			}
		});
		
		this.#validateData();
	}

    /**
     * Add input listeners to the form inputs
     * @returns {void} - Add event listeners to the form inputs
     */
    #addInputListeners() {
        this.inputs.forEach(input => {
            const listener = this.#debounce(() => {
                this.#updateData(input);
                this.#validateSingleInput(input);
            }, this.debounceDelay);

            input.addEventListener('input', listener);
            this.inputListeners.set(input, listener); // Add listener to the map
        });
    }

    /**
     * Remove input listeners from the form inputs
     * @returns {void} - Remove event listeners from the form inputs
     */
    #removeInputListeners() {
        this.inputListeners.forEach((listener, input) => {
            input.removeEventListener('input', listener);
        });
        this.inputListeners.clear(); // Clear the map
    }

    /**
     * Debounce function to limit the number of times a function is called
     * @param callback - The function to call
     * @param delay - The delay in milliseconds
     * @returns {(function(): void)|*} - The debounced function
     */
    #debounce(callback, delay) {
        let timer;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timer);
            timer = setTimeout(function() {
                callback.apply(context, args);
            }, delay);
        }
    }

    /**
     * Update the data object with the input value
     *
     * @param input - The input element to update
     */
    #updateData(input) {
        const inputName = input.getAttribute('name');
        if (input.type === 'checkbox') {
            this.data[inputName] = input.checked ? input.value : '';
        } else {
            this.data[inputName] = input.value;
        }
    }

    /**
     * Validate a single input field based on the validation rules
     *
     * @param input - The input element to validate
     * @returns {void}
     */
    #validateSingleInput(input) {
        const inputName = input.getAttribute('name');
        const rules = this.options.validationRules[inputName]?.split('|') || [];

        this.errors[inputName] = {};  // Reset errors for this input

        this.#rulesValidator(inputName, rules);
        this.setErrors();
    }

    /**
     * Add an error according to the validation rules
     *
     * @property {object[]} dataAndRules                - Object containing the list of fields and validation rules
     * @property {string<inputAttrName>} object.name    - Name of the name attribute of the input
     * @property {string} rules                         - Validation rules separated by separator pipe (|)
     *  - Example: {'email' : 'required|email','textarea' : 'required|min:10|max:255'}
     */
    #validateData() {
        const dataAndRules = this.options.validationRules

        for (const input in dataAndRules) {
            if (this.data[input] === undefined) {
                console.error(`Input name: [${input}] does not exist`)
            } else {
                const rules = dataAndRules[input].split('|')
                this.#rulesValidator(input, rules)
            }
        }
    }

    /**
     * Receive the name of the input to validate and call the function according to the validation rules
     *
     * @param {string} input - Input attribute name
     * @param {string} rules - Validation rule and function to call
     */
	#rulesValidator(input, rules) {
		if (!this.#hasValidationRules(input)) {
			return; // Early return si aucune règle de validation n'existe
		}
		
		rules.forEach((ruleString) => {
			const { func, param } = this.#parseRule(ruleString);
			this.#applyRule(func, param, input);
		});
		
		if (this.#FormValidatorDebug) {
			console.log(input);
		}
	}
	
	/**
	 * Sub-function to check if the input has validation rules
	 * @param input
	 * @returns {boolean}
	 */
	#hasValidationRules(input) {
		if (!this.options.validationRules.hasOwnProperty(input)) {
			if (this.#FormValidatorDebug) {
				console.log(`The "${input}" has no defined validation rules. Ignored.`);
			}
			return false;
		}
		return true;
	}
	
	/**
	 * Sub-function to parse the validation rule
	 * @param ruleString
	 * @returns {{func: *, param: (*|null)}}
	 */
	#parseRule(ruleString) {
		let rule = ruleString.split(':');
		return {
			func: rule[0],
			param: rule[1] || null,
		};
	}
	
	/**
	 * Sub-function to apply the validation rule
	 * @param func
	 * @param param
	 * @param input
	 */
	#applyRule(func, param, input) {
		if (typeof this[func] === 'function') {
			param ? this[func](input, param) : this[func](input);
		} else {
			console.error(`The function "${func}" does not exist.`);
		}
	}
	
	
	/**
     *
     * @param {string} AttrName     - Input attribute name
     * @returns {HTMLHtmlElement}   - Input
     */
    #getInput(AttrName){
        return this.inputElements[AttrName];
    }

    /**
     *
     * @returns - errors in JSON format
     */
    getErrors() {
        return this.errors
    }

    /**
     * Check if the form is valid
     *
     * @returns - If empty errors return true
     */
    isValide() {
        const isValid = !(this.errors && Object.keys(this.errors).length > 0);
        if (isValid) {
            this.#removeInputListeners(); // Remove input listeners if no errors
        }
        return isValid;
    }

    /**
     * @returns - validated data [object format]
     */
    getData(){
        return this.data
    }

    /**
     * Reset the validation classes on the form inputs
     * @returns {void} - Reset the validation classes on the form inputs
     */
    resetValidationClasses() {
        this.inputs.forEach(input => {
            input.classList.remove('was-validated', 'is-invalid');
        });
    }


    /**
     * Add or remove errors from the HTML form (dispatcher)
     *
     * @returns {HTMLElement} Modify HTML (errors)
     */
    setErrors() {
        for (const input in this.errors) {
            // c'est ici que je ne veux pas ajoutter valide si l'input n'est pas dans la liste des champs à valider
            if (!this.options.validationRules.hasOwnProperty(input)) {
                continue; // Ignorez cet input et passez au suivant
            }
            if (this.#FormValidatorDebug) {
                console.log(input)
            }
            const current = this.#getInput(input)
            if(this.errors === undefined || this.errors[input] === undefined){
                this.#removeHtmlError(current)
            }else{
                if(Object.values(this.errors[input]).length > 0){
                    this.#setHtmlError(current, Object.values(this.errors[input])[0])
                } else {
                    this.#removeHtmlError(current);
                }
            }
        }
    }

    /**
     * Add or remove errors from the HTML form (dispatcher)
     * @param {HTMLElement} input   - Input HTML
     * @param {string} error        - Error text
     */
    #setHtmlError(input, error) {

        if(input.classList.contains('is-invalid')){

            if (input.nextElementSibling.tagName === 'SPAN') {
                input.nextElementSibling.innerText === error ? null : input.nextElementSibling.innerText = error
            }
            return false
        }

        input.classList.contains('was-validated') ? input.classList.remove('was-validated') : null
        input.classList.contains('is-invalid') ? null : input.classList.add('is-invalid')

        if (input.nextElementSibling === null) {
            const span = this.#htmlError(input, error)
            input.parentElement.appendChild(span)
            input.parentElement.style.marginBottom = `-${span.offsetHeight}px`

        }else if (input.nextElementSibling.tagName !== 'SPAN'){
            const span = this.#htmlError(input, error)
            input.nextSibling.before(span)
        }

        if (input.nextElementSibling.dataset.inputName === input.getAttribute('name')) {
            const span = input.nextElementSibling
            span.innerText = ''
            span.innerText = error
        }

        this.#FormValidatorDebug ? console.log(`Add error from inputName : ${input.getAttribute('name')}`) : null
    }

    /**
     *
     * @param {HTMLElement} input
     * @param {string} message
     * @returns <span data-input-name="{input.attr.name}" class="help-block">{message}</span>
     */
    #htmlError(input, message){
        const span = document.createElement('span')
        span.dataset.inputName = input.getAttribute('name')
        span.classList.add('help-block')
        span.innerText = message

        return span
    }

    /**
     *
     * @param {HTMLElement} input  - Input HTML
     */
	#removeHtmlError(input) {
		// Si l'input est déjà validé, on n'effectue aucune autre action
		if (input.classList.contains('was-validated')) {
			return; // Sort immédiatement si déjà validé
		}
		
		// Réinitialise la marge inférieure de l'élément parent
		input.parentElement.style.marginBottom = '0px';
		
		// Supprime la classe 'is-invalid' si elle est présente
		if (input.classList.contains('is-invalid')) {
			input.classList.remove('is-invalid');
		}
		
		// Ajoute la classe 'was-validated' si elle n'est pas déjà présente
		if (!input.classList.contains('was-validated')) {
			input.classList.add('was-validated');
		}
		
		// Supprime l'élément suivant s'il est un 'SPAN'
		if (input.nextElementSibling?.tagName === 'SPAN') {
			input.nextElementSibling.remove();
		}
		
		// Affichage en mode débogage
		if (this.#FormValidatorDebug) {
			console.log(`Removed error for inputName: ${input.getAttribute('name')}`);
		}
	}
	
	/* ========================================

    VALIDATION RULES (FUNCTIONS)

    ========================================== */

    /**
     * @param  {string} name        - attribute name of the field (input)
     * @return {requestCallback}    this.#setError(...) - This field cannot be empty, please enter a message
     */
    required(name) {

        if (this.data[name] === '' || this.data[name] === undefined) {
            const currentInput = this.#getInput(name).tagName.toLowerCase()
            if (currentInput === 'select') {
                this.#setError(name, "required", this.#errorMessages("select", {name : name}))
            } else {
                this.#setError(name, "required", this.#errorMessages('empty', {}))
            }
        } else {
            const input = this.#getInput(name)
            this.#removeHtmlError(input)
        }
    }

    /**
     * @param  {string} name    - attribute name of the field (input)
     * @return {requestCallback} this.#setError(...) - The email is not valid
     */
	email(name) {
		// Regex améliorée pour éviter le ReDoS
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		
		// Test de l'email avec la regex
		if (!emailRegex.test(this.data[name])) {
			this.#setError(name, "email", this.#errorMessages('email', {}));
		} else {
			const input = this.#getInput(name);
			this.#removeHtmlError(input);
		}
	}

    /**
     * @param  {string} name - attribute name of the field (input)
     * @param  {number}  min - min length of characters
     * @return {requestCallback} this.#setError(...) - Erreur nombre de caractéres insuffisants
     */
    min(name, min) {
        if (!parseInt(min)){
            console.error(`The parameter min is not a number`)
        }else{
            if (this.data[name].trim().length < min) {
                this.#setError(name, "min", this.#errorMessages('min', { min: min }))
            }else{
                const input = this.#getInput(name)
                this.#removeHtmlError(input)
            }
        }
    }

    /**
     * @param  {string} name - attribute name of the field (input)
     * @param  {number}  max - max length of characters
     * @return {requestCallback} this.#setError(...) - Erreur nombre maximum de caractères atteint max : ${max}
     */
    max(name, max) {
        if (!parseInt(max)){
            console.error(`The parameter max is not a number`)
        }else{
            if (this.data[name].trim().length > max) {
                this.#setError(name, "max", this.#errorMessages('max', { max: max }))
            }else{
                const input = this.#getInput(name)
                this.#removeHtmlError(input)
            }
        }

    }
    /**
     *
     * @param  {string} name    - attribute name of the field (input)
     * @param {string} regex
     * @return {requestCallback} this.#setError(...) - Erreur le champ est vide
     */
    match(name, regex) {
        if (!this.data[name].match(regex.slice(1, -1))) {
            this.#setError(name, "match", this.#errorMessages('match', {}))
        }else{
            const input = this.#getInput(name)
            this.#removeHtmlError(input)
        }

    }

    /**
     * Adds an error to this.errors object
     *
     * @param {string} name     - attribute name of the field (input)
     * @param {string} type     - type de l'erreur à ajouter - required|min|max|email etc..
     * @param {string} error    - error text

     */
    #setError(name, type, error) {
        this.#FormValidatorDebug ? console.log(`addError - name : ${name} | error : ${error}`) : null
        this.errors === undefined ? this.errors = {} : null

        this.errors[name] === undefined ? this.errors[name] = {} : null

        this.errors[name][type] = error

    }


    /* ========================================

    LOCALES

    ========================================== */

    /**
     * @param {string} type     - attribute name of the field (input)
     * @param {Object} options  - array of options value to send to the view example : min|max|betewen
     * @returns {string}        - error text
     */
    #errorMessages(type, options) {
        const localLowerCase = this.options.local.toLowerCase();

        if (!locales[localLowerCase]) {
            console.error(`Locale '${this.options.local}' not found. Defaulting to 'en'.`);
            this.options.local = 'en';
        }

        const localeMessages = locales[localLowerCase] || locales['en'];

        if (!localeMessages[type]) {
            console.error(`No text found for error type '${type}' in locale '${this.options.local}'`);
            return localeMessages['undefined'];
        }

        let message = localeMessages[type];
        // Replace placeholders in the message with actual values from options
        for (const [key, value] of Object.entries(options)) {
            message = message.replace(`{${key}}`, value);
        }

        return message;
    }

}