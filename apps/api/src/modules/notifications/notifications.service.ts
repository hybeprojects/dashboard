import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async sendEmail(to: string, subject: string, body: string) {
    console.log('EMAIL', { to, subject, body });
  }
  async sendSms(to: string, message: string) {
    console.log('SMS', { to, message });
  }
}
