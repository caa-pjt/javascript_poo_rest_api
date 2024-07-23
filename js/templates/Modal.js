export class Modal {
    constructor() {
        this.modalContainer = document.querySelector('body');
        this.render();
    }

    render() {
        this.modalContainer.insertAdjacentHTML('beforeend', `
            <div class="modal" id="editModal" style="display: none;">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title">Edit Item</h5>
                          <button type="button" class="close-modal" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                        <div class="modal-body" id="modal-body">
                            <!-- Form will be injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    renderEditForm(item = '') {
        const modalBody = document.getElementById('modal-body');
        item = item.title || '';
        modalBody.innerHTML = `
            <form id="edit-form">
                <div class="form-group">
                    <label for="edit-title">Title</label>
                    <input type="text" id="edit-title" class="form-control mb-3" value="${item}">
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
            </form>
        `;

        const editForm = document.getElementById('edit-form');
        editForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Logic for saving changes
            this.hide(); // Ferme la modal après la soumission
        });

        // Ajoutez des événements pour fermer la modal
        document.querySelectorAll('[data-dismiss="modal"]').forEach((btn) => {
            btn.addEventListener('click', () => this.hide());
        });
    }

    show() {
        const modal = document.getElementById('editModal');
        modal.style.display = 'block'; // Affiche la modal
    }

    hide() {
        const modal = document.getElementById('editModal');
        modal.style.display = 'none'; // Cache la modal

        setTimeout(() => {
            this.innerHTML = ''; // Supprime le contenu de la modal
        }, 300);
    }
}
