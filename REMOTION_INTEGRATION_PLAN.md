# Remotion + Render.com Integration Plan

## 📋 Обзор

Добавить в проект **Remotion** для программного создания видео из React компонентов. Развертывание на **Render.com** (бесплатный tier). Полная локальная разработка перед production deploy.

---

## 🎯 Целевая архитектура

```
┌─────────────────────────┐
│   Vue 3 Frontend        │
│      (Vercel)           │  ← бесплатно
└────────────┬────────────┘
             │ POST /api/videos/generate
             ▼
┌──────────────────────────────────────┐
│   Express.js Backend                 │
│   (Render.com free tier)             │  ← бесплатно
│                                      │
│  ├─ API routes                       │
│  ├─ Remotion generator               │
│  │  ├─ compositions/ (React)         │
│  │  └─ render engine                 │
│  ├─ PostgreSQL Database              │
│  └─ Backblaze B2 client              │
└────────────┬─────────────────────────┘
             │ upload MP4
             ▼
    ┌────────────────────┐
    │  Backblaze B2      │  ← 10GB бесплатно
    │  (video storage)   │
    └────────────────────┘
```

---

## 📁 Структура файлов в apps/api

```
apps/api/
├── src/
│   ├── generator/
│   │   ├── compositions/
│   │   │   └── MelancholicVideo.tsx       ← React компонент видео
│   │   ├── render.ts                      ← renderVideo() функция
│   │   └── templates.ts                   ← параметры compositions
│   ├── routes/
│   │   └── videos.ts                      ← POST /api/videos/generate
│   ├── storage/
│   │   └── b2.ts                          ← Backblaze B2 client
│   ├── server.ts                          ← Express сервер
│   └── types.ts                           ← TypeScript типы
├── package.json
├── tsconfig.json
└── .env.local                             ← для локального тестирования
```

---

## 🔧 Что нужно установить в apps/api

### Основные зависимости

```bash
npm install \
  remotion \
  @remotion/renderer \
  react \
  react-dom \
  @aws-sdk/client-s3 \
  axios \
  dotenv
```

### Dev зависимости

```bash
npm install --save-dev \
  typescript \
  @types/node \
  @types/express \
  @types/react
```

### package.json скрипты

```json
{
  "scripts": {
    "dev": "node -r dotenv/config ./dist/server.js",
    "build": "tsc",
    "studio": "npx remotion studio",
    "render:local": "npx remotion render src/generator/compositions/MelancholicVideo.tsx output.mp4",
    "start": "node ./dist/server.js"
  }
}
```

---

## 🎬 Remotion Composition (MelancholicVideo.tsx)

### Входные параметры (Props)

```typescript
{
  imageUrl: string;      // URL фото (из Backblaze)
  audioUrl: string;      // URL аудио (из Backblaze)
  phrase: string;        // Текст фразы (4-7 слов)
  duration: number;      // Длительность в секундах (FPS: 30)
}
```

### Визуальные элементы

- **Фон**: черный (#000000)
- **Изображение**: центрированное, с легким зумом (scale: 1 + frame/1000)
- **Белая полоса**: в верхней части (top: 20%), высота 60px
- **Текст**: фраза белого цвета (40px), центр полосы
- **Эффекты**: 
  - grain/noise (opacity: 0.05)
  - fade in/out (первые и последние 30 фреймов)
- **Аудио**: подключено через Audio компонент

### Примерная структура

```typescript
import React from 'react';
import { AbsoluteFill, Img, Audio, useCurrentFrame, interpolate } from 'remotion';

export const MelancholicVideo: React.FC<MelancholicVideoProps> = ({
  imageUrl,
  audioUrl,
  phrase,
  duration,
}) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const totalFrames = duration * fps;
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Изображение с зумом */}
      <Img
        src={imageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${1 + frame / 1000})`,
        }}
      />
      
      {/* Белая полоса с текстом */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        fontWeight: 'bold',
        color: '#000',
      }}>
        {phrase}
      </div>
      
      {/* Аудио */}
      <Audio src={audioUrl} />
    </AbsoluteFill>
  );
};

// Metadata для Remotion
MelancholicVideo.defaultProps = {
  duration: 6, // 6 секунд по умолчанию
  width: 1080,
  height: 1920,
  fps: 30,
};
```

---

## 🖥️ API Endpoint: POST /api/videos/generate

### Request Body

```json
{
  "imageUrl": "https://b2-bucket.b2.com/uploads/photo1.jpg",
  "audioUrl": "https://b2-bucket.b2.com/audio/track1.mp3",
  "phrase": "nothing feels the same now",
  "userId": "user-uuid-123",
  "duration": 30
}
```

### Response (немедленно)

```json
{
  "jobId": "video-uuid-456",
  "status": "queued"
}
```

### Логика backend'а

1. Валидировать inputs
2. Создать запись в БД (videos table) со статусом `queued`
3. **Сразу вернуть jobId** (не ждать рендера)
4. **В фоне** (setImmediate или worker):
   - Вызвать `renderVideo()`
   - Получить MP4 файл из `/tmp`
   - Загрузить в Backblaze B2
   - Обновить БД: статус = `completed`, videoUrl = B2_URL
5. Если ошибка: статус = `failed`, error message в БД

### Примерный код

```typescript
import { Router } from 'express';
import { renderVideo } from '../generator/render';
import { uploadToB2 } from '../storage/b2';

const router = Router();

router.post('/videos/generate', async (req, res) => {
  const { imageUrl, audioUrl, phrase, userId, duration } = req.body;
  
  // Валидация
  if (!imageUrl || !audioUrl || !phrase) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  // Создать видео в БД
  const video = await prisma.videos.create({
    data: {
      userId,
      title: phrase,
      status: 'queued',
      imageUrl,
      audioUrl,
      phrase,
    },
  });
  
  // Вернуть сразу
  res.json({ jobId: video.id, status: 'queued' });
  
  // Рендерить в фоне
  setImmediate(async () => {
    try {
      const outputPath = `/tmp/video-${video.id}.mp4`;
      
      // Рендерить видео
      await renderVideo({
        imageUrl,
        audioUrl,
        phrase,
        duration,
        outputPath,
      });
      
      // Загрузить в B2
      const b2Url = await uploadToB2(outputPath, video.id);
      
      // Обновить БД
      await prisma.videos.update({
        where: { id: video.id },
        data: {
          status: 'completed',
          videoUrl: b2Url,
        },
      });
    } catch (error) {
      await prisma.videos.update({
        where: { id: video.id },
        data: {
          status: 'failed',
          error: error.message,
        },
      });
    }
  });
});

export default router;
```

---

## 🔄 Функция renderVideo()

### Входные параметры

```typescript
interface RenderVideoParams {
  imageUrl: string;
  audioUrl: string;
  phrase: string;
  duration: number;
  outputPath: string;
}
```

### Логика

```typescript
import { renderMedia } from '@remotion/renderer';
import { MelancholicVideo } from './compositions/MelancholicVideo';

export async function renderVideo(params: RenderVideoParams) {
  const {
    imageUrl,
    audioUrl,
    phrase,
    duration,
    outputPath,
  } = params;
  
  await renderMedia({
    composition: MelancholicVideo,
    inputProps: {
      imageUrl,
      audioUrl,
      phrase,
      duration,
    },
    serveUrl: process.env.REMOTION_SERVE_URL || 'http://localhost:3000',
    codec: 'h264',
    crf: 23, // quality (0-51, lower = better)
    outputLocation: outputPath,
    concurrency: 1, // для экономии памяти на Render
  });
  
  return outputPath;
}
```

---

## 📦 Backblaze B2 Integration

### Переменные окружения

```env
B2_APPLICATION_ID=your-app-id
B2_APPLICATION_KEY=your-app-key
B2_BUCKET_NAME=ambient-motion-videos
```

### Функция uploadToB2()

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';

const s3Client = new S3Client({
  region: 'us-west-001',
  endpoint: 'https://s3.us-west-001.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

export async function uploadToB2(
  filePath: string,
  videoId: string
): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const key = `videos/${videoId}/${Date.now()}.mp4`;
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: fileStream,
    })
  );
  
  const url = `https://${process.env.B2_BUCKET_NAME}.s3.us-west-001.backblazeb2.com/${key}`;
  return url;
}
```

---

## 🧪 Локальное тестирование

### Setup локальной разработки

```bash
# 1. Установить зависимости
cd apps/api
npm install

# 2. Создать .env.local файл
cat > .env.local << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/ambient_motion
B2_APPLICATION_ID=test-id
B2_APPLICATION_KEY=test-key
B2_BUCKET_NAME=test-bucket
REMOTION_SERVE_URL=http://localhost:3000
EOF

# 3. Запустить 3 терминала одновременно

# Terminal 1: Remotion Studio
npm run studio
# → http://localhost:3000
# Видеть preview composition, менять props в реальном времени

# Terminal 2: Express backend
npm run dev
# → http://localhost:3000

# Terminal 3: Vue frontend
cd ../web
npm run dev
# → http://localhost:5173
```

### Тестирование flow

```bash
# 1. Открыть Remotion Studio
# → Проверить что MelancholicVideo компонент отображается
# → Попробовать менять props (imageUrl, phrase, duration)

# 2. В браузере, на фронте (http://localhost:5173)
# → Заполнить форму для видео-генерации
# → Отправить POST /api/videos/generate

# 3. В Terminal 2 (backend)
# → Видеть логи рендеринга
# → Видеть что FFmpeg обрабатывает видео

# 4. После завершения
# → Видео должно быть в /tmp/video-<jobId>.mp4
# → БД должна обновиться со статусом completed
# → Frontend должен показать готовое видео
```

### Проверки перед production deploy

- ✅ Remotion Studio показывает видео корректно
- ✅ Express сервер запускается без ошибок
- ✅ API endpoint /api/videos/generate отвечает
- ✅ Видео рендерится в /tmp
- ✅ БД обновляется со статусом
- ✅ Frontend отправляет запрос и видит статус
- ✅ Файлы сохраняются на диск (или в B2, если настроена)

---

## 🚀 Deploy на Render.com

### 1. Подготовка репо

```bash
# Убедиться что package.json есть в apps/api
# Убедиться что есть npm run build скрипт
# Убедиться что есть npm run start скрипт
```

### 2. На Render.com

```
1. Sign up на render.com
2. New → Web Service
3. Connect GitHub репо
4. Выбрать branch: main
5. Build Command: npm install && npm run build
6. Start Command: npm run start
7. Environment Variables:
   - DATABASE_URL=postgresql://...
   - B2_APPLICATION_ID=...
   - B2_APPLICATION_KEY=...
   - B2_BUCKET_NAME=...
   - NODE_ENV=production
8. Deploy
```

### 3. После deploy

- Frontend будет на Vercel (https://ambient-motion.vercel.app)
- Backend будет на Render (https://ambient-motion-api.onrender.com)
- CORS в Express должна быть настроена для Vercel домена

---

## 📊 Стоимость (monthly)

| Сервис | Цена | Примечание |
|--------|------|-----------|
| Vercel (Vue фронт) | $0 | Бесплатный tier |
| Render.com (Node backend) | $0 | Free tier (750 часов в месяц) |
| PostgreSQL на Render | $0 | Бесплатный инстанс |
| Backblaze B2 (10GB) | $0 | Бесплатный tier |
| **ИТОГО** | **$0** | 🎉 |

---

## ⚠️ Лимиты Render.com Free Tier

| Лимит | Значение | Что значит |
|-------|----------|-----------|
| Compute hours | 750/месяц | На 1 сервер 24/7 хватит |
| Inactivity sleep | 15 минут | После 15 мин неактивности спит |
| Cold start | ~30 сек | Первый запрос медленнее |
| Bandwidth | Unlimited | ✅ |
| Storage | /tmp только | Временно, не персистентно |

---

## ⏱️ Примерное время разработки

| Фаза | Задача | Время |
|------|--------|-------|
| 1 | Remotion setup + первый composition | 1-2 дня |
| 2 | API endpoint + renderVideo() функция | 2-3 дня |
| 3 | Backblaze B2 интеграция | 1 день |
| 4 | Frontend интеграция | 1-2 дня |
| 5 | Локальное тестирование | 1 день |
| 6 | Deploy на Render.com | 1 день |
| **TOTAL** | | **~1-2 недели** |

---

## 🎯 Чек-лист реализации

### Phase 1: Setup
- [ ] Установить Remotion пакеты в apps/api
- [ ] Создать папку src/generator/compositions
- [ ] Создать MelancholicVideo.tsx composition
- [ ] Запустить `npm run studio`
- [ ] Видеть preview в browser

### Phase 2: Render Engine
- [ ] Написать render.ts с renderVideo() функцией
- [ ] Тестировать локальный рендер: `npm run render:local`
- [ ] Убедиться что видео генерируется в /tmp

### Phase 3: API Integration
- [ ] Создать routes/videos.ts с POST /api/videos/generate
- [ ] Интегрировать renderVideo() в endpoint
- [ ] Добавить асинхронный рендеринг (setImmediate)
- [ ] Добавить БД запросы (create video, update status)

### Phase 4: Storage
- [ ] Создать storage/b2.ts с uploadToB2() функцией
- [ ] Получить B2 credentials
- [ ] Интегрировать в API endpoint
- [ ] Тестировать upload

### Phase 5: Frontend
- [ ] Создать форму для отправки запроса
- [ ] Отправлять POST на /api/videos/generate
- [ ] Показывать статус (queued/generating/completed)
- [ ] Preview готового видео

### Phase 6: Deploy
- [ ] Создать account на render.com
- [ ] Подключить GitHub репо
- [ ] Настроить env переменные
- [ ] Первый deploy
- [ ] Тестировать на production

---

## 📚 Полезные ссылки

- [Remotion docs](https://www.remotion.dev/docs)
- [Remotion API reference](https://www.remotion.dev/docs/api)
- [@remotion/renderer](https://www.remotion.dev/docs/renderer)
- [Render.com docs](https://render.com/docs)
- [Backblaze B2 S3 API](https://www.backblaze.com/b2/docs/s3_compatible_api.html)

---

## 💡 Важные замечания

1. **Все тестируется локально первым** перед deploy на Render
2. **Remotion Studio** — основной инструмент для разработки compositions
3. **Асинхронный рендеринг** — backend не ждет видео, сразу возвращает jobId
4. **Cold starts на Render** — нормальны для free tier, можно добавить "keep-alive" endpoint позже
5. **FFmpeg** — загружается автоматически при первом рендере, не нужна ручная установка
6. **CRF parameter** — качество видео (23 = хороший баланс, 18-28 диапазон)

---

**Этот документ содержит всё необходимое для реализации. Можно начинать с Phase 1!**
