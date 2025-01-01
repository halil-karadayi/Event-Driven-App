const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const client = require('prom-client');

// Ortam değişkenlerinden Kafka bilgilerini al
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'producer-app';
const topicName = process.env.KAFKA_TOPIC || 'events'; // publish edilecek topic
const metricsPort = process.env.METRICS_PORT || 4000; // Prometheus için port

// Prometheus metrikleri
const register = client.register;
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Varsayılan metrikleri topla
const eventsPublishedCounter = new client.Counter({
  name: 'events_published_total',
  help: 'Total number of events published to Kafka',
});

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

    // Prometheus metriği artır
    eventsPublishedCounter.inc();
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to publish event',
      error: error.message,
    }));
  }
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
(async () => {
  await producer.connect();
  console.log(JSON.stringify({ level: 'info', message: 'Producer connected to Kafka' }));

  // Her 3 saniyede bir event gönder
  setInterval(publishEvent, 3000);
})();
