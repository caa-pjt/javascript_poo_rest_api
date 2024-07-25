import { MyApi } from "./api/Api.js";
import { Table } from "./templates/Table.js";
import { Subject } from "./observers/Subject.js";
import { Toaster } from "./templates/Toaster.js";

import { ModalFormBuilder } from "./templates/ModalFormBuilder.js";

class App {
  constructor() {
    this.api = new MyApi("http://localhost:3000/posts"); // /data/db.json
    this.addItem = document.getElementById("add-new");
    this.subject = new Subject();

    // App is observing itself
    this.subject.subscribe(this);

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
          options: {
              modalTitle: "Créer ou modifier un article",
              surround: {
                  class: "form-group",
              },
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
      ]);

  }

  createTable() {

    this.table = new Table(this.subject, this.tableOptions);
    this.table.fetchData(this.data);
  }

  // Méthode pour afficher le formulaire d'édition
  async showEditForm(id = null) {
    const item = id ? this.data.find((d) => d.id === id) : {};
    // this.modal.renderEditForm(item);

    console.log("appel de la méthode showEditForm :", id);


      //this.modal.hide();
    };

    // this.modal.show();


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

  update(notification) {
    console.log("Notification received:", notification.type);
    if (notification.type === "editButtonClicked") {
        console.log("Updating row with data:", notification);
        this.showEditForm(notification.id);
    } else if (notification.type === "deleteButtonClicked") {
        console.log("Deleting row with ID:", notification.id);
        this.deleteRow(notification.id);
    }
  }
}
const app = new App();
app.init();
