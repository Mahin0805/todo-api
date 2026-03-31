const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "my-secret-key123456";

const corsOriginsRaw = process.env.CORS_ORIGIN;
const allowedOrigins = corsOriginsRaw
  ? corsOriginsRaw
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : null;

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins) {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

let users = [
  { id: 1, username: "mahin", email: "mahin@gmail.com", password: "password1" },
  { id: 2, username: "khaled", email: "khaled@gmail.com", password: "password2",},
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
    if (err) {
      console.log("JWT Error:", err.message);
      return res.status(403).json({ message: "Invalid token!" });
    }
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
  const id = req.params.id;

  const todo = todos.find((t) => t.id == id);
  if (todo) {
    todo.task = req.body.task || todo.task;
    todo.completed = req.body.completed ?? todo.completed;
    res.json(todo);
  } else {
    res.status(404).send("Todo not found");
  }
});

app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;

  const todoIndex = todos.findIndex((t) => t.id == id);
  if (todoIndex !== -1) {
    todos.splice(todoIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).send("Todo not found");
  }
});

app.post("/register", (req, res) => {
  const {
    username,
    name,
    email,
    password,
    confirmPassword,
    confirm_password,
    password_confirmation,
    confirm,
  } = req.body || {};

  const resolvedUsername =
    typeof username === "string" && username.trim()
      ? username.trim()
      : typeof name === "string" && name.trim()
        ? name.trim()
        : null;

  const resolvedEmail =
    typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;

  const resolvedPassword =
    typeof password === "string" && password ? password : null;

  const confirmCandidate =
    typeof confirmPassword === "string"
      ? confirmPassword
      : typeof confirm_password === "string"
        ? confirm_password
        : typeof password_confirmation === "string"
          ? password_confirmation
        : typeof confirm === "string"
          ? confirm
          : null;

  const resolvedConfirm =
    typeof confirmCandidate === "string" && confirmCandidate
      ? confirmCandidate
      : null;

  if (!resolvedUsername || !resolvedEmail || !resolvedPassword) {
    return res.status(400).json({
      message: "username/name, email, and password are required",
    });
  }

  if (!resolvedConfirm) {
    return res
      .status(400)
      .json({ message: "confirmPassword is required" });
  }

  if (resolvedConfirm !== resolvedPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existingUser = users.find(
    (u) => typeof u.email === "string" && u.email.toLowerCase() === resolvedEmail,
  );
  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const newUser = {
    id: crypto.randomUUID(),
    username: resolvedUsername,
    email: resolvedEmail,
    password: resolvedPassword,
  };
  users.push(newUser);

  res.status(201).json({
    message: "User registered successfully!",
    user: {
      id: newUser.id,
      name: newUser.username,
      email: newUser.email,
    },
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const resolvedEmail =
    typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;

  if (!resolvedEmail || typeof password !== "string") {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = users.find(
    (u) => typeof u.email === "string" && u.email.toLowerCase() === resolvedEmail && u.password === password,
  );

  if (user) {
    const token = jwt.sign({ username: user.username }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({
      access_token: token,
      token_type: "Bearer",
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
      },
    });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

app.get("/user", authenticateToken, (req, res) => {
  const user = users.find((u) => u.username === req.user.username);

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    username: user.username,
    email: user.email || "No email set",
  });
});

app.put("/user", authenticateToken, (req, res) => {
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
