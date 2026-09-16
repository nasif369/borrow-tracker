# Borrow Tracker

A simple web application for tracking debts between people.

## Features

- User registration and login
- Login using roll number
- Secure password hashing
- Create debts as:
  - You borrowed money
  - You lent money
- View debts from your own perspective
- Edit unpaid debts
- Request payment
- Confirm payment
- Delete unpaid debts
- View paid debt history
- Track total amount you owe and are owed
- JWT-based authentication
- MongoDB database
- Responsive web interface

## How It Works

If Nasif owes Rahul ₹500:

**Nasif sees:**

> You owe Rahul ₹500

**Rahul sees:**

> Nasif owes you ₹500

This keeps the debt information clear for both users.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

## Project Structure

```text
borrow-tracker/
│
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Debt.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── debt.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
