# Backend Setup Guide

To enable the full functionality (MySQL Database, Product Management, 2FA, Admin Dashboard), please follow these steps:

## 1. Database Setup
1. Ensure you have **MySQL** installed (e.g., via XAMPP, WAMP, or standalone MySQL).
2. Create a database named `feetup_db`.
3. Import the schema:
   - Open your MySQL client (phpMyAdmin, Workbench, or CLI).
   - Run the SQL commands found in `backend/schema.sql` to create the necessary tables.

## 2. Backend Dependencies
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   npm install
   ```
   (This will install express, mysql2, cors, dotenv, speakeasy, qrcode, etc.)

## 3. Configuration
1. Check `backend/db.js` and ensure the database credentials match your local setup:
   - Host: localhost
   - User: root (default)
   - Password: (empty by default for XAMPP, or your password)
   - Database: feetup_db

## 4. Run the Server
1. Start the backend server:
   ```bash
   npm run dev
   ```
2. The server should start on `http://localhost:5000`.

## 5. Frontend Usage
The frontend has been updated to communicate with this local backend. run `npm run dev` in the root folder to start the React app.
