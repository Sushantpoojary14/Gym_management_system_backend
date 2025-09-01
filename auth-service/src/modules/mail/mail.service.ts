import { Injectable } from '@nestjs/common';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import { sendMail } from 'src/common/utils/nodemailer.util';

@Injectable()
export class MailService {
  constructor(){}
  private createMailOptions(
    to: string | string[],
    subject: string,
    html: string,
  ) {
    return {
      from: `${process.env.EMAIL_SENDER}`,
      to,
      subject,
      html,
    };
  }

  public sendMailToSupport(email: string, subject: string, message: string) {
    const html = `
      <div>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `;
    return sendMail(this.createMailOptions(email, subject, html));
  }
}
