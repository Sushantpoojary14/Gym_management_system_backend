import * as nodemailer from 'nodemailer';

export const sendMail = async (mailOptions: nodemailer.SendMailOptions): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      name: process.env.EMAIL_DOMAIN,
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    return false;
  }
};
