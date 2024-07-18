import { MyApi } from './api/Api.js';
import { Table } from './templates/Table.js';
import { Modal } from './templates/Modal.js';
import { Subject } from './observers/Subject.js';
import { Toaster } from './templates/Toaster.js';

class App {
    constructor() {
        this.api = new MyApi('http://localhost:3000/posts');
        this.modal = new Modal();
        this.addItem = document.getElementById('add-new');
        this.subject = new Subject();

        this.deletionInProgress = false; // Flag pour contrôler les notifications redondantes

        // App is observing itself
        this.subject.subscribe(this);

        // Lier les méthodes pour conserver le contexte `this`
        //this.init = this.init.bind(this);
        this.showEditForm = this.showEditForm.bind(this);
        //this.deleteRow = this.deleteRow.bind(this);
        // this.update = this.update.bind(this);
    }

    // Méthode d'initialisation de l'application
    async init() {
        const data = await this.api.getData();

        // Définir les options par défaut pour la table
        const tableOptions = {
            data: Array.isArray(data) ? data : [],
            rowsPerPage: 5,
            sortColumn: 'id',
            sortOrder: 'asc'
        };

        // Créer une instance de Table avec les options
        this.createTable(tableOptions, data);

        this.addItem.addEventListener('click', () => this.showEditForm());
    }

    createTable(tableOptions, data) {
        if (this.table) {
            this.table.destroy();
        }

        this.table = new Table(this.subject, tableOptions, this.showEditForm);
        this.table.fetchData(data);
    }

    // Méthode pour afficher le formulaire d'édition
    async showEditForm(id = null) {
        const item = id ? this.table.data.find(d => d.id === id) : {};
        this.modal.renderEditForm(item);

        const editForm = document.getElementById('edit-form');
        editForm.onsubmit = async (event) => {
            event.preventDefault();
            const title = document.getElementById('edit-title').value;
            if (!id) {
                const newItem = { title };
                const data = await this.api.addData(newItem);
                if (data.hasOwnProperty('id')) {
                    this.subject.notify({ type: 'add', data });
                    Toaster.createToaster('Article ajouté avec succès!');
                } else {
                    Toaster.createToaster("Une erreur s'est produite lors de l'ajout de l'article!", 'danger');
                }
            } else {
                item.title = title;
                const data = await this.api.updateData(id, item);
                if (data.hasOwnProperty('id')) {
                    this.subject.notify({ type: 'update', data });
                    Toaster.createToaster('Article mis à jour avec succès!');
                } else {
                    Toaster.createToaster("Une erreur s'est produite lors de la mise à jour de l'article!", 'danger');
                }
            }
            this.modal.hide();
        };

        this.modal.show();
    }

    async deleteRow(id) {
        if (this.deletionInProgress) return; // Évite les appels redondants
        this.deletionInProgress = true;

        console.log('Deleting row with ID:', id);
        const data = await this.api.deleteData(id);
        if (data.hasOwnProperty('id')) {
            this.subject.notify({ type: 'delete', id });
            Toaster.createToaster("Article supprimé avec succès!");
        }else {
            Toaster.createToaster("Une erreur s'est produite lors de la suppression de l'article!", 'danger');
        }

        this.deletionInProgress = false;
    }

    update(notification) {
        console.log('Notification received:', notification);
        if (notification.type === 'update' || notification.type === 'add') {
            console.log('Updating table with data:', notification.data);
            this.table.update(notification.data);
        } else if (notification.type === 'delete') {
            console.log('Deleting row with ID:', notification.id);
            this.deleteRow(notification.id);
        } else if (notification.type === 'edit') {
            console.log('Editing row with ID:', notification.id);
            this.showEditForm(notification.id);
        }
    }

}
const app = new App();
app.init();