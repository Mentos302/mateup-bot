const dayjs = require('dayjs');

import { Markup } from 'telegraf';
import { UseFilters } from '@nestjs/common';
import { Scene, SceneEnter, Action, On, Ctx, Message } from 'nestjs-telegraf';
import { Context, SceneState } from 'src/interfaces/context.interface';
import { SCENE_SETTINGS } from 'src/common/config/scene';
import { TelegrafExceptionFilter } from 'src/common/filters/telegraf-exception.filter';

@Scene('lesson_subject', SCENE_SETTINGS)
@UseFilters(TelegrafExceptionFilter)
export class LessonSubjectScene {
  @SceneEnter()
  onSceneEnter(ctx: Context) {
    const { user } = ctx.scene.state as SceneState;

    ctx.replyWithHTML(
      `🔭 Оберіть предмет, з якого відбулось заняття:`,

      Markup.inlineKeyboard([
        ...user.subjects.map((subject) => [
          {
            text: subject,
            callback_data: subject,
          },
        ]),
        [{ text: `↩️ Скасувати додавання `, callback_data: 'back' }],
      ]),
    );
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

  @On('callback_query')
  onSubjectChoosing(ctx: Context) {
    ctx.answerCbQuery();

    ctx.scene.enter('lesson_student', {
      ...ctx.scene.state,
      subject: (ctx.callbackQuery as any).data,
    });
  }

  @On('message')
  async onMessage(ctx: Context): Promise<void> {
    ctx.scene.reenter();
  }
}
