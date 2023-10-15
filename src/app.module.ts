import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { LessonsModule } from './lessons/lessons.module';
import { session } from 'telegraf';
import { SanityService } from './sanity/sanity.service';
import { UserUpdate } from './user/user.update';
import { UsersModule } from './user/user.module';
import { GoogleSheetsService } from './services/google-sheets/google-sheets.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
      middlewares: [session()],
    }),
    LessonsModule,
  ],
  providers: [SanityService, UserUpdate, GoogleSheetsService],
})
export class AppModule {}
