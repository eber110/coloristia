// src/utils/mailer.ts

import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Generar un token aleatorio de 6 dígitos
export function generateVerificationToken(): string {
  
  return crypto.randomInt(100000, 999999).toString();

}

// Configurar el transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para port 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER || 'tu-correo@example.com',
    pass: process.env.SMTP_PASS || 'tu-contraseña',
  },
});

export async function sendVerificationEmail(email: string, token: string): Promise<void> {

  const mailOptions = {
    from: `"Coloristia" <${process.env.SMTP_USER || 'no-reply@coloristia.com'}>`,
    to: email,
    subject: 'Verifica tu cuenta en Coloristia',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">¡Bienvenido a Coloristia!</h2>
        <p style="color: #555; font-size: 16px;">Gracias por registrarte. Para completar tu registro y activar tu cuenta, por favor ingresa el siguiente código de verificación:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${token}</h1>
        </div>
        <p style="color: #555; font-size: 16px;">Si no solicitaste este registro, puedes ignorar este correo.</p>
        <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">© ${new Date().getFullYear()} Coloristia. Todos los derechos reservados.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

}
