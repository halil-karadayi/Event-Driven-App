const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');
const express = require('express');
const client = require('prom-client');

// Ortam değişkenlerinden Kafka ve Mongo bilgilerini al
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'consumer-app';
const kafkaGroupId = process.env.KAFKA_GROUP_ID || 'consumer-group';
const topicName = process.env.KAFKA_TOPIC || 'events';
const metricsPort = process.env.METRICS_PORT || 4001; // Prometheus için port

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGO_DB_NAME || 'eventsdb';
const mongoCollection = process.env.MONGO_COLLECTION || 'events';

// Prometheus metrikleri
const register = client.register;
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Varsayılan metrikleri topla
const eventsConsumedCounter = new client.Counter({
  name: 'events_consumed_total',
  help: 'Total number of events consumed from Kafka',
});
const dbInsertionFailuresCounter = new client.Counter({
  name: 'db_insertion_failures_total',
  help: 'Total number of database insertion failures',
});

// Kafka consumer ve MongoDB client
const kafka = new Kafka({
  clientId: kafkaClientId,
  brokers: kafkaBrokers.split(','),
});
const consumer = kafka.consumer({ groupId: kafkaGroupId });
let dbClient;

async function runConsumer() {
  // MongoDB bağlan
  dbClient = new MongoClient(mongoUri);
  await dbClient.connect();
  console.log(JSON.stringify({
    level: 'info',
    message: 'Connected to MongoDB',
    mongoUri,
  }));

  // Kafka consumer başlat
  await consumer.connect();
  console.log(JSON.stringify({
    level: 'info',
    message: 'Consumer connected to Kafka',
  }));

  await consumer.subscribe({ topic: topicName, fromBeginning: true });
  console.log(JSON.stringify({
    level: 'info',
    message: `Subscribed to topic ${topicName}`,
  }));

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const eventString = message.value.toString();
        const event = JSON.parse(eventString);

        // Event'i MongoDB'ye kaydet
        const collection = dbClient.db(mongoDbName).collection(mongoCollection);
        await collection.insertOne(event);

        console.log(JSON.stringify({
          level: 'info',
          message: 'Event consumed and stored',
          event,
        }));

        // Prometheus metriği artır
        eventsConsumedCounter.inc();
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to consume/store event',
          error: error.message,
        }));

        // Hatalı kaydetme için Prometheus metriği artır
        dbInsertionFailuresCounter.inc();
      }
    },
  });
}

// Express uygulaması (Prometheus için)
const app = express();
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Express sunucusunu başlat
app.listen(metricsPort, () => {
  console.log(JSON.stringify({
    level: 'info',
    message: `Metrics server listening on port ${metricsPort}`,
  }));
});

// Uygulama başlangıcı
runConsumer().catch((err) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Consumer initialization error',
    error: err.message,
  }));
  process.exit(1);
});
