import { MyApi } from "./api/Api.js";
import { Table } from "./templates/Table.js";
import { ObserverSingleton } from "./observers/ObserverSingleton.js";
import { Toaster } from "./templates/Toaster.js";
import { ModalFormBuilder } from "./templates/ModalFormBuilder.js";

class App {
	constructor() {
		this.api = new MyApi("http://localhost:3000/posts");
		this.subject = ObserverSingleton.getInstance();
		this.subject.subscribe(this);
		this.data = [];
		this.tableOptions = this._initializeTableOptions();
		this.formBuilder = this._initializeFormBuilder();
	}
	
	/**
	 * Initializes the application by fetching data and creating the table.
	 * @async
	 */
	async init() {
		try {
			this.data = await this.api.getData();
			this.createTable();
		} catch (error) {
			this._handleApiError("Une erreur s'est produite lors de la récupération des articles!", error);
		}
	}
	
	/**
	 * Initializes table options for the Table component.
	 * @private
	 * @returns {Object} Table options configuration.
	 */
	_initializeTableOptions() {
		return {
			rowsPerPage: 5,
			sortColumn: "id",
			sortOrder: "asc",
			tableContainer: document.getElementById("table-container"),
			rows: {
				id: "ID",
				title: "Titre",
				published: "Publié",
				edit: "Actions",
			},
			orderedColumns: ["id", "title", "published"],
		};
	}
	
	/**
	 * Initializes the form builder for the modal form.
	 * @private
	 * @returns {ModalFormBuilder} Instance of ModalFormBuilder.
	 */
	_initializeFormBuilder() {
		const formBuilder = new ModalFormBuilder({
			form: {
				class: "form",
				id: "form-id",
				method: "POST",
				action: "",
			},
			options: {
				modalTitle: "Créer ou modifier un article",
				surround: {
					class: "form-group",
				},
				validationOption: {
					validate: {
						title: "required|min:5|max:50|match:/^[\\W\\w ]+$/",
					},
					local: "fr",
					observeOnInput: true,
				},
			},
		});
		
		formBuilder.addFields([
			{
				field_type: "input",
				required: false,
				label: "Titre",
				type: "text",
				name: "title",
				placeholder: "Titre de l'article",
				value: "",
				class: "form-control mb-3",
			},
			{
				field_type: "input",
				required: false,
				label: "Publié",
				type: "checkbox",
				name: "published",
				value: "",
				class: "form-check-input",
				options: {
					surround: {
						class: "form-check",
					},
				},
			},
			{
				field_type: "input",
				type: "hidden",
				name: "id",
				value: "",
			},
		]);
		
		return formBuilder;
	}
	
	/**
	 * Initializes the form builder for the modal form.
	 * @private
	 * @returns {ModalFormBuilder} Instance of ModalFormBuilder.
	 */
	createTable() {
		this.table = new Table(this.tableOptions);
		this.table.fetchData(this.data);
	}
	
	/**
	 * Displays the form for editing or creating a new post.
	 * @param {string|null} [id=null] - The ID of the post to edit. If null, shows a blank form for creating a new post.
	 */
	showEditForm(id = null) {
		const item = id ? this.data.find((d) => d.id === id) : { title: "", published: false, id: "" };
		this.formBuilder.renderWithData(item);
	}
	
	/**
	 * Deletes a row with the specified ID.
	 * @async
	 * @param {string} id - The ID of the post to delete.
	 */
	async deleteRow(id) {
		try {
			const result = await this.api.deleteData(id);
			if (result.hasOwnProperty("id")) {
				this._notifyChange("delete", result);
				Toaster.createToaster("Article supprimé avec succès!");
			} else {
				throw new Error("Failed to delete item");
			}
		} catch (error) {
			this._handleApiError("Une erreur s'est produite lors de la suppression de l'article!", error);
		}
	}
	
	/**
	 * Updates or adds a row based on the provided data.
	 * @async
	 * @param {Object} data - The data of the post to update or add.
	 */
	async updateRow(data) {
		try {
			let updatedPost;
			if (!data.id) {
				delete data.id;
				updatedPost = await this.api.addData(data);
				this.data.push(updatedPost);
				this._notifyChange("add", updatedPost);
			} else {
				updatedPost = await this.api.updateData(data.id, data);
				const index = this.data.findIndex((item) => item.id === updatedPost.id);
				if (index !== -1) this.data[index] = updatedPost;
				this._notifyChange("update", updatedPost);
			}
			this.formBuilder.hideModal();
		} catch (error) {
			this._handleApiError("Une erreur s'est produite lors de la mise à jour de l'article!", error);
		}
	}
	
	/**
	 * Notifies observers about a change.
	 * @private
	 * @param {string} type - The type of change (add, update, delete).
	 * @param {Object} data - The data associated with the change.
	 */
	_notifyChange(type, data) {
		this.subject.notify({ type, data });
		Toaster.createToaster("Article mis à jour avec succès!");
	}
	
	/**
	 * Handles API errors by logging them and displaying a toaster message.
	 * @private
	 * @param {string} message - The error message to display.
	 * @param {Error} error - The error object.
	 */
	_handleApiError(message, error) {
		console.error(message, error);
		Toaster.createToaster(message, "danger");
	}
	
	/**
	 * Callback method to handle updates from the observer.
	 * @param {Object} notification - The notification object containing the type and additional data.
	 */
	update(notification) {
		switch (notification.type) {
			case "editButtonClicked":
				this.showEditForm(notification.id);
				break;
			case "deleteButtonClicked":
				this.deleteRow(notification.id);
				break;
			case "addDataOnSubmitForm":
				this.updateRow(notification.data);
				break;
			default:
				console.log("No action defined for notification type:", notification.type);
		}
	}
}

const app = new App();
app.init();
