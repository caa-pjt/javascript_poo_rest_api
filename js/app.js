import { MyApi } from './api/Api.js';
import { Table } from './templates/table.js';

class App {
    constructor() {
        this.api = new MyApi('https://jsonplaceholder.typicode.com/posts');
        this.table = new Table(this.api, this);
    }

    async init() {
        await this.table.fetchData();
    }

    async showEditForm(id) {
        const item = this.table.data.find(d => d.id === id);
        const formContainer = document.getElementById('form-container');
        console.log(formContainer);
        formContainer.innerHTML = `
            <form id="edit-form">
                <div class="form-group">
                    <label for="edit-title">Title</label>
                    <input type="text" class="form-control" id="edit-title" value="${item.title}">
                </div>
                <button type="submit" class="btn btn-primary">Save</button>
            </form>
        `;

        document.getElementById('edit-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            item.title = document.getElementById('edit-title').value;
            let test = await this.api.updateData(id, item);
            console.log("App", test);
            await this.table.fetchData();
        });
    }

    async deleteRow(id) {
        await this.api.deleteData(id);
        await this.table.fetchData();
    }
}

const app = new App();
app.init();
