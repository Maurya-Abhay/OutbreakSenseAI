import nodemailer from "nodemailer";

// Email service for sending alerts and notifications
// Supports multiple email providers

let transporter = null;

const isDisabledProvider = (provider) => ["none", "disabled", "off"].includes(String(provider || "").toLowerCase());

const isValidSendGridKey = (key) => {
  const value = String(key || "").trim();
  return value.startsWith("SG.") && value.length > 20 && value !== "SG.xxxxx";
};

/**
 * Initialize email transporter based on environment configuration
 */
const initializeTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || "smtp";

  if (isDisabledProvider(emailProvider)) {
    transporter = null;
    console.log("[Email Service] Disabled by EMAIL_PROVIDER setting");
    return null;
  }
  
  if (emailProvider === "gmail") {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use app-specific password, not real password
      },
    });
  } else if (emailProvider === "sendgrid") {
    // SendGrid via SMTP
    transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Generic SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });
  }
  
  console.log(`[Email Service] Initialized with provider: ${emailProvider}`);
  return transporter;
};

/**
 * Verify email configuration on startup
 */
export const verifyEmailConfiguration = async () => {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || "smtp";

    if (isDisabledProvider(emailProvider)) {
      return false;
    }

    if (String(emailProvider).toLowerCase() === "sendgrid" && !isValidSendGridKey(process.env.SENDGRID_API_KEY)) {
      console.warn("[Email Service] SendGrid key missing/placeholder. Email alerts are disabled until a valid key is configured.");
      return false;
    }

    const mail = initializeTransporter();
    if (!mail) {
      return false;
    }
    await mail.verify();
    console.log("[Email Service] Configuration verified successfully");
    return true;
  } catch (error) {
    console.warn("[Email Service] Configuration failed (non-critical):", error.message);
    console.warn("[Email Service] Alerts will NOT be sent until configured properly");
    return false;
  }
};

/**
 * Send alert notification email to subscriber
 */
export const sendAlertNotification = async ({ email, recipientName, alertTitle, alertMessage, locationName, riskLevel, actionUrl }) => {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    const senderEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || "alerts@outbreaksense.ai";
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; }
        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .high-risk { background: #f8d7da !important; border-left-color: #dc3545 !important; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>OutbreakSense AI Alert</h2>
        </div>
        <div class="content">
            <p>Hi ${recipientName || "Subscriber"},</p>
            
            <p>You're receiving this alert because you subscribed to updates for <strong>${locationName}</strong>.</p>
            
            <div class="alert-box ${riskLevel === "High" ? "high-risk" : ""}">
                <h3 style="margin: 0 0 10px 0;">${alertTitle}</h3>
                <p style="margin: 0;">${alertMessage}</p>
                <p style="margin: 5px 0 0 0; font-weight: bold;">Risk Level: <span style="color: ${getRiskColor(riskLevel)}">${riskLevel}</span></p>
            </div>
            
            <p>For more details and to take action, click the button below:</p>
            <a href="${actionUrl}" class="button">View Details</a>
            
            <p>This is an automated alert from OutbreakSense AI. If you no longer want to receive alerts for ${locationName}, you can unsubscribe from your account settings.</p>
        </div>
        <div class="footer">
            <p>OutbreakSense AI - Real-time Disease Outbreak Detection</p>
            <p>&copy; 2026. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: `🚨 OutbreakSense Alert: ${alertTitle}`,
      html: htmlContent,
      text: `${alertTitle}\n\n${alertMessage}\n\nLocation: ${locationName}\nRisk Level: ${riskLevel}`, // Fallback plain text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Alert sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send alert to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send report confirmation email
 */
export const sendReportConfirmation = async ({ email, recipientName, reportId, locationName, reportUrl }) => {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    const senderEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || "alerts@outbreaksense.ai";
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Report Confirmation</h2>
        </div>
        <div class="content">
            <p>Hi ${recipientName || "User"},</p>
            
            <p>Thank you for submitting your health report to OutbreakSense AI. Your contribution helps us track and predict disease outbreaks.</p>
            
            <p><strong>Report Details:</strong></p>
            <ul>
                <li>Report ID: <code>${reportId}</code></li>
                <li>Location: ${locationName}</li>
                <li>Status: Under Review</li>
            </ul>
            
            <p>Your report has been received and is being analyzed by our AI model. You can track its status:</p>
            <a href="${reportUrl}" class="button">View My Report</a>
            
            <p>Thank you for helping keep our community safe!</p>
        </div>
        <div class="footer">
            <p>OutbreakSense AI - Real-time Disease Outbreak Detection</p>
            <p>&copy; 2026. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: `Report Confirmation - ID: ${reportId}`,
      html: htmlContent,
      text: `Your report ${reportId} for ${locationName} has been received.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Confirmation sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send confirmation to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send subscription confirmation email
 */
export const sendSubscriptionConfirmation = async ({ email, recipientName, locationName, unsubscribeUrl }) => {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    const senderEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || "alerts@outbreaksense.ai";
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Alert Subscription Confirmed</h2>
        </div>
        <div class="content">
            <p>Hi ${recipientName || "Subscriber"},</p>
            
            <p>You've successfully subscribed to alerts for <strong>${locationName}</strong>.</p>
            
            <p>You will receive email notifications whenever there are important health alerts or disease outbreak warnings in this area.</p>
            
            <p>If you wish to unsubscribe or manage your subscriptions, click the link below:</p>
            <p><a href="${unsubscribeUrl}" style="color: #667eea;">Manage Subscriptions</a></p>
            
            <p>Thank you for staying informed!</p>
        </div>
        <div class="footer">
            <p>OutbreakSense AI - Real-time Disease Outbreak Detection</p>
            <p>&copy; 2026. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: `Alert Subscription Confirmed - ${locationName}`,
      html: htmlContent,
      text: `You're now subscribed to alerts for ${locationName}.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Subscription confirmation sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send subscription confirmation to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get color code based on risk level
 */
const getRiskColor = (level) => {
  switch (String(level).toLowerCase()) {
    case "high":
      return "#dc3545";
    case "medium":
      return "#ffc107";
    case "low":
      return "#28a745";
    default:
      return "#6c757d";
  }
};

/**
 * Send password reset OTP email
 */
export const sendPasswordResetOTP = async ({ email, recipientName, otp }) => {
  try {
    if (!transporter) {
      initializeTransporter();
    }

    const senderEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || "alerts@outbreaksense.ai";
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; }
        .otp-box { background: #f0f0f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea; font-family: monospace; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hi ${recipientName || "User"},</p>
            
            <p>We received a request to reset the password for your OutbreakSense AI account. Use the OTP below to reset your password:</p>
            
            <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your One-Time Password (OTP):</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 15 minutes</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Never share this OTP with anyone</li>
                    <li>OutbreakSense AI will never ask for your OTP via email or call</li>
                    <li>If you didn't request a password reset, please ignore this email</li>
                </ul>
            </div>
            
            <p>To reset your password:</p>
            <ol style="margin: 10px 0;">
                <li>Go to the password reset page</li>
                <li>Enter your email address</li>
                <li>Enter the OTP above: <strong>${otp}</strong></li>
                <li>Enter your new password</li>
                <li>Click "Reset Password"</li>
            </ol>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">If you did not request a password reset, please disregard this email. Your account is secure if you don't share this OTP.</p>
        </div>
        <div class="footer">
            <p>OutbreakSense AI - Real-time Disease Outbreak Detection</p>
            <p>&copy; 2026. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: `Password Reset OTP - OutbreakSense AI`,
      html: htmlContent,
      text: `Your password reset OTP is: ${otp}\n\nThis OTP is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset OTP sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send password reset OTP to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  verifyEmailConfiguration,
  sendAlertNotification,
  sendReportConfirmation,
  sendSubscriptionConfirmation,
  sendPasswordResetOTP,
};
