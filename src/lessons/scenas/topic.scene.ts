const dayjs = require('dayjs');

import { Markup } from 'telegraf';
import { UseFilters } from '@nestjs/common';
import { Scene, SceneEnter, Action, On, Ctx, Message } from 'nestjs-telegraf';
import { Context, SceneState } from 'src/interfaces/context.interface';
import { SCENE_SETTINGS } from 'src/common/config/scene';
import { TelegrafExceptionFilter } from 'src/common/filters/telegraf-exception.filter';
import { GoogleSheetsService } from 'src/services/google-sheets/google-sheets.service';

const toNextScene = (ctx: Context, date: string) => {
  const { user } = ctx.scene.state as SceneState;

  if (!user.subjects) {
    ctx.reply(
      '🇪🇷 Вам ще не додали жодних предметів для додавання, зверніться до адміністратора.',
    );

    return ctx.scene.leave();
  }

  if (user.subjects.length === 1) {
    return ctx.scene.enter('lesson_student', {
      ...ctx.scene.state,
      date,
      subject: user.subjects[0],
    });
  }

  return ctx.scene.enter('lesson_subject', {
    ...ctx.scene.state,
    date,
  });
};

@Scene('lesson_topic', SCENE_SETTINGS)
@UseFilters(TelegrafExceptionFilter)
export class LessonTopicScene {
  constructor(private readonly sheetsService: GoogleSheetsService) {}
  @SceneEnter()
  onSceneEnter(ctx: Context) {
    ctx.replyWithHTML(
      `📗 Напишіть тему проведеного заняття:`,
      Markup.inlineKeyboard([
        [{ text: `↩️ Скасувати додавання `, callback_data: 'back' }],
      ]),
    );
  }

  @On('text')
  async onText(@Ctx() ctx: Context, @Message('text') topic: string) {
    (ctx.scene.state as SceneState).topic = topic;

    await this.sheetsService.addToSheet(ctx.scene.state as SceneState);

    ctx.replyWithHTML(
      `✅ Дякуємо, заняття успішно внесено.`,
      Markup.inlineKeyboard([
        {
          text: 'Додати наступне заняття',
          callback_data: 'rndmsht',
        },
      ]),
    );

    ctx.scene.leave();
  }

  @Action('back')
  async onBack(ctx: Context): Promise<void> {
    ctx.answerCbQuery();

    ctx.replyWithHTML(
      `🚫 Додавання заняття скасовано.`,
      Markup.inlineKeyboard([
        {
          text: 'Додати нове заняття',
          callback_data: 'rndmsht',
        },
      ]),
    );

    ctx.scene.leave();
  }

  @On('message')
  async onMessage(ctx: Context): Promise<void> {
    ctx.scene.reenter();
  }
}
