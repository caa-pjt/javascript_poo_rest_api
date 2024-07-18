import { MyApi } from './api/Api.js';
import { Table } from './templates/Table.js';
import { Modal } from './templates/Modal.js';


class App {
    constructor() {
        this.api = new MyApi('http://localhost:3000/posts');
        this.modal = new Modal();
        this.addItem = document.getElementById('add-new');
    }

    // Méthode d'initialisation de l'application
    async init() {
        const data = await this.api.getData();

        // Définir les options par défaut pour la table
        const tableOptions = {
            data: data,
            rowsPerPage: 2,
            sortColumn: 'id',
            sortOrder: 'asc'
        };

        // Créer une instance de Table avec les options
        this.table = new Table(this, tableOptions);

        await this.table.fetchData(data);

        this.addItem.addEventListener('click', () => this.showEditForm());
    }

    // Méthode pour afficher le formulaire d'édition
    async showEditForm(id = null) {
        const item = this.table.data.find(d => d.id === id);
        this.modal.renderEditForm(item);

        const editForm = document.getElementById('edit-form');
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!id) {
                const newItem = {
                    title: document.getElementById('edit-title').value
                };
                const data = await this.api.addData(newItem);
                await this.table.fetchData(data);
                this.modal.hide();
                return;
            }
            item.title = document.getElementById('edit-title').value;

            const data = await this.api.updateData(id, item);
            await this.table.fetchData(data);
            this.modal.hide();
        });

        this.modal.show();
    }

    async deleteRow(id) {
        await this.api.deleteData(id);
        await this.table.fetchData();
    }
}

const app = new App();
app.init();
