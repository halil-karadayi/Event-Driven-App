
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

// Ortam değişkenlerinden Kafka bilgilerini al
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'producer-app';
const topicName = process.env.KAFKA_TOPIC || 'events'; // publish edilecek topic

// Kafka ve Producer nesnesini oluştur
const kafka = new Kafka({
  clientId: kafkaClientId,
  brokers: kafkaBrokers.split(','),
});

const producer = kafka.producer();

// Event publish fonksiyonu
async function publishEvent() {
  const event = {
    eventId: uuidv4(),
    eventType: 'user_signup', // örnek olarak sabit bir event tipi
    timestamp: new Date().toISOString(),
    payload: {
      randomValue: Math.floor(Math.random() * 1000), // rastgele bir değer
    },
  };

  try {
    await producer.send({
      topic: topicName,
      messages: [
        {
          value: JSON.stringify(event),
        },
      ],
    });

    // Yayınlanan event'i stdout'a JSON olarak yaz
    console.log(JSON.stringify({
      level: 'info',
      message: 'Event published',
      event,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to publish event',
      error: error.message,
    }));
  }
}

// Uygulama başlangıcı
(async () => {
  await producer.connect();
  console.log(JSON.stringify({ level: 'info', message: 'Producer connected to Kafka' }));

  // Her 3 saniyede bir event gönder
  setInterval(publishEvent, 3000);
})();
