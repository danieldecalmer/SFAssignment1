const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/DanielChatDatabase'; // Use your MongoDB URI
const client = new MongoClient(uri);
let db; // Global variable to store the database connection

async function connectToDatabase() {
  if (!db) { // Only connect once
    try {
      await client.connect(); // Connect to MongoDB server
      db = client.db('DanielChatDatabase'); // Set database
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
    }
  }
  return db;
}

module.exports = { connectToDatabase };
