import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Aumenta o limite para uploads de imagens (10MB) - DEVE VIR ANTES DO CORS
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  
  // Configuração CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',    // Frontend local
      'http://127.0.0.1:3000',   // Alternativa localhost
      'http://172.16.10.2:3000', // Seu IP local atual
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Servir arquivos estáticos (uploads de logos, favicons, etc.)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Prefixo global para API
  app.setGlobalPrefix('api');

  await app.listen(3001);
  console.log('🚀 Backend rodando em http://localhost:3001');
  console.log('📡 API disponível em http://localhost:3001/api');
  console.log('🔧 Config endpoint: http://localhost:3001/api/config');
  console.log('📁 Arquivos estáticos em: http://localhost:3001/uploads');
}
bootstrap();