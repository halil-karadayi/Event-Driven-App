
const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

const kafka = new Kafka({
  clientId: 'consumer',
  brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: 'event-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'events', fromBeginning: true });

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const collection = client.db("eventdb").collection("events");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      await collection.insertOne(event);
      console.log("Saved", event);
    }
  });
};

run().catch(console.error);

