import { Module } from '@nestjs/common';
import { LessonScenes } from './scenas';
import { SanityService } from 'src/sanity/sanity.service';
import { GoogleSheetsService } from 'src/services/google-sheets/google-sheets.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
  controllers: [],
  providers: [
    ConfigService,
    SanityService,
    GoogleSheetsService,
    ...LessonScenes,
  ],
})
export class LessonsModule {}
