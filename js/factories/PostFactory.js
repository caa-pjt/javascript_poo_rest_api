import { Post } from '../models/Post.js';
export class PostFactory {
    static create(data) {
        return new Post(data);
    }
}