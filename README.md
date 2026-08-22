# Odoo x NMIT Bangalore Hackathon 2026 — Dayflow HRMS Portal

A premium, full-stack Human Resource Management System (HRMS) built with React (Vite) and Node.js (Express + Sequelize ORM + MySQL).

---

## 🚀 Quick Setup & Launch Guide

### 1. Prerequisites
- **Node.js** (v16+)
- **MySQL Server** (running locally on port `3306`)

---

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   Create a `.env` file inside the `backend` directory:
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=hrms_db
   JWT_SECRET=hrms_jwt_secret_key_2026
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development

   # ✉️ SMTP Email Configuration (Optional - for sending real emails via Gmail / SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_char_google_app_password
   EMAIL_FROM="HRMS Portal" <your_email@gmail.com>
   ```

   > 💡 **Note for Gmail Users**: `SMTP_PASS` should be a 16-character **Google App Password** (generated from Google Account -> Security -> 2-Step Verification -> App Passwords). If SMTP keys are omitted, email alerts are logged safely to the backend terminal console.

4. Run migrations and seed database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`.

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will run on `http://localhost:5173`.

---

## 🛠️ Key Features & Architecture

- **Multi-Tenant Company Scoping**: Dedicated company workspaces. All employees, attendance logs, and leave requests are strictly isolated by `companyId`.
- **Automated Onboarding & Email Alerts**: Enrolling a new employee automatically dispatches a **Welcome Email** with their Login ID and temporary password via Nodemailer SMTP.
- **Real-Time Notification System**: Bell Icon dropdown in the header with unread badge counter for leave applications, status approvals, and employee updates.
- **Systray Check-In / Check-Out**: One-click check-in/out button in the top navigation bar with dynamic work hours calculation.
- **Leave & Time-Off Management**: Support for Paid, Sick, and Unpaid leave requests with auto-balance checks, attachments, and instant HR approval workflows.
- **Dynamic Salary Calculation & PDF Payslips**:
  - Configurable salary components (Basic, HRA, Standard Allowance, Bonus, LTA, Fixed Allowance, PF, PTax).
  - Printable **1-Page Salary Slip PDF Export**.
- **Analytics & Reports Dashboard (`/reports`)**:
  - Company Headcount KPI Cards, Attendance Rate %, Monthly Payroll Mass, Department Distribution.
  - Printable **Salary Slips Generator**.
  - **Attendance Summary Report** with **CSV Export**.
  - **Employee Master Audit Report** with **CSV Export**.
- **Soft Delete Archiving**: Admins can soft-delete employees (`isActive: false`) inside the profile Edit mode Danger Zone.
