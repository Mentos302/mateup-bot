import { Injectable } from '@nestjs/common';
import { SanityClient, createClient } from '@sanity/client';

@Injectable()
export class SanityService {
  private client: SanityClient;

  constructor() {
    this.client = createClient({
      useCdn: false,
      projectId: 'tqkhwn17',
      dataset: 'production',
      token:
        'sknUqSUmagt0BluL8oGtKFdup1T36zLih2yTZjuAwFJPzwyop1Zt3mrFcyRqRj7Z8BvO5sdkhNhOW7RpP7WWz97aRTF9maE28fUQ5iz8qI3NJzzMx860KhfCfvTBGgkopS2xq8i4UcxcKBFUBCCHv5mZDkdmcxWnxsupwP1YYbky8usnTDrj',
    });
  }

  async getUserByChatId(chatId: number): Promise<User> {
    const query = `*[_type == "users" && chat_id == $chatId]{
      name,
      chat_id,
      is_teacher,
      subjects,
      students
    }[0]`;

    return this.client.fetch(query, { chatId });
  }

  async createUser(chatId: number, name: string) {
    const user = {
      _type: 'users',
      chat_id: chatId,
      name: name,
    };

    return this.client.create(user);
  }

  async addStudentToUser(chatId: number, studentName: string) {
    const { _id } = await this.client.fetch(
      `*[_type == "users" && chat_id == $chatId][0]`,
      { chatId },
    );

    await this.client
      .patch(_id)
      .setIfMissing({ students: [] }) // Ensure 'students' field exists
      .append('students', [studentName]) // Append the new student name to the array
      .commit(); // Commit the changes
  }
}
