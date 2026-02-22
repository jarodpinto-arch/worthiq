import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Get port from environment (Railway sets this)
  const port = process.env.PORT || 3001;

  await app.listen(port);
  console.log(`🚀 WorthIQ API running on port ${port}`);
}
bootstrap();