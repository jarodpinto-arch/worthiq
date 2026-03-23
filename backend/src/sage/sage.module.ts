import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SageService } from './sage.service';
import { SageController } from './sage.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [SageService],
  controllers: [SageController],
})
export class SageModule {}
