# Odoo x Adamas University Hackathon '26 — HRMS Portal

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
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=hrms_db
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:5173
   ```
4. Run migrations and seed data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   The backend will be running on `http://localhost:5000`.

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
   The application will be running on `http://localhost:5173`.

---

## 🛠️ Tech Stack & Key Features

- **Backend**: Express.js, Sequelize ORM, MySQL, JWT Authentication, Multer (logo and document uploads).
- **Frontend**: React (Vite), Vanilla CSS (glassmorphic dark design system), Lucide Icons, React Router DOM.
- **Dynamic Salary Calculation**:
  - Wage Type: Fixed Monthly Wage.
  - Interactive components calculations:
    - **Basic Salary**: 50% of monthly wage.
    - **House Rent Allowance (HRA)**: 50% of Basic Salary.
    - **Standard Allowance**: Fixed ₹4,167/month.
    - **Performance Bonus**: 8.33% of Basic Salary.
    - **Leave Travel Allowance (LTA)**: 8.33% of Basic Salary.
    - **Fixed Allowance**: Automatically computed as residual (`Wage - Sum of other components`).
  - PF Rates: Employer and Employee Provident Fund calculated dynamically at 12% of Basic Salary.
  - Tax Deductions: Professional Tax defaults to ₹200.
- **Role-Based Routing**:
  - **Employee Portal** (`/home`): Quick dashboard with clock-in/out, leave status, upcoming holidays, and profile page.
  - **Admin / HR Portal** (`/employees`): Grid directory of employees, click profile to edit all personal/private/salary details, edit leave allocations (`/timeoff/allocation`).
