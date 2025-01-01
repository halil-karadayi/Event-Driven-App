
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

const client = new MongoClient(process.env.MONGO_URI);
client.connect();

app.get('/events', async (req, res) => {
  const { eventType, from, to } = req.query;
  const query = {
    eventType,
    timestamp: { $gte: from, $lte: to }
  };

  const events = await client.db("eventdb").collection("events").find(query).toArray();
  res.json(events);
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});

