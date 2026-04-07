import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import * as cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

// ─── Gmail SMTP Transporter ──────────────────────────────────
// Set with:
//   firebase functions:config:set gmail.email="you@gmail.com" gmail.password="your-app-password"
//   firebase functions:config:set app.url="https://your-app.web.app" admin.email="mhasiejoyp@gmail.com"
function getTransporter() {
  const email = functions.config().gmail?.email;
  const password = functions.config().gmail?.password;
  if (!email || !password) {
    throw new Error('Gmail not configured. Run: firebase functions:config:set gmail.email="..." gmail.password="..."');
  }
  return nodemailer.createTransport({ service: "gmail", auth: { user: email, pass: password } });
}

function senderAddress(): string { return functions.config().gmail.email; }
function getAppUrl(): string { return functions.config().app?.url || "http://localhost:5173"; }
function getAdminEmail(): string { return functions.config().admin?.email || ""; }

// ═══════════════════════════════════════════════════════════════
// 1) REQUEST PASSWORD RESET
// ═══════════════════════════════════════════════════════════════
export const requestPasswordReset = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email is required" }); return; }

    try {
      let userRecord;
      try { userRecord = await admin.auth().getUserByEmail(email); }
      catch { res.status(200).json({ message: "If an account exists, a reset link has been sent." }); return; }

      const existing = await db.collection("passwordResetTokens").where("email", "==", email).get();
      const batch = db.batch();
      existing.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      const token = uuidv4();
      await db.collection("passwordResetTokens").doc(token).set({
        email, uid: userRecord.uid,
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3600000)),
        used: false, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const resetLink = `${getAppUrl()}/reset-password?token=${token}`;
      await getTransporter().sendMail({
        from: `"MonStar Ship Lines" <${senderAddress()}>`,
        to: email,
        subject: "Password Reset — MonStar Ship Lines",
        html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#0a1628,#1e3a5f);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">MonStar Ship Lines</h1>
    <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Password Reset Request</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${userRecord.displayName || "there"}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">Click below to reset your password. This link expires in <strong>1 hour</strong>.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#64748b;font-size:13px;">If you didn't request this, ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
    <p style="color:#94a3b8;font-size:12px;text-align:center;">&copy; MonStar Ship Lines</p>
  </div>
</div>`,
      });

      res.status(200).json({ message: "If an account exists, a reset link has been sent." });
    } catch (err: any) {
      console.error("requestPasswordReset error:", err);
      res.status(500).json({ error: "Failed to process request." });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 2) RESET PASSWORD
// ═══════════════════════════════════════════════════════════════
export const resetPassword = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const { token, newPassword } = req.body;
    if (!token || !newPassword) { res.status(400).json({ error: "Token and new password are required" }); return; }
    if (newPassword.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }

    try {
      const snap = await db.collection("passwordResetTokens").doc(token).get();
      if (!snap.exists) { res.status(400).json({ error: "Invalid or expired reset link." }); return; }
      const data = snap.data()!;
      if (data.used) { res.status(400).json({ error: "This reset link has already been used." }); return; }
      if (data.expiresAt.toDate() < new Date()) { res.status(400).json({ error: "Reset link expired. Request a new one." }); return; }

      await admin.auth().updateUser(data.uid, { password: newPassword });
      await db.collection("passwordResetTokens").doc(token).update({ used: true });
      res.status(200).json({ message: "Password reset successfully." });
    } catch (err: any) {
      console.error("resetPassword error:", err);
      res.status(500).json({ error: "Failed to reset password." });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 3) SEND BOOKING CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════
export const sendBookingEmail = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const { booking, trip } = req.body;
    if (!booking || !trip) { res.status(400).json({ error: "booking and trip are required" }); return; }

    try {
      const fmt = (n: number) => "\u20B1" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
      const fmtD = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

      const passengerRows = (booking.passengers || [])
        .map((p: any) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.firstName} ${p.lastName}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-transform:capitalize;">${p.type}</td></tr>`)
        .join("");

      const vehicleRows = (booking.vehicles || [])
        .map((v: any) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${v.vehicleType}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${v.plateNumber}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${fmt(v.fare)}</td></tr>`)
        .join("");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
<div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#0a1628;padding:32px;text-align:center;">
    <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">MonStar Ship Lines</h1>
    <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Booking Confirmation</p>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 8px;color:#0f172a;font-size:16px;">Hi <strong>${booking.passengerName}</strong>,</p>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">Your booking is <strong>pending payment confirmation</strong>.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;">Booking Reference</p>
      <p style="margin:0;color:#0a1628;font-size:22px;font-weight:700;font-family:monospace;">${booking.bookingRef}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
      <tr><td style="padding:8px 0;color:#64748b;width:40%;">Route</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${trip.origin} → ${trip.destination}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Vessel</td><td style="padding:8px 0;color:#0f172a;">${trip.vesselName}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;color:#0f172a;">${fmtD(trip.departureDate)} at ${trip.departureTime}</td></tr>
    </table>
    <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;">Passengers</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;color:#475569;">Name</th><th style="padding:8px 12px;text-align:left;color:#475569;">Type</th></tr></thead>
      <tbody>${passengerRows}</tbody>
    </table>
    ${vehicleRows ? `<h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;">Vehicles</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <thead><tr style="background:#f1f5f9;"><th style="padding:8px 12px;text-align:left;color:#475569;">Type</th><th style="padding:8px 12px;text-align:left;color:#475569;">Plate</th><th style="padding:8px 12px;text-align:left;color:#475569;">Fare</th></tr></thead>
      <tbody>${vehicleRows}</tbody>
    </table>` : ""}
    <div style="background:#0a1628;border-radius:8px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="color:#94a3b8;font-size:14px;">Total Fare</span>
      <span style="color:#f59e0b;font-size:20px;font-weight:700;">${fmt(booking.totalAmount)}</span>
    </div>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
    <p style="margin:0;color:#94a3b8;font-size:12px;">MonStar Ship Lines · Valid for date of travel only</p>
  </div>
</div></body></html>`;

      const transporter = getTransporter();
      const from = `"MonStar Ship Lines" <${senderAddress()}>`;

      await transporter.sendMail({ from, to: booking.passengerEmail, subject: `Booking Received – ${booking.bookingRef} | MonStar Ship Lines`, html });

      const adminEmail = getAdminEmail();
      if (adminEmail) {
        await transporter.sendMail({ from, to: adminEmail, subject: `New Booking: ${booking.bookingRef} – ${booking.passengerName}`, html });
      }

      res.status(200).json({ message: "Emails sent." });
    } catch (err: any) {
      console.error("sendBookingEmail error:", err);
      res.status(500).json({ error: "Failed to send email." });
    }
  });
});
