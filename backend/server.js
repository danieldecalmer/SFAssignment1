const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs'); // For reading and writing to JSON file
const path = require('path');
const app = express();
const PORT = 3000;
const { connectToDatabase } = require('./db');
const { Server } = require("socket.io");
const http = require('http');
const server = http.createServer(app);
const multer = require('multer');

// Define the directory for profile pictures
const uploadDir = path.join(__dirname, 'uploads/profile-pictures');

// Check if the directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });  // Create directory recursively
}


// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // Allow requests from this origin
    methods: ['GET', 'POST'],        // Allow these methods
    credentials: true                // Allow credentials
  }
});

let db, usersCollection, groupsCollection, messagesCollection;
// Map to store chat history
let chatHistory = {};

// Connect to MongoDB once when the server starts
(async () => {
  try {
    db = await connectToDatabase(); // Assuming this is a function that connects to MongoDB
    usersCollection = db.collection('users'); // Initialize usersCollection
    groupsCollection = db.collection('groups'); // Initialize groupsCollection
    messagesCollection = db.collection('messages'); // Initialize messagesCollection

    if (db) {
      console.log('Database connected and server starting...');
    } else {
      console.error('Database connection failed. Server not started.');
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
})();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for 'message' event
  socket.on('message', async (data) => {
    const { group, channel, sender, message } = data;

    try {
      // Fetch sender's profile picture from the users collection
      const user = await usersCollection.findOne({ username: sender });
      const profilePicture = user?.profilePicture || 'uploads/profile-pictures/default-profile.png'; // Use default if none

      // Store the message in MongoDB
      await messagesCollection.insertOne({
        group,
        channel,
        sender,
        message,
        profilePicture, // Include the profile picture in the message document
        timestamp: new Date()
      });

      console.log('Message stored in MongoDB:', data);

      // Emit the message to all clients in the same channel, including the profile picture
      io.to(channel).emit('new-message', { ...data, profilePicture });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Join a specific channel
  socket.on('joinChannel', async ({ group, channel }) => {
    try {
      socket.join(channel);
      console.log(`${socket.id} joined channel: ${group}-${channel}`);

      // Fetch the chat history from MongoDB
      const cursor = db.collection('messages').find({ group: group, channel: channel });

      // Convert the cursor to an array using async/await
      const messages = await cursor.toArray();

      // Send chat history to the client, messages will include profile pictures
      socket.emit('chat-history', messages);
      console.log('Chat history sent to client:', messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Start the server to use the http server with Socket.io
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

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
let { users, groups, bannedList } = loadData();

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
    // Ensure we are accessing the correct MongoDB collection
    const groupsCollection = db.collection('groups');
    const groups = await groupsCollection.find({}).toArray();
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// Route to get all users (for listing all users)
app.get('/users', async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray(); // Fetch all users from MongoDB
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Route to add a new channel to a group
app.post('/groups/:groupName/channels', async (req, res) => {
  const { groupName } = req.params;
  const { channel } = req.body;

  try {
    // Find the group by its name in MongoDB
    const group = await db.collection('groups').findOne({ name: groupName });

    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Check if the channel already exists in the group's channels array
    if (group.channels.includes(channel)) {
      return res.status(400).json({ message: `Channel ${channel} already exists in group ${groupName}.` });
    }

    // Add the new channel to the group's channels array
    await db.collection('groups').updateOne(
      { name: groupName }, // Find the group by its name
      { $push: { channels: channel } } // Add the new channel to the channels array
    );

    // Fetch the updated group from the database to return in response
    const updatedGroup = await db.collection('groups').findOne({ name: groupName });

    // Respond with success message and updated group data
    res.status(201).json({ message: `Channel ${channel} added to group ${groupName} successfully!`, group: updatedGroup });
    
  } catch (error) {
    console.error('Error adding channel:', error);
    res.status(500).json({ message: 'An error occurred while adding the channel.', error });
  }
});

// Route to delete a channel from a group
app.delete('/groups/:groupName/channels/:channel', async (req, res) => {
  const { groupName, channel } = req.params;
  const { username } = req.body;

  try {
    // Find the group by its name in MongoDB
    const group = await db.collection('groups').findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Find the user by username in MongoDB
    const user = await db.collection('users').findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: `User ${username} not found.` });
    }

    // Check if the user is a group admin or super admin
    if (!user.roles.includes('super') && !group.groupAdmins.includes(username)) {
      return res.status(403).json({ message: `You are not authorized to delete channels in this group.` });
    }

    // Check if the channel exists in the group's channels array
    if (!group.channels.includes(channel)) {
      return res.status(404).json({ message: `Channel ${channel} not found in group ${groupName}.` });
    }

    // Remove the channel from the group's channels array
    await db.collection('groups').updateOne(
      { name: groupName },
      { $pull: { channels: channel } } // Use $pull to remove the channel from the channels array
    );

    // Fetch the updated group to return in response
    const updatedGroup = await db.collection('groups').findOne({ name: groupName });

    res.status(200).json({ message: `Channel ${channel} deleted from group ${groupName} successfully.`, group: updatedGroup });

  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ message: 'An error occurred while deleting the channel.', error });
  }
});

// Route to ban a user and submit the report
app.post('/ban-user', async (req, res) => {
  const { username, report } = req.body;

  try {
    // Find the user in MongoDB
    const user = await db.collection('users').findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: `User ${username} not found.` });
    }

    // Remove the user from all groups' members list and handle group admin reassignment
    const updateGroups = await db.collection('groups').updateMany(
      { members: username }, // Find all groups where the user is a member
      {
        $pull: { members: username }, // Remove the user from the members array
        $set: { groupAdmin: { $cond: [{ $eq: ["$groupAdmin", username] }, { $arrayElemAt: ["$members", 0] }, "$groupAdmin"] } } // Reassign group admin if they were the admin
      }
    );

    // Clear the user's groups array
    await db.collection('users').updateOne(
      { username: username },
      { $set: { groups: [] } }
    );

    // Add the user to the banned list with the report
    await db.collection('bannedList').insertOne({
      username: username,
      report: report || 'No report provided',
      bannedAt: new Date()
    });

    res.status(200).json({ message: `${username} has been banned successfully.` });
    
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'An error occurred while banning the user.', error });
  }
});

// Route to unban a user
app.post('/unban-user', async (req, res) => {
  const { username } = req.body;

  try {
    // Find the user in the banned list
    const bannedUser = await db.collection('bannedList').findOne({ username: username });
    
    if (!bannedUser) {
      return res.status(404).json({ message: `User ${username} not found in banned list.` });
    }

    // Remove the user from the banned list
    await db.collection('bannedList').deleteOne({ username: username });

    res.status(200).json({ message: `${username} has been unbanned successfully.` });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'An error occurred while unbanning the user.', error });
  }
});

// Route to get all banned users
app.get('/banned-users', async (req, res) => {
  try {
    // Fetch all banned users from the bannedList collection
    const bannedUsers = await db.collection('bannedList').find().toArray();

    res.status(200).json(bannedUsers);
  } catch (error) {
    console.error('Error fetching banned users:', error);
    res.status(500).json({ message: 'An error occurred while fetching banned users.', error });
  }
});

// Route to kick a member from a group
app.post('/groups/:groupName/kick', async (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  try {
    // Find the group by its name
    const group = await db.collection('groups').findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Check if the member exists in the group
    if (!group.members.includes(member)) {
      return res.status(400).json({ message: `${member} is not a member of ${groupName}.` });
    }

    // Remove the member from the group's member list
    const updatedMembers = group.members.filter(m => m !== member);

    // If the member was the group admin, clear or reassign the group admin role
    let updatedGroupAdmin = group.groupAdmin;
    if (group.groupAdmin === member) {
      updatedGroupAdmin = updatedMembers.length > 0 ? updatedMembers[0] : null; // Promote another member or set to null
    }

    // Update the group in the database
    await db.collection('groups').updateOne(
      { name: groupName },
      { $set: { members: updatedMembers, groupAdmin: updatedGroupAdmin } }
    );

    // Optionally, update the user's group list (if you store this on the user object)
    await db.collection('users').updateOne(
      { username: member },
      { $pull: { groups: groupName } }
    );

    // Respond with success
    res.status(200).json({ message: `${member} has been removed from ${groupName}.` });

  } catch (error) {
    console.error('Error kicking member:', error);
    res.status(500).json({ message: 'An error occurred while kicking the member.', error });
  }
});

// Route to add user to a group's waiting list
app.post('/groups/:groupName/register-interest', async (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  try {
    // Find the group by its name
    const group = await db.collection('groups').findOne({ name: groupName });
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
    await db.collection('groups').updateOne(
      { name: groupName },
      { $push: { waitingList: username } }
    );

    res.status(200).json({ message: `${username} has been added to the waiting list for ${groupName}.` });
  } catch (error) {
    console.error('Error adding user to waiting list:', error);
    res.status(500).json({ message: 'An error occurred while adding the user to the waiting list.', error });
  }
});

// Route to get the waiting list for a specific group
app.get('/groups/:groupName/waiting-list', async (req, res) => {
  const { groupName } = req.params;

  try {
    // Find the group by its name in the MongoDB collection
    const group = await db.collection('groups').findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Return the waiting list or an empty array if it's undefined
    res.status(200).json(group.waitingList || []);
  } catch (error) {
    console.error('Error retrieving waiting list:', error);
    res.status(500).json({ message: 'An error occurred while retrieving the waiting list.', error });
  }
});

// Add a member from the waiting list to the group
app.post('/groups/:groupName/add-member', async (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  try {
    // Find the group by its name in MongoDB
    const group = await db.collection('groups').findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Check if the member is already part of the group
    if (group.members.includes(member)) {
      return res.status(400).json({ message: `${member} is already a member of ${groupName}.` });
    }

    // Remove the member from the waiting list and add them to the group's members
    await db.collection('groups').updateOne(
      { name: groupName },
      {
        $push: { members: member },
        $pull: { waitingList: member }
      }
    );

    // Update the user's groups in the users collection
    const user = await db.collection('users').findOne({ username: member });
    if (!user) {
      return res.status(404).json({ message: `User ${member} not found.` });
    }

    await db.collection('users').updateOne(
      { username: member },
      { $push: { groups: groupName } }
    );

    // Send success response
    return res.status(200).json({ message: `${member} added to ${groupName} successfully!` });

  } catch (error) {
    console.error('Error adding member to group:', error);
    return res.status(500).json({ message: 'An error occurred while adding the member.', error });
  }
});

// Leave a group
app.post('/groups/:groupName/leave', async (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  try {
    // Find the group by its name
    const group = await db.collection('groups').findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Remove the user from the group's members
    const updatedGroup = await db.collection('groups').findOneAndUpdate(
      { name: groupName },
      { $pull: { members: username } }, // Remove the user from members
      { returnDocument: 'after' } // Return the updated document
    );

    // Check if the updated group document exists
    if (!updatedGroup.value) {
      return res.status(404).json({ message: `Group ${groupName} not found or user could not be removed.` });
    }

    // Check if the user was the group admin
    if (updatedGroup.value.groupAdmin === username) {
      const newAdmin = updatedGroup.value.members.length > 0 ? updatedGroup.value.members[0] : null;
      await db.collection('groups').updateOne(
        { name: groupName },
        { $set: { groupAdmin: newAdmin } }
      );
    }

    // Find the user in the users collection
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `User ${username} not found.` });
    }

    // Remove the group from the user's groups
    await db.collection('users').updateOne(
      { username },
      { $pull: { groups: groupName } }
    );

    // Return success message
    return res.status(200).json({ message: `${username} has left ${groupName} successfully.` });

  } catch (error) {
    console.error('Error removing user from group:', error);
    return res.status(500).json({ message: 'An error occurred while leaving the group.', error });
  }
});

// Route to promote a member to group admin
app.post('/groups/:groupName/promote', async (req, res) => {
  const { groupName } = req.params;
  const { member } = req.body;

  try {
    // Find the user in the database
    const user = await db.collection('users').findOne({ username: member });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user already has the 'group' role
    if (!user.roles.includes('group')) {
      // Add 'group' role to the user's roles
      await db.collection('users').updateOne(
        { username: member },
        { $addToSet: { roles: 'group' } } // Use $addToSet to ensure no duplicate role entries
      );
    }

    // Promote the user to group admin in the specified group
    await db.collection('groups').updateOne(
      { name: groupName },
      { $addToSet: { groupAdmins: member } } // Ensure member is added to the groupAdmins
    );

    // Respond with success message
    res.status(200).json({ message: `${member} promoted to group admin in ${groupName}` });
  } catch (error) {
    console.error('Error promoting user to group admin:', error);
    return res.status(500).json({ message: 'An error occurred while promoting the member to group admin.', error });
  }
});

// POST route to create a new group
app.post('/groups', async (req, res) => {
  const { name, groupAdmin } = req.body;

  try {
    // Check if a group with the same name already exists
    const groupExists = await db.collection('groups').findOne({ name: name });
    if (groupExists) {
      return res.status(400).json({ message: `Group with name ${name} already exists.` });
    }

    // Find the groupAdmin in the users collection
    const creator = await db.collection('users').findOne({ username: groupAdmin });
    if (!creator) {
      return res.status(400).json({ message: `User ${groupAdmin} not found.` });
    }

    // Determine if the creator is a super admin
    const isSuperAdmin = creator.roles.includes('super');
    const groupAdmins = isSuperAdmin ? [groupAdmin] : [groupAdmin, 'super'];

    // Create the new group object
    const newGroup = {
      id: uuidv4(),
      name: name,
      channels: [],
      members: [...groupAdmins],
      groupAdmin: groupAdmin,
      groupAdmins: groupAdmins,
      waitingList: []
    };

    // Insert the new group into the MongoDB database
    await db.collection('groups').insertOne(newGroup);

    // Update the groupAdmin's group list in the users collection
    await db.collection('users').updateMany(
      { username: { $in: groupAdmins } },
      { $addToSet: { groups: name } } // Add the group to the user's group array, ensuring no duplicates
    );

    // Respond with success
    res.status(201).json({ message: `Group ${name} created successfully!`, group: newGroup });

  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'An error occurred while creating the group.', error });
  }
});

// Route to delete a group
app.delete('/groups/:groupName', async (req, res) => {
  const { groupName } = req.params;
  const { username } = req.body;

  try {
    // Find the group by name in the database
    const group = await db.collection('groups').findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ message: `Group ${groupName} not found.` });
    }

    // Find the user by username
    const user = await db.collection('users').findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: `User ${username} not found.` });
    }

    // Check if the user is authorized to delete the group
    if (user.roles.includes('super') || group.groupAdmins.includes(username)) {
      // Delete the group from the 'groups' collection
      await db.collection('groups').deleteOne({ name: groupName });

      // Remove the group from all users' group arrays
      await db.collection('users').updateMany(
        { groups: groupName },
        { $pull: { groups: groupName } }
      );

      // Respond with success
      res.status(200).json({ message: `Group ${groupName} deleted successfully.` });
    } else {
      res.status(403).json({ message: `You are not authorized to delete this group.` });
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'An error occurred while deleting the group.', error });
  }
});

// Route to register a user
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Check if a user with the same username or email already exists in the database
    const userExists = await db.collection('users').findOne({
      $or: [{ username: username }, { email: email }]
    });

    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create a new user object
    const newUser = {
      id: uuidv4(),
      username: username,
      password: password,
      email: email,
      roles: [],
      groups: [],
      profilePicture: '',
    };

    // Insert the new user into the 'users' collection
    await db.collection('users').insertOne(newUser);

    // Respond with success
    res.status(201).json({ message: `User ${username} registered successfully!`, user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'An error occurred while registering the user.' });
  }
});

// Route to log in the user and create a session
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the database by username and password
    const user = await db.collection('users').findOne({ username: username, password: password });

    if (user) {
      // Create session for the logged-in user
      req.session.user = {
        id: user.id,
        username: user.username,
        roles: user.roles,
        groups: user.groups,
        profilePicture: user.profilePicture
      };

      // Respond with success
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
      // Invalid credentials
      res.status(401).json({ message: 'Invalid username or password!' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'An error occurred while logging in.' });
  }
});

// Route to reset data (for testing)
app.post('/reset', async (req, res) => {
  const defaultUsers = [
    {
      id: uuidv4(),
      username: 'super',
      password: '123',
      email: 'super@example.com',
      roles: ['group', 'super'],
      groups: ['Group 1', 'Group 2']
    }
  ];
  
  const defaultGroups = [
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

  const defaultBannedList = [];

  try {
    // Clear existing collections
    await db.collection('users').deleteMany({});
    await db.collection('groups').deleteMany({});
    await db.collection('bannedList').deleteMany({});

    // Insert default data
    await db.collection('users').insertMany(defaultUsers);
    await db.collection('groups').insertMany(defaultGroups);
    await db.collection('bannedList').insertMany(defaultBannedList);

    res.status(200).json({ message: 'Database has been reset to default values.' });
  } catch (error) {
    console.error('Error resetting the database:', error);
    res.status(500).json({ message: 'An error occurred while resetting the database.' });
  }
});

// Route to log out the user and destroy the session
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed!' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie after destroying the session
    res.json({ message: 'Logged out successfully!' });
  });
});

// Route to upload files
app.use('/uploads', express.static('uploads'));

// Route to upload profile picture
app.post('/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const relativePath = `uploads/profile-pictures/${req.file.filename}`;

  // Update user's profile picture in the database
  usersCollection.updateOne(
    { username: req.session.user.username },
    { $set: { profilePicture: relativePath } }
  )
  .then(() => {
    res.json({ message: 'Profile picture uploaded successfully', profilePicture: relativePath });
  })
  .catch(err => {
    res.status(500).json({ message: 'Error updating profile picture', error: err });
  });
});

