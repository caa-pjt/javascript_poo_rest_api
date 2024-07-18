import { MyApi } from './api/Api.js';
import { Table } from './templates/Table.js';
import { Modal } from './templates/Modal.js';
import { Subject } from './observers/Subject.js';

class App {
    constructor() {
        this.api = new MyApi('http://localhost:3000/posts');
        this.modal = new Modal();
        this.addItem = document.getElementById('add-new');
        this.subject = new Subject();
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
            rowsPerPage: 10,
            sortColumn: 'id',
            sortOrder: 'asc'
        };

        // Créer une instance de Table avec les options
        this.table = new Table(this.subject, tableOptions, this.showEditForm);
        await this.table.fetchData(data);

        this.addItem.addEventListener('click', () => this.showEditForm());
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
                    alert('Item added successfully!');
                } else {
                    alert('An error occurred while adding the item!');
                }
            } else {
                item.title = title;
                const data = await this.api.updateData(id, item);
                if (data.hasOwnProperty('id')) {
                    this.subject.notify({ type: 'update', data });
                    alert('Item updated successfully!');
                }else {
                    alert('An error occurred while updating the item!');
                }
            }
            this.modal.hide();
        };

        this.modal.show();
    }

    async deleteRow(id) {
        console.log('Deleting row with ID:', id); // Log for debugging
        const data = await this.api.deleteData(id);
        if (data.hasOwnProperty('id')) {
            this.subject.notify({ type: 'delete', id });
            alert('Item deleted successfully!');
        }else {
            alert('An error occurred while deleting the item!');
        }
    }

    update(notification) {
        console.log('Notification received:', notification); // Log for debugging
        if (notification.type === 'update' || notification.type === 'add') {
            this.table.update(notification.data);
        } else if (notification.type === 'delete') {
            this.deleteRow(notification.id).then(r => console.log('Row deleted')); // Log for debugging
            //this.table.deleteRow(notification.id);
        } else if (notification.type === 'edit') {
            this.showEditForm(notification.id).then(r => console.log('Edit form displayed')); // Log for debugging
        }
    }
}
const app = new App();
app.init();
