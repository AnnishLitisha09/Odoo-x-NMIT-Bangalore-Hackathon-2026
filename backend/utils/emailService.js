const nodemailer = require('nodemailer');
const { Notification, User, Employee } = require('../models');

// Configure Nodemailer transporter (SMTP fallback to console logger in dev)
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Creates an in-app notification and attempts to send email
 */
async function sendNotificationAndEmail({ userId, recipientEmail, title, message, type = 'info', link = null, emailHtml = null }) {
  try {
    // 1. Create In-App Notification
    let notification = null;
    if (userId) {
      notification = await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        isRead: false,
      });
    }

    // 2. Send Email Alert
    const fromAddress = process.env.EMAIL_FROM || '"HRMS System" <noreply@hrms.internal>';
    const bodyContent = emailHtml || `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f111a; color: #e2e8f0; border-radius: 8px;">
        <h2 style="color: #a78bfa; margin-bottom: 10px;">${title}</h2>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #2a2f45; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from your HRMS system.</p>
      </div>
    `;

    if (transporter && recipientEmail) {
      await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject: title,
        html: bodyContent,
      });
      console.log(`✉️ Email sent to ${recipientEmail}: ${title}`);
    } else {
      console.log(`[Email Alert Log] To: ${recipientEmail || 'User ID ' + userId} | Subject: ${title}`);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification/email:', error.message);
  }
}

/**
 * Helper: Welcome Email for new employees
 */
async function sendWelcomeEmail({ user, employee, tempPassword, companyName }) {
  const title = `Welcome to ${companyName || 'the Team'}!`;
  const message = `Your HRMS account has been created. Your Login ID is ${user.loginId}. Please log in and reset your temporary password.`;
  const link = '/signin';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #161929; border: 1px solid #2a2f45; border-radius: 12px; padding: 24px; color: #e2e8f0;">
      <h2 style="color: #a78bfa; margin-top: 0;">🎉 Welcome to ${companyName || 'HRMS'}!</h2>
      <p style="font-size: 15px; color: #cbd5e1;">Hi <strong>${employee.firstName} ${employee.lastName}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1;">Your employee account is ready. Below are your login credentials to access the HRMS portal:</p>
      
      <div style="background-color: #1e2235; border: 1px solid #2a2f45; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0; font-family: monospace; font-size: 14px;"><strong>Login ID:</strong> ${user.loginId}</p>
        <p style="margin: 4px 0; font-family: monospace; font-size: 14px;"><strong>Email:</strong> ${user.email}</p>
        <p style="margin: 4px 0; font-family: monospace; font-size: 14px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>

      <p style="font-size: 13px; color: #f59e0b;">⚠️ You will be prompted to change your password upon your first login.</p>
    </div>
  `;

  return sendNotificationAndEmail({
    userId: user.id,
    recipientEmail: user.email,
    title,
    message,
    type: 'success',
    link,
    emailHtml: html,
  });
}

/**
 * Helper: Leave Request Submission Alert to HR
 */
async function sendLeaveSubmittedAlert({ hrUser, employeeName, leaveRequest }) {
  const title = `New Leave Request from ${employeeName}`;
  const message = `${employeeName} requested ${leaveRequest.allocationDays} day(s) of ${leaveRequest.type} leave (${leaveRequest.startDate} to ${leaveRequest.endDate}).`;
  
  return sendNotificationAndEmail({
    userId: hrUser.id,
    recipientEmail: hrUser.email,
    title,
    message,
    type: 'warning',
    link: '/timeoff',
  });
}

/**
 * Helper: Leave Request Review Status (Approved / Rejected)
 */
async function sendLeaveStatusAlert({ user, leaveRequest, status }) {
  const isApproved = status === 'approved';
  const title = `Leave Request ${isApproved ? 'Approved ✅' : 'Rejected ❌'}`;
  const message = `Your request for ${leaveRequest.allocationDays} day(s) of ${leaveRequest.type} leave from ${leaveRequest.startDate} to ${leaveRequest.endDate} has been ${status}.`;

  return sendNotificationAndEmail({
    userId: user.id,
    recipientEmail: user.email,
    title,
    message,
    type: isApproved ? 'success' : 'danger',
    link: '/timeoff',
  });
}

module.exports = {
  sendNotificationAndEmail,
  sendWelcomeEmail,
  sendLeaveSubmittedAlert,
  sendLeaveStatusAlert,
};
