#!/usr/bin/env node
/**
 * Cron job for sending daily/weekly report emails
 * Runs scheduled reports to subscribed admins
 */

const db = require('../db');
const nodemailer = require('nodemailer');

// Create transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendReport(type, admin) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  let exams, title;
  if (type === 'daily') {
    exams = db.prepare('SELECT es.*, u.names, u.email FROM exam_sessions es JOIN users u ON u.id = es.user_id WHERE date(es.start_time) = ?').all(today);
    title = `Daily Report - ${today}`;
  } else {
    exams = db.prepare('SELECT es.*, u.names, u.email FROM exam_sessions es JOIN users u ON u.id = es.user_id WHERE date(es.start_time) >= ?').all(weekAgo);
    title = `Weekly Report - ${weekAgo} to ${today}`;
  }
  
  const totalExams = exams.length;
  const passed = exams.filter(e => e.passed).length;
  const passRate = totalExams ? Math.round((passed / totalExams) * 100) : 0;
  
  const htmlContent = `
    <h2>${title}</h2>
    <p>Total Exams: ${totalExams}</p>
    <p>Pass Rate: ${passRate}%</p>
    <p>Passed: ${passed}</p>
    <p>Failed: ${totalExams - passed}</p>
  `;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@drivingexam.rw',
      to: admin.email,
      subject: title,
      html: htmlContent
    });
    console.log(`Sent ${type} report to ${admin.email}`);
  } catch (err) {
    console.error(`Failed to send ${type} report to ${admin.email}:`, err.message);
  }
}

async function runReports() {
  const dailySubscribers = db.prepare(`
    SELECT u.* FROM notifications n 
    JOIN users u ON u.id = n.admin_id 
    WHERE n.type = 'daily' AND n.enabled = 1
  `).all();
  
  const weeklySubscribers = db.prepare(`
    SELECT u.* FROM notifications n 
    JOIN users u ON u.id = n.admin_id 
    WHERE n.type = 'weekly' AND n.enabled = 1
  `).all();
  
  const dayOfWeek = new Date().getDay();
  
  for (const admin of dailySubscribers) {
    await sendReport('daily', admin);
  }
  
  if (dayOfWeek === 1) {
    for (const admin of weeklySubscribers) {
      await sendReport('weekly', admin);
    }
  }
}

if (require.main === module) {
  runReports().catch(console.error);
}

module.exports = { runReports };