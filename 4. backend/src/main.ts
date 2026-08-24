import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // I configured CORS to allow requests specifically
  // from the frontend's origin rather than
  // allowing every origin.
  app.enableCors({
    origin: "http://localhost:5173",
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
