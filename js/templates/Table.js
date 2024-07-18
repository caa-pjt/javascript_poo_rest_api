export class Table {
    constructor(subject, options = {}, showEditForm) {
        this.subject = subject;
        this.subject.subscribe(this);
        this.data = Array.isArray(options.data) ? options.data : [];
        this.currentPage = 1;
        this.rowsPerPage = options.rowsPerPage || 10;
        this.sortColumn = options.sortColumn || 'id';
        this.sortOrder = options.sortOrder || 'asc';
        this.showEditForm = showEditForm;

        this.render();
    }

    async fetchData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.render();
    }

    update(notification) {
        console.log('Update called with notification:', notification); // Log for debugging
        if (notification.type === 'update') {
            console.log('Updating row with data:', notification.data); // Log for debugging
            this.updateRow(notification.data);
        } else if (notification.type === 'add') {
            console.log('Adding row with data:', notification.data); // Log for debugging
            this.addRow(notification.data);
        } else if (notification.type === 'delete') {
            console.log('Deleting row with ID:', notification.id); // Log for debugging
            this.deleteRow(notification.id);
        } else if (notification.type === 'edit') {
            console.log('Editing row with ID:', notification.id); // Log for debugging
            this.showEditForm(notification.id);
        }
    }

    render() {
        const container = document.getElementById('table-container');
        container.innerHTML = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th scope="col">
                        <button class="btn btn-link" id="sort-id">ID <span id="indicator-id"></span></button>
                    </th>
                    <th scope="col">
                        <button class="btn btn-link" id="sort-title">Title <span id="indicator-title"></span></button>
                    </th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody id="table-body">
            </tbody>
        </table>
        <nav class="d-flex justify-content-end">
            <ul class="pagination justify-content-center" id="pagination"></ul>
        </nav>
    `;

        this.renderTable();
        this.renderPagination();
        this.addEventListeners();
        this.updateSortIndicators();
    }

    renderTable() {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';

        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        const paginatedData = this.data.slice(start, end);

        paginatedData.forEach((item) => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;
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
        if (this.data.length > this.rowsPerPage) {
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
    }

    addEventListeners() {

        // Sélectionne tous les boutons de tri
        const sortButtons = document.querySelectorAll('[id^="sort-"]');

        // Ajoute un événement de clic pour chaque bouton de tri
        sortButtons.forEach(button => {
            button.addEventListener('click', () => {
                const column = button.id.split('-')[1];
                this.sortData(column);
            });
        });

        document.querySelectorAll('.edit-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                let id = event.target.dataset.id;
                this.subject.notify({ type: 'edit', id });
            });
        });

        document.querySelectorAll('.delete-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                const id = event.target.dataset.id;
                console.log('Delete button clicked, id:', id); // Log for debugging
                this.subject.notify({ type: 'delete', id });
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

    updateSortIndicators() {
        const indicators = {
            id: document.getElementById('indicator-id'),
            title: document.getElementById('indicator-title')
        };

        // Réinitialiser les indicateurs
        for (const key in indicators) {
            indicators[key].innerText = '';
        }

        // Mettre à jour l'indicateur pour la colonne de tri actuelle
        const indicator = indicators[this.sortColumn];
        if (indicator) {
            indicator.innerText = this.sortOrder === 'asc' ? '▲' : '▼';
        }
    }

    addRow(item) {
        const tbody = document.getElementById('table-body');
        const tr = document.createElement('tr');
        tr.dataset.id = item.id; // Ajouter l'attribut data-id pour une recherche facile
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.title}</td>
            <td>
                <button class="btn btn-primary btn-sm edit-btn" data-id="${item.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Ajouter des événements pour les nouveaux boutons ajoutés dynamiquement
        tr.querySelector('.edit-btn').addEventListener('click', (event) => {
            let id = event.target.dataset.id;
            this.subject.notify({ type: 'edit', id });
        });

        tr.querySelector('.delete-btn').addEventListener('click', (event) => {
            const id = event.target.dataset.id;
            this.subject.notify({ type: 'delete', id });
        });
    }

    updateRow(item) {
        const tr = document.querySelector(`tr[data-id="${item.id}"]`);
        if (tr) {
            tr.children[1].textContent = item.title;
        }
    }

    deleteRow(id) {
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        if (tr) {
            tr.remove();
        }
    }
}
