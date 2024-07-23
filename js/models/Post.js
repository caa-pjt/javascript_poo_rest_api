export class Post  {
    constructor(data) {
        this._id = data.id;
        this._title = data.title;
    }

    get title() {
        return this._title;
    }


    get id() {
        return this._id;
    }

    createExcerpt = (content, maxNumberOfWords, trailingIndicator = '...') => {
        const listOfWords = content.trim().split(' ');
        const truncatedContent = listOfWords.slice(0, maxNumberOfWords).join(' ');
        const excerpt = truncatedContent + trailingIndicator;
        const output = listOfWords.length > maxNumberOfWords ? excerpt : content;

        return output;
    };

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