import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { StructuredLogger } from './observability/structured-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(StructuredLogger));
  app.enableShutdownHooks();

  const frontendOrigin =
    process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173';

  if (frontendOrigin === '*') {
    throw new Error(
      'FRONTEND_ORIGIN must specify an explicit origin. Wildcard CORS is not permitted.',
    );
  }

  app.enableCors({
    origin: frontendOrigin,
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
