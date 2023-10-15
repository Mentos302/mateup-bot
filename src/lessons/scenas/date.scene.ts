const dayjs = require('dayjs');

import { Markup } from 'telegraf';
import { UseFilters } from '@nestjs/common';
import { Scene, SceneEnter, Action, On, Ctx, Message } from 'nestjs-telegraf';
import { Context, SceneState } from 'src/interfaces/context.interface';
import { SCENE_SETTINGS } from 'src/common/config/scene';
import { TelegrafExceptionFilter } from 'src/common/filters/telegraf-exception.filter';

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

@Scene('lesson_date', SCENE_SETTINGS)
@UseFilters(TelegrafExceptionFilter)
export class LessonDateScene {
  @SceneEnter()
  onSceneEnter(ctx: Context) {
    const today = dayjs().format('DD.MM.YYYY');
    const yesterday = dayjs().subtract(1, 'day').format('DD.MM.YYYY');

    ctx.replyWithHTML(
      `📆 Напишіть дату заняття або оберіть з пропонованих:`,
      Markup.inlineKeyboard([
        [
          { text: `Вчора, ${yesterday}`, callback_data: 'yesterday' },
          { text: `Сьогодні, ${today}`, callback_data: 'today' },
        ],
        [{ text: `↩️ Скасувати додавання `, callback_data: 'back' }],
      ]),
    );
  }

  @Action('yesterday')
  async onYestardayAction(ctx: Context): Promise<void> {
    ctx.answerCbQuery();

    toNextScene(ctx, dayjs().subtract(1, 'day').format('DD.MM.YYYY'));
  }

  @Action('today')
  async onTodayAction(ctx: Context): Promise<void> {
    ctx.answerCbQuery();

    toNextScene(ctx, dayjs().format('DD.MM.YYYY'));
  }

  @On('text')
  async onText(@Ctx() ctx: Context, @Message('text') date: string) {
    let regexFull = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    let regexPartial = /^(\d{2})\.(\d{2})$/;

    if (regexFull.test(date)) {
      const [, day, month, year] = date.match(regexFull);
      this.handleDate(ctx, day, month, year);
    } else if (regexPartial.test(date)) {
      const currentYear = new Date().getFullYear().toString();
      const [, day, month] = date.match(regexPartial);
      this.handleDate(ctx, day, month, currentYear);
    } else {
      ctx.reply(
        'Неправильний формат. Будь ласка, вкажіть дату у форматі ДД.ММ.РРРР або ДД.ММ',
      );
    }
  }

  private isDateWithinCurrentPeriod(date: Date): boolean {
    const currentDay = new Date().getDate();
    if (currentDay <= 15) {
      return date.getDate() <= 15;
    }
    return date.getDate() > 15;
  }

  handleDate(ctx: Context, day: string, month: string, year: string) {
    const parsedDate = new Date(`${year}-${month}-${day}`);
    if (
      parsedDate &&
      parsedDate.getDate() === parseInt(day, 10) &&
      parsedDate.getMonth() + 1 === parseInt(month, 10) &&
      parsedDate.getFullYear() === parseInt(year, 10)
    ) {
      if (this.isDateWithinCurrentPeriod(parsedDate)) {
        toNextScene(ctx, `${day}.${month}.${year}`);
      } else {
        ctx.reply(
          'Ви не можете додавати інформацію за цей період. Будь ласка, введіть дату в межах поточного періоду.',
        );
      }
    } else {
      ctx.reply('Некоректна дата. Будь ласка, введіть коректне значення.');
    }
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
