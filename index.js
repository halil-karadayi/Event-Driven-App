// index.js

const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

// Ortam değişkenlerinden okunan Kafka konfigürasyonu
const {
  KAFKA_BROKERS = 'localhost:9092',
  KAFKA_TOPIC = 'my-topic',
  KAFKA_CLIENT_ID = 'producer-app'
} = process.env;

// KafkaJS ile bir Kafka client ve producer oluşturuyoruz
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS.split(',')
});

const producer = kafka.producer();

(async () => {
  try {
    // Producer'ı başlatıyoruz
    await producer.connect();
    console.log(JSON.stringify({ message: 'Producer connected to Kafka...' }));

    // Her 3 saniyede bir event üreten döngü
    setInterval(async () => {
      try {
        // Rastgele event oluşturma
        const event = {
          eventId: uuidv4(),
          eventType: Math.random() > 0.5 ? 'user_signup' : 'order_created',
          timestamp: new Date().toISOString(),
          payload: {
            randomValue: Math.floor(Math.random() * 1000)  // rastgele bir değer
          }
        };

        // Kafka'ya mesaj gönderme
        await producer.send({
          topic: KAFKA_TOPIC,
          messages: [
            {
              value: JSON.stringify(event),
            },
          ],
        });

        // STDOUT'a JSON formatında log
        console.log(JSON.stringify({ message: 'Event published', event }));
      } catch (error) {
        console.error(JSON.stringify({
          message: 'Error while publishing event',
          error: error.message || error
        }));
      }
    }, 3000);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Error while connecting to Kafka',
      error: error.message || error
    }));
  }
})();
