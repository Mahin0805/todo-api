const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "my-secret-key123456";

app.use(express.json());

let users = [
  { id: 1, username: "mahin", email: "mahin@gmail.com", password: "password1" },
  {
    id: 2,
    username: "khaled",
    email: "khaled@gmail.com",
    password: "password2",
  },
];

let todos = [
  { id: 1, task: "Learn Node.js", completed: false },
  { id: 2, task: "Build an API", completed: false },
  { id: 3, task: "Deploy the todo app", completed: true },
];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided!" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {console.log("JWT Error:", err.message);
    return res.status(403).json({ message: "Invalid token!" });}
    req.user = user;
    next();
  });
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.post("/todos", (req, res) => {
  const newTodo = {
    id: crypto.randomUUID(),
    task: req.body.task,
    completed: false,
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.task = req.body.task || todo.task;
    todo.completed = req.body.completed ?? todo.completed;
    res.json(todo);
  } else {
    res.status(404).send("Todo not found");
  }
});

app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex !== -1) {
    todos.splice(todoIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).send("Todo not found");
  }
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  users.push({ username, email, password });
  res.status(201).json({ message: "User registered successfully!" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ username: user.username }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ accessToken: token });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

app.get("/user/profile", authenticateToken, (req, res) => {
  const user = users.find((u) => u.username === req.user.username);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    username: user.username,
    email: user.email || "No email set",
  });
});

app.put("/user/profile", authenticateToken, (req, res) => {
  const user = users.find((u) => u.username === req.user.username);

  if (!user) return res.status(404).json({ message: "User not found" });

  if (req.body.username) user.username = req.body.username;
  if (req.body.email) user.email = req.body.email;

  res.json({
    message: "Profile updated successfully!",
    updatedUser: {
      username: user.username,
      email: user.email,
    },
  });
});
