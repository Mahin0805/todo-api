const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to allow our app to read JSON from Postman
app.use(express.json());

let todos = [
    { id: 1, task: "Learn Node.js", completed: false },
    { id: 2, task: "Build an API", completed: false }
];

// --- YOUR ROUTES GO HERE ---

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

 // GET /todos - Get all todos
app.get('/todos', (req, res) => {
    res.json(todos);
});

 // POST /todos - Create a new todo
app.post('/todos', (req, res) => {
    const newTodo = {
        id: todos.length + 1,
        task: req.body.task,
        completed: false
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

 // PUT /todos/:id - Update a todo

app.put('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.task = req.body.task || todo.task;
        todo.completed = req.body.completed ?? todo.completed;
        res.json(todo);
    } else {
        res.status(404).send("Todo not found");
    }
});

 // DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex !== -1) {
        todos.splice(todoIndex, 1);
        res.status(204).send();
    } else {
        res.status(404).send("Todo not found");
    }
});