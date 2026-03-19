# AI Study Planner

AI Study Planner, öğrencilerin hedeflerine, son tarihlerine, günlük çalışma sürelerine, mevcut seviyelerine ve konu listelerine göre kişiselleştirilmiş çalışma planı oluşturmalarına yardımcı olan yapay zeka destekli bir web uygulamasıdır.

Bu proje iki ana yapıyı birleştirir:

- kural tabanlı planlama motoru ile yapılandırılmış çalışma planı üretimi
- Gemini API destekli yapay zeka içgörüleri ile kişiselleştirilmiş öneriler

## Proje Özeti

Kullanıcı uygulamaya:
- çalışma hedefini
- son tarihini
- günlük ayırabileceği çalışma süresini
- mevcut seviyesini
- çalışacağı konu listesini

girer.

Uygulama ise buna göre:
- önceliklendirilmiş görev listesi
- günlük çalışma planı
- risk skoru
- temel öneriler
- yapay zeka destekli kişisel içgörüler

oluşturur.

## Özellikler

- Kişiselleştirilmiş çalışma planı oluşturma
- Önceliklendirilmiş görev listesi
- Günlük çalışma akışı
- Risk skoru hesaplama
- Canlı kullanıcı girişi önizlemesi
- Yapay zeka içgörüleri bölümü
- localStorage ile veri saklama
- modern ve duyarlı arayüz

## Nasıl Çalışır?

Uygulama iki katmanlı bir yapı kullanır.

### 1. Kural Tabanlı Planlama

Frontend tarafında kullanıcı bilgileri analiz edilerek şu bölümler oluşturulur:

- öncelikli görevler
- günlük plan
- risk skoru
- temel çalışma önerileri

Bu katman hızlı ve kararlı şekilde çalışır.

### 2. Yapay Zeka İçgörüleri

Backend tarafında kullanıcıdan alınan bilgiler Gemini API’ye gönderilir.  
Yapay zeka aşağıdaki alanlarda kişisel içerik üretir:

- özet
- planın neden uygun olduğu
- odak alanları
- çalışma tavsiyeleri
- motivasyon mesajı

Eğer yapay zeka servisi geçici olarak yoğunluk nedeniyle cevap veremezse, uygulama kullanıcı deneyiminin bozulmaması için yedek içgörü içeriği sunar.

## Kullanılan Teknolojiler

### Frontend
- React
- Vite
- CSS
- Lucide React

### Backend
- Node.js
- Express
- Gemini API
- dotenv
- cors

## Kurulum

Projeyi klonla:

```bash
git clone REPOSITORY_LINKIN
cd future-talent-ai-study-planner

Bağımlılıkları kur:

npm install
npm install express cors dotenv @google/genai concurrently
Ortam Değişkenleri

Proje ana klasöründe .env dosyası oluştur:

GEMINI_API_KEY=YOUR_API_KEY
Projeyi Çalıştırma

Frontend ve backend’i birlikte başlat:

npm run dev:all

Frontend, Vite tarafından verilen local portta çalışır.
Backend ise şu adreste çalışır:

http://localhost:3001
Proje Yapısı
future-talent-ai-study-planner/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
│
├── server.js
├── package.json
├── .env
├── .gitignore
└── README.md
