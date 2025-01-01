// consumer/index.js
const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'consumer-app';
const kafkaGroupId = process.env.KAFKA_GROUP_ID || 'consumer-group';
const topicName = process.env.KAFKA_TOPIC || 'events';

// Mongo bilgileri
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGO_DB_NAME || 'eventsdb';
const mongoCollection = process.env.MONGO_COLLECTION || 'events';

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
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to consume/store event',
          error: error.message,
        }));
      }
    },
  });
}

// Uygulama başlangıcı
runConsumer().catch((err) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Consumer initialization error',
    error: err.message,
  }));
  process.exit(1);
});
