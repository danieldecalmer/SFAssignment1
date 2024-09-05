const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Allow credentials and specify allowed origin
app.use(cors({
  origin: 'http://localhost:4200', // Specify the frontend's origin
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

// Configure session middleware
app.use(session({
  secret: 'secret-key', // Replace with a strong secret key for signing session ID cookies
  resave: false, // Prevent session being saved back to the session store if it wasn't modified
  saveUninitialized: false, // Don't save uninitialized sessions (sessions with no data)
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Set to true if using HTTPS
}));

// In-memory 'database'
let users = [
  {
    id: uuidv4(),
    username: 'super',
    password: '123',
    email: 'super@example.com',
    roles: ['group', 'super'],
    groups: ['Group 1', 'Group 2']
  },
  {
    id: uuidv4(),
    username: 'groupexample',
    password: '123',
    email: 'user@example.com',
    roles: ['group'],
    groups: ['Group 1', 'Group 2']
  }
];

let groups = [
  // {
  //   id: uuidv4(),
  //   name: 'Group 1',
  //   channels: ['Channel A', 'Channel B', 'Channel C', 'Channel D'],
  //   members: ['super'],
  //   groupAdmins: ['super'],
  //   waitingList: [] // New waiting list for users interested in joining
  // },
  // {
  //   id: uuidv4(),
  //   name: 'Group 2',
  //   channels: ['Channel E', 'Channel F'],
  //   members: ['super', 'groupexample'],
  //   groupAdmins: ['super', 'groupexample'],
  //   waitingList: [] // New waiting list for users interested in joining
  // }
];

// Route to add user to a group's waiting list
app.post('/groups/:groupName/register-interest', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Check if the user is already a member
  if (group.members.includes(username)) {
    return res.status(400).json({ message: `${username} is already a member of ${groupName}.` });
  }

  // Check if the user is already in the waiting list
  if (group.waitingList.includes(username)) {
    return res.status(400).json({ message: `${username} is already in the waiting list for ${groupName}.` });
  }

  // Add the user to the waiting list
  group.waitingList.push(username);
  res.status(200).json({ message: `${username} has been added to the waiting list for ${groupName}.`, group });
});

// Route to get the waiting list for a specific group
app.get('/groups/:groupName/waiting-list', (req, res) => {
  const { groupName } = req.params;

  // Find the group by name
  const group = groups.find(g => g.name === groupName);
  
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Return the waiting list
  res.status(200).json(group.waitingList || []);
});

// Add a member from the waiting list to the group
app.post('/groups/:groupName/add-member', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  // Find the group
  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Check if the user is already a member
  if (group.members.includes(member)) {
    return res.status(400).json({ message: `${member} is already a member of ${groupName}.` });
  }

  // Add the user to the group's members list
  group.members.push(member);

  // Remove the user from the waiting list
  group.waitingList = group.waitingList.filter(waitingMember => waitingMember !== member);

  // Find the user and update their groups array
  const user = users.find(u => u.username === member);
  if (user) {
    user.groups.push(groupName);
  } else {
    return res.status(404).json({ message: `User ${member} not found.` });
  }

  return res.status(200).json({ message: `${member} added to ${groupName} successfully!`, group });
});

// Leave a group (removes the user from the group and their groups array)
app.post('/groups/:groupName/leave', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  // Find the group
  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Remove the user from the group's members list
  group.members = group.members.filter(member => member !== username);

  // If the user is the group admin, remove them and handle admin promotion or no admin case
  if (group.groupAdmin === username) {
    group.groupAdmin = ''; // Clear the admin field (could promote another user here if needed)
    if (group.members.length > 0) {
      group.groupAdmin = group.members[0]; // Promote the first member as the new admin
    }
  }

  // Find the user and remove the group from their groups array
  const user = users.find(u => u.username === username);
  if (user) {
    user.groups = user.groups.filter(group => group !== groupName);
  } else {
    return res.status(404).json({ message: `User ${username} not found.` });
  }

  return res.status(200).json({ message: `${username} has left ${groupName} successfully.`, group, user });
});

// Route to kick a member from a group
app.post('/groups/:groupName/kick', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  // Remove member from the group
  group.members = group.members.filter(m => m !== member);

  // If the member was a groupAdmin, remove them from groupAdmin role
  if (group.groupAdmin === member) {
    group.groupAdmin = null;
  }

  // Also remove the group from the member's groups array
  const user = users.find(u => u.username === member);
  if (user) {
    user.groups = user.groups.filter(g => g !== groupName);
  }

  res.status(200).json({ message: `${member} removed from ${groupName}` });
});

// Route to promote a member to group admin
app.post('/groups/:groupName/promote', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  const user = users.find(u => u.username === member);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Add 'group' role to the member's roles array
  if (!user.roles.includes('group')) {
    user.roles.push('group');
  }

  res.status(200).json({ message: `${member} promoted to group admin` });
});

// POST route to create a new group
app.post('/groups', (req, res) => {
  const { name, groupAdmin } = req.body;
  const groupExists = groups.some(group => group.name === name);

  if (groupExists) {
    return res.status(400).json({ message: `Group with name ${name} already exists.` });
  }

  // Find the creator from the user session or the provided `groupAdmin`
  const creator = users.find(user => user.username === groupAdmin);
  
  if (!creator) {
    return res.status(400).json({ message: `User ${groupAdmin} not found.` });
  }

  // Check if the creator is a super admin
  const isSuperAdmin = creator.roles.includes('super');
  
  // Define the groupAdmins array
  const groupAdmins = isSuperAdmin ? [groupAdmin] : [groupAdmin, 'super'];

  // Create the new group object
  const newGroup = {
    id: uuidv4(),
    name: name,
    channels: [],
    members: [...groupAdmins], // Add all group admins to the members list automatically
    groupAdmin: groupAdmin,
    groupAdmins: groupAdmins,
    waitingList: []
  };

  // Route to delete a group (super admins or group admins only)
app.delete('/groups/:groupName', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body; // The user making the delete request

  // Find the group
  const group = groups.find(g => g.name === groupName);

  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Find the user making the request
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ message: `User ${username} not found.` });
  }

  // Check if the user is either a super admin or a group admin for this group
  if (user.roles.includes('super') || group.groupAdmins.includes(username)) {
    // Remove the group from the groups array
    const index = groups.indexOf(group);
    groups.splice(index, 1);

    // Remove the group from all users' groups arrays
    users.forEach(u => {
      u.groups = u.groups.filter(group => group !== groupName);
    });

    res.status(200).json({ message: `Group ${groupName} deleted successfully.` });
  } else {
    res.status(403).json({ message: `You are not authorized to delete this group.` });
  }
});

  // Add the new group to the groups array
  groups.push(newGroup);

  // Add the new group to each group admin's `groups` array
  groupAdmins.forEach(admin => {
    const user = users.find(u => u.username === admin);
    if (user) {
      user.groups.push(name); // Add the group name to the admin's groups array
    }
  });

  res.status(201).json({ message: `Group ${name} created successfully!`, group: newGroup });
});

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
    return res.status(400).json({ message: 'Username or email already exists' });
  }

  // Create a new user object with uuid, and empty roles and groups arrays
  const newUser = {
    id: uuidv4(), // Generate a unique ID
    username: username,
    password: password,
    email: email,
    roles: [], // Initialize with no roles
    groups: [] // Initialize with no group memberships
  };

  users.push(newUser); // Add the new user to the in-memory database

  res.status(201).json({ message: `User ${username} registered successfully!`, user: newUser });
});

// Route to log in the user and create a session
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Store the user's information in the session
    req.session.user = {
      id: user.id,
      username: user.username,
      roles: user.roles,
      groups: user.groups
    };
    res.json({ message: `User ${username} logged in successfully!\n id: ${user.id}, username: ${user.username}, roles: ${user.roles}, groups: ${user.groups}` });
  } else {
    res.status(401).json({ message: 'Invalid username or password!' });
  }
});

// Route to check if a user is logged in
app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.json({
      message: `Welcome, ${req.session.user.username}`,
      user: req.session.user
    });
  } else {
    res.status(401).json({ message: 'Please log in first.' });
  }
});

// Route to reset in-memory 'database'
app.post('/reset', (req, res) => {
  users = []; // Clear the users array
  groups = []; // Clear the groups array

  // Optionally, reinitialize with default data
  users.push({
    id: uuidv4(),
    username: 'super',
    password: '123',
    email: 'super@example.com',
    roles: ['group', 'super'],
    groups: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'Group 7']
  });

  groups.push(
    {
      name: 'Group 1',
      channels: ['Channel A', 'Channel B', 'Channel C', 'Channel D'],
      members: ['super'],
      groupAdmin: 'super'
    },
    {
      name: 'Group 2',
      channels: ['Channel E', 'Channel F'],
      members: ['super'],
      groupAdmin: 'super'
    }
  );

  res.status(200).json({ message: 'In-memory database has been reset' });
});

// Route to log out the user and destroy the session
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed!' });
    }
    res.json({ message: 'Logged out successfully!' });
  });
});

app.get('/user-session', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user); // Return the user session data
  } else {
    res.status(401).json({ message: 'User not logged in' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
