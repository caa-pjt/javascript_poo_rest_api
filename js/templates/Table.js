import { ObserverSingleton } from '../observers/ObserverSingleton.js';

/**
 * @class Table
 * @description Classe représentant un tableau avec pagination, tri et gestion des événements d'édition et de suppression.
 */
export class Table {

    /**
     * @constructor
     * @param {Object} options - Options de configuration pour le tableau.
     * @param {Function} showEditForm - Fonction pour afficher le formulaire d'édition.
     */
    constructor(options = {}) {
        // Instance de l'observateur pour la communication entre les composants
        this.subject = ObserverSingleton.getInstance();

        // Initialisation des propriétés de l'objet
        this.tableData = [];
        this.currentPage = 1;
        this.rowsPerPage = options.rowsPerPage || 10;
        this.sortColumn = options.sortColumn || "id";
        this.sortOrder = options.sortOrder || "asc";
        this.tableContainer = options.tableContainer || document.body;

        // Configuration des colonnes
        this.columns = options.rows || this.getDynamicColumns();
        this.orderedColumns = options.orderedColumns || Object.keys(this.columns);

        // S'abonner aux notifications de l'observateur
        this.subject.subscribe(this);
		
    }

    /**
     * Désinscrit l'instance des notifications de l'observateur.
     */
    destroy() {
        this.subject.unsubscribe(this);
    }

    /**
     * Récupère les données et les stocke dans le tableau.
     * @param {Array} data - Données à afficher dans le tableau.
     */
    async fetchData(data) {
		this.tableData = Array.isArray(data) ? data : [];
        this.updateTotalPages();
        this.render();
    }

    /**
     * Met à jour le tableau en fonction des notifications reçues.
     * @param {Object} notification - Notification reçue de l'observateur.
     */
    update(notification) {
        switch (notification.type) {
            case "update":
                this.updateRow(notification.data);
                break;
            case "add":
				console.log(this.tableData);
                this.addRow(notification.data);
                break;
			case "delete":
                this.deleteRow(notification.data.id);
                break;
            default:
                console.log("Table received unknown notification:", notification);
        }
    }

    /**
     * Rendu du tableau complet avec pagination et écouteurs d'événements.
     */
    render() {
        this.tableContainer.innerHTML = this.getTableHTML();
        this.renderTable();
        this.renderPagination();
        this.addEventListeners();
        this.updateSortIndicators();
    }

    /**
     * Obtient dynamiquement les colonnes à partir des données.
     * @returns {Object} - Objet contenant les noms des colonnes.
     */
    getDynamicColumns() {
        if (this.tableData.length === 0) return {};
        return Object.keys(this.tableData.reduce((acc, item) => {
            return item && Object.keys(item).length > Object.keys(acc).length ? item : acc;
        }, {})).reduce((acc, key) => {
            acc[key] = key.charAt(0).toUpperCase() + key.slice(1);
            return acc;
        }, {});
    }

    /**
     * Génère le HTML de base pour le tableau.
     * @returns {string} - Chaîne HTML pour le tableau.
     */
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

    /**
     * Génère le HTML pour les en-têtes du tableau avec les options de tri.
     * @returns {string} - Chaîne HTML pour les en-têtes de tableau.
     */
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

    /**
     * Vérifie si une colonne est triable.
     * @param {string} column - Nom de la colonne.
     * @returns {boolean} - True si la colonne est triable, sinon False.
     */
    isSortableColumn(column) {
        return this.orderedColumns.includes(column);
    }

    /**
     * Rendu des lignes du tableau avec pagination.
     */
    renderTable() {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = this.getPaginatedData().map(item => this.getRowHTML(item)).join('');
    }

    /**
     * Met à jour le nombre total de pages en fonction des données.
     */
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

    /**
     * Met à jour le nombre total de pages en fonction des données.
     */
    updateTotalPages() {
        this.totalPages = Math.ceil(this.tableData.length / this.rowsPerPage);
    }

    /**
     * Rendu de la pagination du tableau.
     */
    renderPagination() {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (this.tableData.length > this.rowsPerPage) {
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

    /**
     * Ajoute les écouteurs d'événements pour le tri, l'édition et la suppression.
     */
    addEventListeners() {
        this.addSortEventListeners();
        this.addEditEventListeners();
        this.addDeleteEventListeners();
    }

    /**
     * Ajoute les écouteurs d'événements pour le tri des colonnes.
     */
    addSortEventListeners() {
        document.querySelectorAll('[id^="sort-"]').forEach(button => {
            button.removeEventListener('click', this.handleSortClick);
            button.addEventListener('click', this.handleSortClick);
        });
    }

    /**
     * Ajoute les écouteurs d'événements pour les boutons d'édition.
     */
    addEditEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.removeEventListener('click', this.handleEditClick);
            button.addEventListener('click', this.handleEditClick);
        });
    }

    /**
     * Ajoute les écouteurs d'événements pour les boutons de suppression.
     */
    addDeleteEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.removeEventListener('click', this.handleDeleteClick);
            button.addEventListener('click', this.handleDeleteClick);
        });
    }

    /**
     * Gère l'événement de tri lors du clic sur une colonne triable.
     * @param {Event} event - Événement de clic.
     */
    handleSortClick = (event) => {
        const column = event.target.id.split('-')[1];
        this.sortData(column);
    };

    /**
     * Gère l'événement de clic sur le bouton d'édition.
     * @param {Event} event - Événement de clic.
     */
    handleEditClick = (event) => {
        const id = event.target.dataset.id;
        this.subject.notify({ type: "editButtonClicked", id });
    };

    /**
     * Gère l'événement de clic sur le bouton de suppression.
     * @param {Event} event - Événement de clic.
     */
    handleDeleteClick = (event) => {
        const id = event.target.dataset.id;
        this.subject.notify({ type: "deleteButtonClicked", id });
    };

    /**
     * Trie les données en fonction de la colonne spécifiée.
     * @param {string} column - Nom de la colonne à trier.
     */
    sortData(column) {
        this.sortColumn = column;
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
		this.tableData.sort((a, b) => {
            if (a[column] < b[column]) return this.sortOrder === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        this.render();
    }

    /**
     * Met à jour les indicateurs de tri des colonnes.
     */
    updateSortIndicators() {
        const indicators = {};
        this.orderedColumns.forEach(column => {
            indicators[column] = document.getElementById(`indicator-${column}`);
            if (indicators[column]) indicators[column].innerText = '';
        });

        const indicator = indicators[this.sortColumn];
        if (indicator) indicator.innerText = this.sortOrder === 'asc' ? '▲' : '▼';
    }

    /**
     * Ajoute une nouvelle ligne au tableau.
     * @param {Object} item - Données de la ligne à ajouter.
     */
    addRow(item) {
        if(!this.tableData.some(row => row.id === item.id))  this.tableData.push(item);

        this.updateTotalPages();

        // Naviguer vers la dernière page si l'article ajouté se trouve dans une nouvelle page
        if ((this.tableData.length % this.rowsPerPage) === 1) {
            this.currentPage = this.totalPages;
        }

        this.render();
    }

    /**
     * Met à jour une ligne du tableau.
     * @param {Object} item - Données de la ligne à mettre à jour.
     */
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

    /**
     * Supprime une ligne du tableau en fonction de l'ID.
     * @param {number} id - ID de la ligne à supprimer.
     */
    deleteRow(id) {
		this.tableData = this.tableData.filter(item => item.id !== id);
        this.updateTotalPages();
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        this.render();
    }

    /**
     * Obtient les données paginées en fonction de la page actuelle.
     * @returns {Array} - Données de la page actuelle.
     */
    getPaginatedData() {
        const start = (this.currentPage - 1) * this.rowsPerPage;
        return this.tableData.slice(start, start + this.rowsPerPage);
    }
}
