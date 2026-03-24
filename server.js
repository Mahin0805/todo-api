const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(express.json());

let users = [
    { id: 1, username: "mahin", email: "mahin@gmail.com", password: "password1" },
    { id: 2, username: "khaled", email: "khaled@gmail.com", password: "password2" }
];

let todos = [
    { id: 1, task: "Learn Node.js", completed: false },
    { id: 2, task: "Build an API", completed: false },
    { id: 3, task: "Deploy the todo app", completed: true }
];


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


app.get('/todos', (req, res) => {
    res.json(todos);
});


app.post('/todos', (req, res) => {
    const newTodo = {
        id: crypto.randomUUID(),
        task: req.body.task,
        completed: false
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});



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

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    users.push({ username, email, password });
    res.status(201).json({ message: "User registered successfully!" });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Create the Access Token (The "Digital Key")
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ accessToken: token });
    } else {
        res.status(401).json({ message: "Invalid username or password" });
    }
});