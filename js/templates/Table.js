export class Table {
    constructor(api, app) {
        this.api = api;
        this.app = app;
        this.data = [];
        this.currentPage = 1;
        this.rowsPerPage = 10;
        this.sortColumn = 'id';
        this.sortOrder = 'asc';

        this.fetchData();
    }

    async fetchData() {
        this.data = await this.api.getData();
        this.render();
    }

    render() {
        const container = document.getElementById('table-container');
        container.innerHTML = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th scope="col"><button class="btn btn-link" id="sort-id">ID</button></th>
                        <th scope="col"><button class="btn btn-link" id="sort-title">Title</button></th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody id="table-body">
                </tbody>
            </table>
            <nav>
                <ul class="pagination justify-content-center" id="pagination"></ul>
            </nav>
            <div id="form-container"></div>
        `;

        this.renderTable();
        this.renderPagination();
        this.addEventListeners();
    }

    renderTable() {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';

        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        const paginatedData = this.data.slice(start, end);

        paginatedData.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        const totalPages = Math.ceil(this.data.length / this.rowsPerPage);
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = 'page-item' + (i === this.currentPage ? ' active' : '');
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', () => {
                this.currentPage = i;
                this.render();
            });
            pagination.appendChild(li);
        }
    }

    addEventListeners() {
        document.getElementById('sort-id').addEventListener('click', () => {
            this.sortData('id');
        });

        document.getElementById('sort-title').addEventListener('click', () => {
            this.sortData('title');
        });

        document.querySelectorAll('.edit-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                this.app.showEditForm(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                this.app.deleteRow(id);
            });
        });
    }

    sortData(column) {
        this.sortColumn = column;
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.data.sort((a, b) => {
            if (a[column] < b[column]) return this.sortOrder === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        this.render();
    }
}
