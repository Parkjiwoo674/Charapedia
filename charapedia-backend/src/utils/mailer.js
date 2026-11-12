import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 메일 보내는 방법 두 가지 (자동 선택)
//  1) BREVO_API_KEY 가 있으면 → Brevo HTTPS API (Railway 같은 배포 환경용. SMTP 포트가 막혀 있어도 동작)
//  2) 없으면 → Gmail SMTP (내 컴퓨터에서 개발할 때)
const BREVO_API_URL = process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 보내는 사람 주소: 배포에서는 Brevo에서 인증한 주소(MAIL_FROM), 로컬에서는 Gmail 주소
function senderAddress() {
  return process.env.MAIL_FROM || process.env.GMAIL_USER;
}

async function sendViaBrevo(mail) {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Charapedia", email: senderAddress() },
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo 메일 발송 실패 (${res.status}): ${detail.slice(0, 200)}`);
  }
}

// MAIL_DRY_RUN=1 이면 실제 메일 대신 콘솔에 출력한다 (개발/테스트용, 운영에서는 서버가 시작을 거부함)
async function deliver(mail) {
  if (process.env.MAIL_DRY_RUN === "1") {
    console.log(`[MAIL_DRY_RUN] to=${mail.to} :: ${mail.text}`);
    return;
  }
  if (process.env.BREVO_API_KEY) {
    await sendViaBrevo(mail);
    return;
  }
  await transporter.sendMail({ ...mail, from: `"Charapedia" <${senderAddress()}>` });
}

export async function sendVerificationEmail(to, code) {
  await deliver({
    to,
    subject: "[Charapedia] 이메일 인증번호",
    text: `인증번호: ${code} (10분간 유효합니다)`,
    html: `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2>Charapedia 이메일 인증</h2>
        <p>아래 인증번호를 입력해주세요. 10분간 유효합니다.</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to, code) {
  await deliver({
    to,
    subject: "[Charapedia] 비밀번호 재설정 인증번호",
    text: `비밀번호 재설정 인증번호: ${code} (10분간 유효합니다)`,
    html: `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2>Charapedia 비밀번호 재설정</h2>
        <p>본인이 요청하지 않았다면 이 메일을 무시하세요. 아래 인증번호는 10분간 유효합니다.</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      </div>
    `,
  });
}

// 인증번호는 예측하기 어려운 암호학적 난수로 만든다 (Math.random 사용 안 함)
function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export { generateCode };