// api/index.js
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGO_DB_NAME || 'eventsdb';
const mongoCollection = process.env.MONGO_COLLECTION || 'events';

let dbClient;

// MongoDB bağlantısını başlat
async function initMongo() {
  dbClient = new MongoClient(mongoUri);
  await dbClient.connect();
  console.log(JSON.stringify({
    level: 'info',
    message: 'REST API connected to MongoDB',
    mongoUri,
  }));
}

app.get('/events', async (req, res) => {
  try {
    const { eventType } = req.query;

    const collection = dbClient.db(mongoDbName).collection(mongoCollection);
    
    // Filtre parametresi varsa buna göre sorgula
    let query = {};
    if (eventType) {
      query.eventType = eventType;
    }

    const events = await collection.find(query).toArray();
    res.json(events);
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to list events',
      error: error.message,
    }));
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = process.env.PORT || 3000;

initMongo().then(() => {
  app.listen(port, () => {
    console.log(JSON.stringify({
      level: 'info',
      message: `REST API listening on port ${port}`,
    }));
  });
}).catch((err) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Failed to initialize REST API',
    error: err.message,
  }));
  process.exit(1);
});
