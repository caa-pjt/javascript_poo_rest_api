import { MyApi } from "./api/Api.js";
import { Table } from "./templates/Table.js";
import { Modal } from "./templates/Modal.js";
import { Subject } from "./observers/Subject.js";
import { Toaster } from "./templates/Toaster.js";

class App {
  constructor() {
    this.api = new MyApi("http://localhost:3000/posts"); // /data/db.json
    this.modal = new Modal();
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

    this.addItem.addEventListener("click", () => this.showEditForm());
  }

  createTable() {

    this.table = new Table(this.subject, this.tableOptions);
    this.table.fetchData(this.data);
  }

  // Méthode pour afficher le formulaire d'édition
  async showEditForm(id = null) {
    const item = id ? this.data.find((d) => d.id === id) : {};
    this.modal.renderEditForm(item);

    console.log("appel de la méthode showEditForm :", id);

    const editForm = document.getElementById("edit-form");
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      const title = document.getElementById("edit-title").value;
      if (!id) {
        const newItem = { title };
        const data = await this.api.addData(newItem);
        this.data.push(data);
        if (data.hasOwnProperty("id")) {
          this.subject.notify({ type: "add", data });
          Toaster.createToaster("Article ajouté avec succès!");
        } else {
          Toaster.createToaster(
            "Une erreur s'est produite lors de l'ajout de l'article!",
            "danger"
          );
        }
      } else {
        item.title = title;
        const data = await this.api.updateData(id, item);
        if (data.hasOwnProperty("id")) {
          this.subject.notify({ type: "update", data });
          Toaster.createToaster("Article mis à jour avec succès!");
        } else {
          Toaster.createToaster(
            "Une erreur s'est produite lors de la mise à jour de l'article!",
            "danger"
          );
        }
      }
      this.modal.hide();
    };

    this.modal.show();
  }

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
