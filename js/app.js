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
        this.table = new Table(this.subject, tableOptions);

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
                this.subject.notify({ type: 'update', data });
            } else {
                item.title = title;
                const data = await this.api.updateData(id, item);
                this.subject.notify({ type: 'update', data });
            }
            this.modal.hide();
        };

        this.modal.show();
    }

    async deleteRow(id) {
        await this.api.deleteData(id);
        const data = await this.api.getData();
        this.subject.notify({ type: 'update', data });
    }

    update(notification) {
        if (notification.type === 'update') {
            const data = Array.isArray(notification.data) ? notification.data : [];
            console.log('Updating table with data:', data);
            this.table.update(data);
        } else if (notification.type === 'edit') {
            this.showEditForm(notification.id);
        } else if (notification.type === 'delete') {
            this.deleteRow(notification.id);
        }
    }
}
const app = new App();
app.init();

