import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const normalizeOrigin = (value: string) => value.replace(/\/$/, '');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://worthiq.io',
    'https://www.worthiq.io',
    frontendUrl,
  ]
    .filter(Boolean)
    .map(normalizeOrigin);

  // CORS must run before body parsing so OPTIONS preflight is answered correctly.
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      if (normalized === 'https://worthiq.io' || normalized.endsWith('.worthiq.io'))
        return callback(null, true);

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type'],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  });

  app.use(require('express').json({ limit: '10mb' }));

  // Health check for Railway
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Backend running on port ${port}`);
}
bootstrap();
