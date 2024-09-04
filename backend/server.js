const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors()); // Enable CORS
app.use(express.json()); // Middleware to parse JSON bodies

// In-memory 'database'
const users = [{ username: 'super', password: '123', email: 'super@example.com' }];
const groups = [
  { name: 'Group 1', channels: ['Channel A', 'Channel B', 'Channel C', 'Channel D'], members: ['Josh', 'Steve', 'John', 'Rob', 'Lester', 'Moe'], groupAdmin: 'Josh' },
  { name: 'Group 2', channels: ['Channel E', 'Channel F'], members: ['Emily', 'Anna'], groupAdmin: 'Emily' },
  { name: 'Group 3', channels: ['Channel G', 'Channel H', 'Channel I'], members: ['Bob', 'Kevin', 'Stuart'], groupAdmin: 'Kevin' },
  { name: 'Group 4', channels: ['Channel J', 'Channel K', 'Channel L', 'Channel M'], members: ['Sarah', 'Alex'], groupAdmin: 'Sarah' },
  { name: 'Group 5', channels: ['Channel N', 'Channel O', 'Channel P', 'Channel Q'], members: ['Emma', 'Olivia', 'Ava'], groupAdmin: 'Emma' },
  { name: 'Group 6', channels: ['Channel R', 'Channel S', 'Channel T'], members: ['Grace', 'Chloe', 'Zoe'], groupAdmin: 'Chloe' },
  { name: 'Group 7', channels: ['Channel U', 'Channel V'], members: ['Hannah', 'Lily'], groupAdmin: 'Hannah' }
];

// Route to get all users (for testing purposes)
app.get('/users', (req, res) => {
  res.json(users);
});

// Route to get all groups
app.get('/groups', (req, res) => {
  res.json(groups);
});

// Route to create a new group
app.post('/groups', (req, res) => {
  const { name, channels, members, groupAdmin } = req.body;

  // Check if a group with the same name already exists
  const groupExists = groups.some(group => group.name === name);
  if (groupExists) {
    return res.status(400).json({ message: `Group with name ${name} already exists.` });
  }

  const newGroup = { name, channels: channels || [], members: members || [], groupAdmin };
  groups.push(newGroup);
  res.status(201).json({ message: `Group ${name} created successfully!`, group: newGroup });
});

// Route to add a new channel to a group
app.post('/groups/:groupName/channels', (req, res) => {
  const { groupName } = req.params;
  const { channel } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  if (group.channels.includes(channel)) {
    return res.status(400).json({ message: `Channel ${channel} already exists in group ${groupName}.` });
  }

  group.channels.push(channel);
  res.status(201).json({ message: `Channel ${channel} added to group ${groupName} successfully!`, group });
});

// Route to add a member to a group
app.post('/groups/:groupName/add-member', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  if (group.members.includes(member)) {
    return res.status(400).json({ message: `${member} is already a member of ${groupName}.` });
  }

  group.members.push(member);
  res.status(200).json({ message: `${member} added to ${groupName} successfully!`, group });
});

// Route to remove a member from a group
app.post('/groups/:groupName/remove-member', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  const memberIndex = group.members.indexOf(member);
  if (memberIndex === -1) {
    return res.status(400).json({ message: `${member} is not a member of ${groupName}.` });
  }

  group.members.splice(memberIndex, 1);
  res.status(200).json({ message: `${member} removed from ${groupName} successfully!`, group });
});

// Route for user registration
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
    res.json({ message: `User ${username} logged in successfully!` });
  } else {
    res.status(401).json({ message: 'Invalid username or password!' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
