export class Post  {
    constructor(data) {
        this._title = data.title;
        this._userId = data.userId;
        this._id = data.id;
        this._body = data.body;
    }

    get title() {
        return this._title;
    }

    get userId() {
        return this._userId;
    }

    get id() {
        return this._id;
    }

    get body() {
        const words = this._body.split(' ');
        return words.reduce((acc, word) => {
            if (word.length < 5) {
                acc += ' ';
            } else {
                acc += word[word.length - 1].toUpperCase();
            }
            return acc;
        }, '');
    }
}