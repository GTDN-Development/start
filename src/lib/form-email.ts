import nodemailer from "nodemailer";

type FormEmailMessage = {
  subject: string;
  html: string;
  text: string;
};

const HTML_ESCAPE_REPLACEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_REPLACEMENTS[character] ?? character);
}

export async function sendFormEmail(message: FormEmailMessage) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number.parseInt(process.env.MAIL_PORT || "587", 10),
    secure: process.env.MAIL_PORT === "465",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
    to: process.env.FORM_RECIPIENT_EMAIL,
    ...message,
  });
}
