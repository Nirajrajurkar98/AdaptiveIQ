import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AdminController } from './admin/admin.controller';

@Module({ imports: [DatabaseModule, HealthModule, AuthModule], controllers: [AdminController] })
export class AppModule {}
