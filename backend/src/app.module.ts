import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlaidModule } from './plaid/plaid.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SageModule } from './sage/sage.module';
import { WidgetsModule } from './widgets/widgets.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PlaidModule,
    SageModule,
    WidgetsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
