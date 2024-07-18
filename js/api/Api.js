export class Api {
    constructor(url) {
        this._url = url;
    }

    get() {
        return fetch(this._url)
            .then((response) => response.json())
            .catch((error) => console.error(error));
    }

    deleteData(id) {
        return fetch(`${this._url}/${id}`, {
            method: 'DELETE',
        }).then((response) => response.json()).catch((error) => console.error(error));

    }

    updateData(id, data) {
        console.log("Api", id, data);
        return fetch(`${this._url}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then((response) => response.json())
            .catch((error) => console.error(error));
    }

    setData(data) {
        console.log("Add new data", data);
        return fetch(this._url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then((response) => response.json())
            .catch((error) => console.error(error));
    }
}

export class MyApi extends Api {
    constructor(url) {
        super(url);
    }

    async getData() {
        return await super.get();
    }

    async deleteData(id) {
        return await super.deleteData(id);
    }

    async updateData(id, data) {
        console.log("MyApi", id, data);
        return await super.updateData(id, data);
    }

    async addData(data) {
        return await super.setData(data);
    }
}
