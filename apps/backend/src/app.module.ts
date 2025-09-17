import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UsersController } from './users/users.controller';
import { AssetsController } from './assets/assets.controller';
import { TenantsController } from './tenants/tenants.controller';
import { AssetsService } from './assets/assets.service';
import { QrcodeController } from './qrcode/qrcode.controller';
import { ReportsController } from './reports/reports.controller';
import { AuthModule } from './auth/auth.module';
import { TicketsController } from './tickets/tickets.controller';
import { ConfigController } from './config/config.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { ReportsModule } from './reports/reports.module';
import { SystemController } from './system/system.controller';

@Module({
  imports: [AuthModule, ReportsModule],
  controllers: [
    AppController, 
    UsersController, 
    AssetsController, 
    TenantsController, 
    QrcodeController, 
    ReportsController, 
    TicketsController, 
    ConfigController, DashboardController, SystemController
  ],
  providers: [
    AppService, 
    PrismaService, 
    AssetsService
  ],
  exports: [PrismaService], // Exporta para outros módulos usarem
})
export class AppModule {}