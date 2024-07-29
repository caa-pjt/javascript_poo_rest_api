import { MyApi } from "./api/Api.js";
import { Table } from "./templates/Table.js";
import { Subject } from "./observers/Subject.js";
import { ObserverSingleton } from "./observers/ObserverSingleton.js";
import { Toaster } from "./templates/Toaster.js";

import { ModalFormBuilder } from "./templates/ModalFormBuilder.js";

class App {
  constructor() {
    this.api = new MyApi("http://localhost:3000/posts"); // /data/db.json
    this.addItem = document.getElementById("add-new");
    // this.subject = new Subject();

    // App is observing the Subject
    this.subject = ObserverSingleton.getInstance();
    this.subject.subscribe(this);
    // console.log("App Observer instance:", this.subject);

    // Lier les méthodes pour conserver le contexte `this`
    this.showEditForm = this.showEditForm.bind(this);

  }

  // Méthode d'initialisation de l'application
  async init() {
    this.data = await this.api.getData();

    // Définir les options par défaut pour la table
    this.tableOptions = await {
      rowsPerPage: 5,
      sortColumn: "id",
      sortOrder: "asc",
      tableContainer: document.getElementById("table-container"),
    };

    // Créer une instance de Table avec les options
    this.createTable();


      /*
      Form builder
      */
      this.formBuilder = new ModalFormBuilder({
          form: {
              class: "form",
              id: "form-id",
              method: "POST",
              action: "",
          },
          // Options de la modal
          options: {
              modalTitle: "Créer ou modifier un article",
              surround: {
                  class: "form-group",
              },
              // Règles de validation pour le formulaire de la modal
              validationOption : {
                  validate : {
                      title : "required|min:5|max:50|match:/^[A-z]{1}[a-z]+$/",
                  },
                  local: 'fr',
                  observeOnInput: true
              }
          },
      });

      this.formBuilder.addFields([
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
                  }
              }
          },
          {
              field_type: "input",
              type: "hidden",
              name: "id",
              value: "",
          }
      ]);

  }

  createTable() {

    this.table = new Table(this.tableOptions); // this.subject,
    this.table.fetchData(this.data);
  }

  // Méthode pour afficher le formulaire d'édition
  showEditForm(id = null) {
    const item = id ? this.data.find((d) => d.id === id) : {};
      this.formBuilder.renderWithData(item);
  };


  async deleteRow(id) {

    console.log("Deleting row with ID:", id);
    const data = await this.api.deleteData(id);
    if (data.hasOwnProperty("id")) {
      this.subject.notify({ type: "delete", id });
      Toaster.createToaster("Article supprimé avec succès!");
    } else {
      Toaster.createToaster(
        "Une erreur s'est produite lors de la suppression de l'article!",
        "danger"
      );
    }
  }

  async updateRow(data) {
    console.log("Updating data with:", data);

      this.post = {};
    if (data.id === "") {
        delete data.id;
        this.post = await this.api.setData(data);
        this.data.push(this.post);
        this.type = "add";
    }else {
        this.post = await this.api.updateData(data.id, data);
        // Mettre à jour les données dans `this.data`
        const index = this.data.findIndex(item => item.id === this.post.id);
        if (index !== -1) {
            this.data[index] = this.post;
        }
        this.type = "update";
    }

        this.formBuilder.hideModal();

        this.notify(this.type, this.post);

        this.post = {};

  }

    notify(type, data) {
        if (data.hasOwnProperty("id")) {
            this.subject.notify({ type: type, data: data });
            Toaster.createToaster("Article mis à jour avec succès!");

        } else {
            Toaster.createToaster(
                "Une erreur s'est produite lors de la mise à jour de l'article!",
                "danger"
            );
        }
    }

  update(notification) {

    switch (notification.type) {
      case "editButtonClicked":
          console.log("Editing row with ID:", notification);
          this.showEditForm(notification.id);
        break;
      case "deleteButtonClicked":
          console.log("Deleting row with ID:", notification.id);
          this.deleteRow(notification.id);
        break;
      case "addDataOnSubmitForm":
        console.log("Form submitted with data:", notification.data);
        this.updateRow(notification.data);
        break;
      default:
        console.log("No action defined for notification type:", notification.type);
    }
  }
}
const app = new App();
app.init();
