import { ObserverSingleton } from '../observers/ObserverSingleton.js';

export class Table {
    constructor(options = {}, showEditForm) {
        this.subject = ObserverSingleton.getInstance();

        this.data = [];
        this.currentPage = 1;
        this.rowsPerPage = options.rowsPerPage || 10;
        this.sortColumn = options.sortColumn || "id";
        this.sortOrder = options.sortOrder || "asc";
        this.showEditForm = showEditForm;
        this.tableContainer = options.tableContainer || document.body;

        // Configuration des colonnes
        this.columns = options.rows || this.getDynamicColumns();
        this.orderedColumns = options.orderedColumns || Object.keys(this.columns);

        this.subject.subscribe(this);
    }

    destroy() {
        this.subject.unsubscribe(this);
    }

    async fetchData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.updateTotalPages();
        this.render();
    }

    update(notification) {
        switch (notification.type) {
            case "update":
                this.updateRow(notification.data);
                break;
            case "add":
                this.addRow(notification.data);
                break;
            case "delete":
                this.deleteRow(notification.id);
                break;
            case "edit":
                this.showEditForm(notification.id);
                break;
            default:
                console.log("Table received unknown notification:", notification);
        }
    }

    render() {
        this.tableContainer.innerHTML = this.getTableHTML();
        this.renderTable();
        this.renderPagination();
        this.addEventListeners();
        this.updateSortIndicators();
    }

    getDynamicColumns() {
        if (this.data.length === 0) return {};
        return Object.keys(this.data.reduce((acc, item) => {
            return item && Object.keys(item).length > Object.keys(acc).length ? item : acc;
        }, {})).reduce((acc, key) => {
            acc[key] = key.charAt(0).toUpperCase() + key.slice(1);
            return acc;
        }, {});
    }

    getTableHTML() {
        return `
      <table class="table table-striped">
        <thead>
          <tr>
            ${this.getTableHeadersHTML()}
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
      <nav class="d-flex justify-content-end">
        <ul class="pagination justify-content-center" id="pagination"></ul>
      </nav>
    `;
    }

    getTableHeadersHTML() {
        const columnKeys = Object.keys(this.columns);
        const lastColumn = columnKeys[columnKeys.length - 1];

        return columnKeys.map(column => `
        <th scope="col" id="${column}" ${column === lastColumn ? 'class="text-end"' : ''}>
            ${this.isSortableColumn(column) ? `
                <button class="btn link-dark p-0" id="sort-${column}">
                    ${this.columns[column]}<span class="p-1" id="indicator-${column}"></span>
                </button>
            ` : `${this.columns[column]}`}
        </th>
    `).join('');
    }

    isSortableColumn(column) {
        return this.orderedColumns.includes(column);
    }

    renderTable() {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = this.getPaginatedData().map(item => this.getRowHTML(item)).join('');
    }

    getRowHTML(item) {
        return `
      <tr data-id="${item.id}">
        ${Object.keys(this.columns).map(column => `
            ${column === 'edit' ? '' : `
            <td>
                ${typeof item[column] === 'boolean'
            ? `<input type="checkbox" class="form-check-input" disabled ${item[column] ? 'checked' : ''}>`
            : item[column] !== undefined && item[column] !== null
                ? item[column]
                : ''
        }
            </td>`}
        `).join('')}
        <td class="text-end">
          <button class="btn btn-primary btn-sm edit-btn" data-id="${item.id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
        </td>
      </tr>
    `;
    }

    updateTotalPages() {
        this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (this.data.length > this.rowsPerPage) {
            for (let i = 1; i <= this.totalPages; i++) {
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
        this.addSortEventListeners();
        this.addEditEventListeners();
        this.addDeleteEventListeners();
    }

    addSortEventListeners() {
        document.querySelectorAll('[id^="sort-"]').forEach(button => {
            button.removeEventListener('click', this.handleSortClick);
            button.addEventListener('click', this.handleSortClick);
        });
    }

    addEditEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.removeEventListener('click', this.handleEditClick);
            button.addEventListener('click', this.handleEditClick);
        });
    }

    addDeleteEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.removeEventListener('click', this.handleDeleteClick);
            button.addEventListener('click', this.handleDeleteClick);
        });
    }

    handleSortClick = (event) => {
        const column = event.target.id.split('-')[1];
        this.sortData(column);
    };

    handleEditClick = (event) => {
        const id = event.target.dataset.id;
        this.subject.notify({ type: "editButtonClicked", id });
    };

    handleDeleteClick = (event) => {
        const id = event.target.dataset.id;
        this.subject.notify({ type: "deleteButtonClicked", id });
    };

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
        const indicators = {};
        this.orderedColumns.forEach(column => {
            indicators[column] = document.getElementById(`indicator-${column}`);
            if (indicators[column]) indicators[column].innerText = '';
        });

        const indicator = indicators[this.sortColumn];
        if (indicator) indicator.innerText = this.sortOrder === 'asc' ? '▲' : '▼';
    }

    addRow(item) {

        this.data.push(item);
        this.updateTotalPages();

        // Naviguer vers la dernière page si l'article ajouté se trouve dans une nouvelle page
        if ((this.data.length % this.rowsPerPage) === 1) {
            this.currentPage = this.totalPages;
        }

        this.render();
    }

    updateRow(item) {
        const tr = document.querySelector(`tr[data-id="${item.id}"]`);
        if (tr) {
            Object.keys(this.columns).forEach((column, index) => {

                // Ignorer les colonnes "edit" et "delete"
                if (column === 'edit' || column === 'delete') return;

                const cell = tr.children[index];

                if (typeof item[column] === 'boolean') {
                    // Si c'est un boolean, mettre à jour la case à cocher
                    cell.innerHTML = `<input type="checkbox" class="form-check-input" disabled ${item[column] ? 'checked' : ''}>`;
                } else {
                    // Sinon, mettre à jour le contenu textuel
                    cell.textContent = item[column] !== undefined && item[column] !== null ? item[column] : '';
                }
            });
        }
    }

    deleteRow(id) {
        this.data = this.data.filter(item => item.id !== id);
        this.updateTotalPages();
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        this.render();
    }

    getPaginatedData() {
        const start = (this.currentPage - 1) * this.rowsPerPage;
        return this.data.slice(start, start + this.rowsPerPage);
    }
}
