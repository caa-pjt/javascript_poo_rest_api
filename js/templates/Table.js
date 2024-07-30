import { ObserverSingleton } from '../observers/ObserverSingleton.js';

export class Table {
  constructor(options = {}, showEditForm) {

    this.subject = ObserverSingleton.getInstance();
    console.log("Table observer instance:", this.subject);

    this.data = [];
    this.currentPage = 1;
    this.rowsPerPage = options.rowsPerPage || 10;
    this.sortColumn = options.sortColumn || "id";
    this.sortOrder = options.sortOrder || "asc";
    this.showEditForm = showEditForm;
    this.totalPages = 0;
    this.tableContainer = options.tableContainer || document.body;

        this.updateTotalPages();

        this.render();
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
                console.log("Table received add notification:", notification);
                this.addRow(notification.data);
                break;
            case "delete":
                this.deleteRow(notification.id);
                break;
            case "edit":
                this.showEditForm(notification.id);
                break;
            default:
                console.log("Table called with unknown notification:", notification);
      }
  }

    render() {
        this.tableContainer.innerHTML = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th scope="col">
                        <button class="btn btn-link" id="sort-id">ID <span id="indicator-id"></span></button>
                    </th>
                    <th scope="col">
                        <button class="btn btn-link" id="sort-title">Title <span id="indicator-title"></span></button>
                    </th>
                    <th scope="col">En ligne ?</th>
                    <th scope="col" class="text-end">Actions</th>
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
                    <input type="checkbox" class="form-check-input" disabled data-id="${item.id}" ${item.published ? 'checked' : ''}>
                </td>
                <td class="text-end">
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${item.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Ajout des écouteurs d'événements après chaque mise à jour de la table
        this.addEventListeners();
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
        // Nettoyer les anciens événements pour éviter les doublons
        const sortButtons = document.querySelectorAll('[id^="sort-"]');
        sortButtons.forEach(button => {
            button.removeEventListener('click', this.handleSortClick);
            button.addEventListener('click', this.handleSortClick);
        });

        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.removeEventListener('click', this.handleEditClick);
            button.addEventListener('click', this.handleEditClick);
        });

        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.removeEventListener('click', this.handleDeleteClick);
            button.addEventListener('click', this.handleDeleteClick);
        });
    }

    // Gestion des événements séparée pour éviter les doublons
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
        // Vérifiez si la ligne est déjà dans le tableau
        const existingRow = document.querySelector(`tr[data-id="${item.id}"]`);
        if (existingRow) {
            console.log(`Row with ID ${item.id} already exists.`);
            return; // Ne rien faire si la ligne existe déjà
        }

        // Vérifier le nombre de lignes sur la page actuelle
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        const currentPageData = this.data.slice(start, end);

        if (currentPageData.length >= this.rowsPerPage) {
            // Si la page actuelle est la dernière page
            if (this.currentPage === this.totalPages) {
                // Ajouter une nouvelle page
                this.currentPage++;
                this.updateTotalPages();
            } else {
                // Ne rien faire si la page actuelle n'est pas la dernière page
                return;
            }
        }

        // Ajouter l'élément au tableau de données
        this.data.push(item);
        this.updateTotalPages();

        // Si la page actuelle est la dernière page, rendre la nouvelle page avec la nouvelle ligne ajoutée
        if (this.currentPage === this.totalPages) {
            this.render();
        } else {
            // Ajouter la nouvelle ligne au tableau actuel
            const tbody = document.getElementById('table-body');
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;

            // Ajouter une cellule avec une case à cocher
            const isChecked = item.published ? 'checked' : '';
            tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td>
            <input type="checkbox" class="form-check-input" disabled="" ${isChecked}/>
        </td>
        <td class="text-end">
            <button class="btn btn-primary btn-sm edit-btn" data-id="${item.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
        </td>
        `;
            tbody.appendChild(tr);

            // Ajouter des événements pour les nouveaux boutons ajoutés dynamiquement
            tr.querySelector('.edit-btn').addEventListener('click', this.handleEditClick);
            tr.querySelector('.delete-btn').addEventListener('click', this.handleDeleteClick);

            // Ajouter des événements pour les cases à cocher ajoutées dynamiquement
            tr.querySelector('.publish-checkbox').addEventListener('change', this.handleCheckboxChange);

            // Ajouter les écouteurs d'événements
            this.addEventListeners();
        }

        this.renderPagination();
    }

    updateRow(item) {
        const tr = document.querySelector(`tr[data-id="${item.id}"]`);
        if (tr) {
            tr.children[1].textContent = item.title;
            tr.querySelector('[type="checkbox"]').checked = item.published;
        }
    }

    deleteRow(id) {
      // Supprimer la ligne du tableau
      const tr = document.querySelector(`tr[data-id="${id}"]`);
      if (tr) {
        tr.remove();
      }

    // console.log("This data before filter :", this.data);

        // Supprimer l'élément du tableau des données
        this.data = this.data.filter(item => item.id !== id);

    // console.log("This data after filter :", this.data);

        // Mettre à jour le nombre total de pages
        this.updateTotalPages();

        // Si la page actuelle dépasse le nombre total de pages, revenir à la page précédente
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }

        // Recalculer la pagination et rendre la table
        this.renderTable();
        this.renderPagination();

    }
}
