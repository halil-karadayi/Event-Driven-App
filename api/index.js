const express = require('express');
const { MongoClient } = require('mongodb');
const client = require('prom-client');

const app = express();

// Ortam değişkenleri
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGO_DB_NAME || 'eventsdb';
const mongoCollection = process.env.MONGO_COLLECTION || 'events';
const port = process.env.PORT || 3000;
const metricsPort = process.env.METRICS_PORT || 3001; // Prometheus için port

let dbClient;

// Prometheus metrikleri
const register = client.register;
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Varsayılan metrikleri topla

const eventsQueryCounter = new client.Counter({
  name: 'events_query_total',
  help: 'Total number of events queried',
});
const queryFailuresCounter = new client.Counter({
  name: 'query_failures_total',
  help: 'Total number of query failures',
});

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

    // Prometheus metriği artır
    eventsQueryCounter.inc();

    res.json(events);
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to list events',
      error: error.message,
    }));

    // Hatalı sorgulama için Prometheus metriği artır
    queryFailuresCounter.inc();

    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Prometheus /metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// REST API başlat
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

// Prometheus metrik server'ı başlat
const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
metricsApp.listen(metricsPort, () => {
  console.log(JSON.stringify({
    level: 'info',
    message: `Metrics server listening on port ${metricsPort}`,
  }));
});
