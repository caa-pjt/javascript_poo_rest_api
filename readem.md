# Javascript simple POO rest API

## Description
This is a simple rest API that uses POO in javascript. It has a simple CRUD for tasks.
You can create, read, update and delete tasks. The tasks are stored in a JSON file.
You can use the browser to test the API.

## Installation
1. Clone the repository [here]('https://github.com/caa-pjt/javascript_poo_rest_api.git')
2. Run `npm install` to install the dependencies
3. Run `npm start` to start the server on port 3000 and HttP server on http://localhost:8080
4. You can use Postman to test the API
5. You can also use the browser to test the API

## Usage
1. You can create a task by sending a POST request to `http://localhost:8080/posts` with the following JSON object:
```json
{
    "title": "Task title",
    "published": true
}
```
2. You can get all tasks by sending a GET request to `http://localhost:8080/posts`
4. You can update a task by sending a PATCH request to `http://localhost:8080/posts/:id` with the following JSON object:
```json
{
    "title": "Task title",
    "published": true
}
```
5. You can delete a task by sending a DELETE request to `http://localhost:8080/posts/:id`
6. You can also use the browser to test the API
7. You can also use Postman to test the

The Browser will display the tasks in a table format with the following columns:
- ID
- Title
- Published
- Actions
  - Edit
  - Delete
- Add Task

## License
MIT License