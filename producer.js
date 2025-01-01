
const { Kafka } = require('kafkajs');
const uuid = require('uuid');

const kafka = new Kafka({
  clientId: 'producer',
  brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();

const produceMessages = async () => {
  await producer.connect();
  setInterval(async () => {
    const message = {
      eventId: uuid.v4(),
      eventType: "user_signup",
      timestamp: new Date().toISOString(),
      payload: { value: Math.random() }
    };

    await producer.send({
      topic: 'events',
      messages: [{ value: JSON.stringify(message) }],
    });

    console.log("Published", message);
  }, 3000);
};

produceMessages().catch(console.error);

