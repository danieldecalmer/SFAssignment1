const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra'); // For reading and writing to JSON file
const path = require('path');
const app = express();
const PORT = 3000;
const { connectToDatabase } = require('./db');

let db, usersCollection, groupsCollection;

// Connect to MongoDB once when the server starts
(async () => {
  db = await connectToDatabase();
  if (db) {
    console.log('Database connected and server starting...');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    console.error('Database connection failed. Server not started.');
  }
})();

// Helper function to load data
const loadData = async () => {
  try {
    // Assuming collections 'users', 'groups', and 'bannedList' exist in the MongoDB database.
    const users = await db.collection('users').find({}).toArray(); // Fetch all users from 'users' collection
    const groups = await db.collection('groups').find({}).toArray(); // Fetch all groups from 'groups' collection
    const bannedList = await db.collection('bannedList').find({}).toArray(); // Fetch all banned users from 'bannedList' collection
    
    return { users, groups, bannedList };
  } catch (error) {
    console.error("Error loading data from MongoDB:", error);
    return { users: [], groups: [], bannedList: [] }; // Default structure if something goes wrong
  }
};

// Helper function to save data
const saveData = async (data) => {
  try {
    // Save users
    for (let user of data.users) {
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: user },
        { upsert: true } // Create a new user if one doesn't exist
      );
    }

    // Save groups
    for (let group of data.groups) {
      await db.collection('groups').updateOne(
        { id: group.id },
        { $set: group },
        { upsert: true } // Create a new group if one doesn't exist
      );
    }

    // Save bannedList
    for (let banned of data.bannedList) {
      await db.collection('bannedList').updateOne(
        { username: banned.username },
        { $set: banned },
        { upsert: true } // Create a new entry in bannedList if one doesn't exist
      );
    }
  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
  }
};


// Load initial data
let { users, groups, bannedList } = await loadData();

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

// Route to get the user session data
app.get('/user-session', (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.session.user); // Return the user session data
  } else {
    res.status(401).json({ message: 'User not logged in' });
  }
});

// Route to get all groups
app.get('/groups', async (req, res) => {
  try {
    const groups = await groupsCollection.find().toArray(); // Fetch all groups from MongoDB
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// Route to get all users (for listing all users)
app.get('/users', async (req, res) => {
  try {
    const users = await usersCollection.find().toArray(); // Fetch all users from MongoDB
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
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

  saveData({ users, groups, bannedList });

  res.status(201).json({ message: `Channel ${channel} added to group ${groupName} successfully!`, group });
});

// Route to delete a channel from a group
app.delete('/groups/:groupName/channels/:channel', (req, res) => {
  const { groupName, channel } = req.params;
  const { username } = req.body;

  // Find the group by name
  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Check if the user is a group admin or super admin
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: `User ${username} not found.` });
  }

  if (!user.roles.includes('super') && !group.groupAdmins.includes(username)) {
    return res.status(403).json({ message: `You are not authorized to delete channels in this group.` });
  }

  // Check if the channel exists in the group's channels
  const channelIndex = group.channels.indexOf(channel);
  if (channelIndex === -1) {
    return res.status(404).json({ message: `Channel ${channel} not found in group ${groupName}.` });
  }

  // Remove the channel from the group's channels array
  group.channels.splice(channelIndex, 1);

  // Save the updated data to the JSON file
  saveData({ users, groups, bannedList });

  res.status(200).json({ message: `Channel ${channel} deleted from group ${groupName} successfully.` });
});


// Route to ban a user and submit the report
app.post('/ban-user', (req, res) => {
  const { username, report } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: `User ${username} not found.` });
  }

  groups.forEach(group => {
    group.members = group.members.filter(member => member !== username);
    if (group.groupAdmin === username) {
      group.groupAdmin = group.members.length > 0 ? group.members[0] : null;
    }
  });

  user.groups = [];

  bannedList.push({ username: username, report: report || 'No report provided' });

  saveData({ users, groups, bannedList });

  res.status(200).json({ message: `${username} has been banned successfully.` });
});

// Route to unban a user
app.post('/unban-user', (req, res) => {
  const { username } = req.body;

  const bannedIndex = bannedList.findIndex(bannedUser => bannedUser.username === username);

  if (bannedIndex === -1) {
    return res.status(404).json({ message: `User ${username} not found in banned list.` });
  }

  bannedList.splice(bannedIndex, 1);

  saveData({ users, groups, bannedList });

  res.status(200).json({ message: `${username} has been unbanned successfully.` });
});

// Route to get all banned users
app.get('/banned-users', (req, res) => {
  res.status(200).json(bannedList);
});

// Route to kick a member from a group
app.post('/groups/:groupName/kick', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  // Find the group by its name
  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  // Check if the member exists in the group
  if (!group.members.includes(member)) {
    return res.status(400).json({ message: `${member} is not a member of ${groupName}.` });
  }

  // Remove the member from the group's member list
  group.members = group.members.filter(m => m !== member);

  // If the member was the group admin, clear or reassign the group admin role
  if (group.groupAdmin === member) {
    group.groupAdmin = group.members.length > 0 ? group.members[0] : null; // Promote another member or set to null
  }

  // Optionally, update the user's group list (if you store this on the user object)
  const user = users.find(u => u.username === member);
  if (user) {
    user.groups = user.groups.filter(g => g !== groupName);
  }

  // Save the updated group data to the JSON file
  saveData({ users, groups, bannedList });

  // Respond with success
  res.status(200).json({ message: `${member} has been removed from ${groupName}.` });
});



// Route to add user to a group's waiting list
app.post('/groups/:groupName/register-interest', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  if (group.members.includes(username)) {
    return res.status(400).json({ message: `${username} is already a member of ${groupName}.` });
  }

  if (group.waitingList.includes(username)) {
    return res.status(400).json({ message: `${username} is already in the waiting list for ${groupName}.` });
  }

  group.waitingList.push(username);
  saveData({ users, groups, bannedList });
  res.status(200).json({ message: `${username} has been added to the waiting list for ${groupName}.`, group });
});

// Route to get the waiting list for a specific group
app.get('/groups/:groupName/waiting-list', (req, res) => {
  const { groupName } = req.params;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  res.status(200).json(group.waitingList || []);
});

// Add a member from the waiting list to the group
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
  group.waitingList = group.waitingList.filter(waitingMember => waitingMember !== member);

  const user = users.find(u => u.username === member);
  if (user) {
    user.groups.push(groupName);
  } else {
    return res.status(404).json({ message: `User ${member} not found.` });
  }

  saveData({ users, groups, bannedList });
  return res.status(200).json({ message: `${member} added to ${groupName} successfully!`, group });
});

// Leave a group
app.post('/groups/:groupName/leave', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  group.members = group.members.filter(member => member !== username);

  if (group.groupAdmin === username) {
    group.groupAdmin = '';
    if (group.members.length > 0) {
      group.groupAdmin = group.members[0];
    }
  }

  const user = users.find(u => u.username === username);
  if (user) {
    user.groups = user.groups.filter(group => group !== groupName);
  } else {
    return res.status(404).json({ message: `User ${username} not found.` });
  }

  saveData({ users, groups, bannedList });
  return res.status(200).json({ message: `${username} has left ${groupName} successfully.`, group, user });
});

// Route to promote a member to group admin
app.post('/groups/:groupName/promote', (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  const user = users.find(u => u.username === member);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.roles.includes('group')) {
    user.roles.push('group');
  }

  saveData({ users, groups, bannedList });
  res.status(200).json({ message: `${member} promoted to group admin` });
});

// POST route to create a new group
app.post('/groups', (req, res) => {
  const { name, groupAdmin } = req.body;
  const groupExists = groups.some(group => group.name === name);

  if (groupExists) {
    return res.status(400).json({ message: `Group with name ${name} already exists.` });
  }

  const creator = users.find(user => user.username === groupAdmin);
  
  if (!creator) {
    return res.status(400).json({ message: `User ${groupAdmin} not found.` });
  }

  const isSuperAdmin = creator.roles.includes('super');
  const groupAdmins = isSuperAdmin ? [groupAdmin] : [groupAdmin, 'super'];

  const newGroup = {
    id: uuidv4(),
    name: name,
    channels: [],
    members: [...groupAdmins],
    groupAdmin: groupAdmin,
    groupAdmins: groupAdmins,
    waitingList: []
  };

  groups.push(newGroup);

  groupAdmins.forEach(admin => {
    const user = users.find(u => u.username === admin);
    if (user) {
      user.groups.push(name);
    }
  });

  saveData({ users, groups, bannedList });
  res.status(201).json({ message: `Group ${name} created successfully!`, group: newGroup });
});

// Route to delete a group
app.delete('/groups/:groupName', (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  const group = groups.find(g => g.name === groupName);
  if (!group) {
    return res.status(404).json({ message: `Group ${groupName} not found.` });
  }

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ message: `User ${username} not found.` });
  }

  if (user.roles.includes('super') || group.groupAdmins.includes(username)) {
    const index = groups.indexOf(group);
    groups.splice(index, 1);

    users.forEach(u => {
      u.groups = u.groups.filter(group => group !== groupName);
    });

    saveData({ users, groups, bannedList });
    res.status(200).json({ message: `Group ${groupName} deleted successfully.` });
  } else {
    res.status(403).json({ message: `You are not authorized to delete this group.` });
  }
});

// Route to register a user
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  const userExists = users.some(user => user.username === username || user.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'Username or email already exists' });
  }

  const newUser = {
    id: uuidv4(),
    username: username,
    password: password,
    email: email,
    roles: [],
    groups: []
  };

  users.push(newUser);

  saveData({ users, groups, bannedList });
  res.status(201).json({ message: `User ${username} registered successfully!`, user: newUser });
});

// Route to log in the user and create a session
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.user = {
      id: user.id,
      username: user.username,
      roles: user.roles,
      groups: user.groups
    };

    res.json({ 
      message: `User ${username} logged in successfully!`,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles,
        groups: user.groups
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password!' });
  }
});

// Route to reset data (for testing)
app.post('/reset', (req, res) => {
  users = [
    {
      id: uuidv4(),
      username: 'super',
      password: '123',
      email: 'super@example.com',
      roles: ['group', 'super'],
      groups: ['Group 1', 'Group 2']
    }
  ];
  
  groups = [
    {
      name: 'Group 1',
      channels: ['Channel A', 'Channel B'],
      members: ['super'],
      groupAdmin: 'super'
    },
    {
      name: 'Group 2',
      channels: ['Channel C', 'Channel D'],
      members: ['super'],
      groupAdmin: 'super'
    }
  ];

  bannedList = [];

  saveData({ users, groups, bannedList });
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

