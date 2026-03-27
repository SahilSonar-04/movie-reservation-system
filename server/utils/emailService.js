import nodemailer from "nodemailer";
import QRCode from "qrcode";
import logger from "./logger.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateTicketHTML = ({ userName, booking, hasQR }) => {
  const show = booking.show;
  const showDate = new Date(show.startTime);
  const bookingDate = new Date(booking.createdAt);
  const seatNumbers = booking.seats.map((s) => s.seatNumber).join(", ");

  const formattedShowDate = showDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const formattedShowTime = showDate.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
  const formattedBookingDate = bookingDate.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  // CID reference — the actual image is sent as an inline attachment.
  // data: URIs are blocked by Gmail and most clients for security reasons.
  const qrImageTag = hasQR
    ? `<img src="cid:qrcode" width="120" height="120" alt="Booking QR Code" style="border:4px solid #fff;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.1);display:block;" />`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmation – CineBook</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 40px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">CineBook</p>
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;">${show.movie.title}</h1>
              <span style="display:inline-block;padding:4px 14px;background:rgba(255,255,255,0.2);border-radius:20px;font-size:12px;font-weight:600;color:#fff;letter-spacing:0.5px;">✓ BOOKING CONFIRMED</span>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="margin:0;font-size:15px;color:#374151;">Hi <strong>${userName}</strong>, your booking is confirmed! Here are your ticket details.</p>
            </td>
          </tr>

          <!-- Details Grid -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Date</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${formattedShowDate}</p>
                  </td>
                  <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Time</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${formattedShowTime}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Theater</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${show.theater.name}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${show.theater.location}</p>
                  </td>
                  <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Screen</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${show.screen}</p>
                  </td>
                </tr>
              </table>

              <!-- Seats box -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Seats</p>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#dc2626;">${seatNumbers}</p>
                <p style="margin:0;font-size:13px;color:#374151;">${booking.seats.length} ${booking.seats.length === 1 ? "seat" : "seats"} &nbsp;•&nbsp; <strong style="color:#dc2626;">₹${booking.totalAmount}</strong></p>
              </div>

              <!-- QR + Booking ID box -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${hasQR ? `<td width="140" style="vertical-align:middle;padding-right:20px;">${qrImageTag}</td>` : ""}
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Booking ID</p>
                      <p style="margin:0 0 8px;font-size:12px;font-family:monospace;font-weight:600;color:#111827;word-break:break-all;">${booking._id}</p>
                      <p style="margin:0;font-size:11px;color:#9ca3af;">Booked on ${formattedBookingDate}</p>
                      ${hasQR ? `<p style="margin:8px 0 0;font-size:11px;color:#6b7280;">Scan QR at the theater entrance</p>` : ""}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">Please show this email or your Booking ID at the theater entrance.</p>
              <p style="margin:16px 0 0;font-size:12px;color:#d1d5db;text-align:center;">© 2026 CineBook &nbsp;|&nbsp; Designed by Sahil Sonar</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
};

export const sendBookingConfirmationEmail = async ({ userEmail, userName, booking }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn("[EMAIL] Skipped — EMAIL_USER or EMAIL_PASS not set in .env");
    return;
  }

  // Generate QR as a raw PNG buffer — sent as inline attachment, NOT a data URI.
  // data: URIs are stripped by Gmail and most email clients for security.
  let qrBuffer = null;
  try {
    qrBuffer = await QRCode.toBuffer(booking._id.toString(), {
      width: 120,
      margin: 1,
      color: { dark: "#111827", light: "#ffffff" },
    });
  } catch (err) {
    logger.error(`[EMAIL] QR generation failed: ${err.message}`);
  }

  const html = generateTicketHTML({ userName, booking, hasQR: !!qrBuffer });

  const mailOptions = {
    from: `"CineBook 🎬" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Your tickets for ${booking.show.movie.title} are confirmed! 🎉`,
    html,
    // Inline attachment: nodemailer matches cid:qrcode in the HTML to this attachment
    attachments: qrBuffer
      ? [
          {
            filename: "qrcode.png",
            content: qrBuffer,
            cid: "qrcode", // must match src="cid:qrcode" in the HTML
            contentType: "image/png",
          },
        ]
      : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EMAIL] Confirmation sent to ${userEmail} — MessageId: ${info.messageId}`);
  } catch (err) {
    logger.error(`[EMAIL] Failed to send to ${userEmail}: ${err.message}`);
  }
};