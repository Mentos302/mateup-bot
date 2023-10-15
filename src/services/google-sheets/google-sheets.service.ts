const dayjs = require('dayjs');

import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { SceneState } from 'src/interfaces/context.interface';

@Injectable()
export class GoogleSheetsService {
  private sheets: any;
  private sheetId: string = '1yFhLP1nyKplc0nUCTofClzWywa9DcPLQHGVjSSQtp4k'; // Replace with your Google Sheet ID

  constructor() {
    this.setupGoogleSheetsAPI();
  }

  private setupGoogleSheetsAPI() {
    const keyPath = path.join(__dirname, '..', '..', '..', 'key.json');
    const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/spreadsheets'],
    );
    jwtClient.authorize((err, tokens) => {
      if (err) {
        throw err;
      }
      this.sheets = google.sheets({ version: 'v4', auth: jwtClient });
    });
  }

  async getLastRowIndex(): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: 'B:B',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return 0;

      const lastRowValue = rows[rows.length - 1][0];
      const lastIndex = parseInt(lastRowValue, 10);
      if (isNaN(lastIndex)) return 0;

      return lastIndex;
    } catch (error) {
      console.error('Error fetching last row index from Google Sheet:', error);
      return 0;
    }
  }

  async addToSheet(state: SceneState) {
    try {
      const lastIndex = await this.getLastRowIndex();
      const nextIndex = lastIndex + 1;

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range: 'B:B',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [
            [
              nextIndex,
              state.date,
              state.user.name,
              state.subject,
              state.student,
              '',
              '',
              '',
              '',
              '',
              1,
              state.topic,
            ],
          ],
        },
      });
    } catch (error) {
      console.error('Error adding data to Google Sheet:', error);
    }
  }

  // Similarly, you can implement functions to write, update, or delete data from the sheet.
}
