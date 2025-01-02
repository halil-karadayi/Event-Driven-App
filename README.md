# Event-Driven-App


# Event-Driven Application

Bu proje, Kafka, MongoDB ve Node.js kullanılarak oluşturulmuş bir Event-Driven uygulamadır. Uygulama aşağıdaki bileşenlerden oluşur:

1. **Producer**: Her 3 saniyede bir rastgele olaylar üretir ve Kafka'ya gönderir.
2. **Consumer**: Kafka'dan gelen mesajları alır ve MongoDB'ye kaydeder.
3. **API**: MongoDB'de saklanan olayları listeleyen bir RESTful API sağlar.
4. **Kafka ve Zookeeper**: Mesaj sıralama ve dağıtımı için.
5. **MongoDB**: Veritabanı.

## event-driven-app helm configleri ve servisler bulunmaktadır.
## github actions ci-cd dosyaları .github > workflows > nodejs-cicd.yaml dosyasında yer almaktadır.


## Gereksinimler

- Docker ve Docker Compose yüklü olmalıdır.

## Kurulum ve Çalıştırma

### 1. Docker Compose ile Tüm Servisleri Çalıştırma

Proje dizinine gidin ve aşağıdaki komutu çalıştırın:

```bash
docker-compose up --build

Kodda yapılan değişiklikleri lokal olarak test etmek için docker-compose.override.yml dosyasını çalıştırın.
