/**
 * @fileOverview
 * @author Carlos Antunes
 * @source https://github.com/caa-pjt/form-builder-js.git
 * @version 1.0.0
 */

/**
 * @param {Object} options - liste des options à injecter dans le formulaire
 * @returns {HTMLAnchorElement}
 */
export class FormBuilder {
    formOptions = {
        method: "GET",
        action: "#",
    };

    options = {
        surround: false,
    };

    /**
     *
     * @param {Object} options - Objet contenant la liste des options à injecté dans l'HTML
     * @property {string} form.method - GET POST PUT DELETE
     * @property {string} form.action - http://www....
     * @property {string} form.class - className
     * @property {string} form.id - id
     * @property {string} options.output - htmlQuerySelector
     * @property {string} options.surround.class - surround div className
     */
    constructor(options) {
        this.options = Object.assign({}, this.options, options.options);
        this.formOptions = Object.assign({}, this.form, options.form);

        this.form = null;

        this.setForm();
    }

    /**
     * @param {Array} nodesList - Tableau de tableau qui contient la listes des imputs et un objet d'options
     * - exemple: [
     *   ["input" , {
     type : 'email', name : 'email', placeholder : "Enter email", label : "Indiquer votre email",
     options: { required : false, value : "cca@cc.ch" }
     }],
     ["button", { type : 'submit', class : 'btn btn-primary', texte : 'Envoyer'}]
     * ]
     * @returns {HTMLElement} - Crée une liste d'éléments déstinés à un formulaire
     */
	addFields(nodesList = []) {
		nodesList.forEach((field) => this.dispatche(field));
		
		// if output exists, return form to view
		if (typeof this.options.output === "string") {
			this.appendIn(this.options.output);
		}
	}

    setForm() {
        return (this.form = this.render("form", this.formOptions));
    }

    /**
     * Dispatche les éléments du formulaire
     * @param {Object} field - Liste d'options
     * @returns this
     */
	dispatche(field) {
		this.#ensureFieldHasId(field);
		
		if (field.label) {
			const label = this.render("label", { for: field.id, text: field.label });
			this.#handleSurround(label, field.options?.surround);
		}
		
		const formHtml = this.render(field.field_type, field);
		this.#handleSurround(formHtml, field.options?.surround);
	}
	
	/**
	 * Ensure that the field has an id
	 * @param field
	 */
	#ensureFieldHasId(field) {
		if (field.id === undefined && field.name !== undefined) {
			field.id = field.name;
		}
	}
	
	/**
	 * Sub-function to manage entourage or add directly to form
	 * @param element
	 * @param surroundOption
	 */
	#handleSurround(element, surroundOption) {
		if (this.options.surround !== false || surroundOption) {
			this.surround(element, surroundOption || null);
		} else {
			this.form.appendChild(element);
		}
	}

    /**
     *
     * @param {HTMLElement} input
     * @returns
     */
    surround(input, specificSurroundOptions = null) {
        const id = input.getAttribute("id");
        const div = this.form.querySelector(`[data-for=${id}]`);
        const surroundOptions = specificSurroundOptions ? specificSurroundOptions : this.options.surround;

        if (div != null) {
            div.appendChild(input);
            return this.form.appendChild(div);
        } else {
            if (input.getAttribute("for") != "undefined" && input.getAttribute("for") != null) {
                surroundOptions["data-for"] = input.getAttribute("for");
            } else {
                surroundOptions["data-for"] = input.getAttribute("id");
            }
            const div = this.render("div", surroundOptions);
            div.appendChild(input);

            return this.form.appendChild(div);
        }
    }

    /**
     * Construit un élément HTML à la demande et le retourne
     * @param {HtmlTagName} tag - Nom du tag HTML
     * @param {ObjectConstructor} attr - listes des attributs html. exemple :
     * - {required: false, type: 'email', name: 'email', placeholder: 'Enter email', value: 'cca@cc.ch', …}
     * @returns {HTMLElement} Retourne l'élément html
     */
	render(tag, attr = {}) {
		const el = document.createElement(tag);
		
		if (attr.label) {
			delete attr.label;
		}
		
		if (attr.field_type) {
			delete attr.field_type;
		}
		
		for (const [key, value] of Object.entries(attr)) {
			/* console.log(key, value) */
			if (key === "text") {
				el.innerText = value;
			}
			if (key === "value" && tag === "textarea") {
				console.log("specific handling for textarea value if needed", "value", value, tag, el, key, value, attr, "textarea");
				debugger;
			}
			if (key === "required" && value === false) {
				continue;
			}
			if (key === "options") {
				if (tag === "select") {
					this.select(el, value);
				} else {
					for (const [k, v] of Object.entries(attr.options)) {
						el[k] = v;
					}
				}
			} else {
				if (key !== "text") {
					el.setAttribute(key, value);
				}
			}
		}
		return el;
	}
	
	select(el, options) {
        if (options.default) {
            el.innerHTML = `<option value="">${options.default}</option>`;
        }
        for (const [k, v] of Object.entries(options.values)) {
            el.innerHTML += `<option value="${k}">${v}</option>`;
        }
        return el;
    }

    /**
     * Vérifie si la case à cocher est cochée
     * @param {String} checkboxId - L'id de la case à cocher
     * @returns {Boolean} - Retourne true si la case est cochée, sinon false
     */
    isChecked(checkboxId) {
        const checkbox = this.form.querySelector(`#${checkboxId}`);
        return checkbox ? checkbox.checked : false;
    }

    /**
     * @param {String} cible - QuerySelector
     * @returns {HTMLElement} - Retourne le formulaire dans la vue
     * @example form.appendIn("#app")
     */
    appendIn(cible) {
        const renderView = document.querySelector(cible);
        console.log(renderView);
        return renderView.appendChild(this.form);
    }
}
