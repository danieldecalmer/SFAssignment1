const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors()); // Enable CORS
app.use(express.json()); // Middleware to parse JSON bodies

// In-memory 'database'
const users = [{ username: 'super', password: '123', email: 'super@example.com' }];

// Route to get all users (for testing purposes)
app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  const userExists = users.some(user => user.username === username || user.email === email);
  if (userExists) {
    res.status(400).json({ message: 'Username or email already exists' });
    return;
  }
  users.push({ username, password, email });
  res.status(201).json({ message: `User ${username} registered successfully!` });
});


// Route for user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username && user.password === password);
  if (user) {
    res.send(`User ${username} logged in successfully!`);
  } else {
    res.status(401).send('Invalid username or password!');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
