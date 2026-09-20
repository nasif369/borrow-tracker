# Borrow Tracker

A simple web application for tracking debts and money owed between people.

## Features

### Account & Authentication
- User registration
- Email verification using OTP
- Resend verification OTP
- Login using roll number and password
- Secure password hashing with bcrypt
- JWT-based authentication
- Forgot password functionality
- Password reset using OTP
- Verified-email requirement for login

### Debt Management
- Create debts as:
  - You borrowed money
  - You lent money
- View debts from your own perspective
- Edit unpaid debts
- Request payment
- Confirm payment
- Delete unpaid debts
- View paid debt history
- Track total amount you owe
- Track total amount owed to you
- Automatic debt status tracking

### AI Assistant
- Gemini-powered AI assistant
- Ask questions about your debts using natural language
- Understand who owes whom and how much
- Summarize debt information
- Create debts using natural language
- AI uses the user's actual Borrow Tracker debt data
- User-provided Gemini API key
- Gemini API key is encrypted before being stored
- AI does not maintain a separate debt database

### Email System
- Gmail API integration
- OTP emails sent through Gmail API
- Email verification OTP
- Password reset OTP
- Resend verification OTP
- OAuth 2.0 authentication
- Gmail refresh token used for persistent email access
- No SMTP dependency

## How It Works

If Nasif owes Rahul ₹500:

**Nasif sees:**

> You owe Rahul ₹500

**Rahul sees:**

> Nasif owes you ₹500

This keeps the debt information clear for both users.

## AI Assistant

Users can interact with Borrow Tracker using natural language.

For example:

> How much do I owe in total?

> How much money is owed to me?

> What debts do I have with Rahul?

Users can also create debts naturally:

> I lent Rahul ₹500 for lunch.

The AI identifies the intended action and creates the corresponding debt record in Borrow Tracker.

## Email Verification

New users must verify their email address using a one-time password (OTP).

The OTP:

- Is sent through the Gmail API
- Expires after 10 minutes
- Is required before the account can be used for login

Users can also request a new verification OTP.

## Password Reset

If a user forgets their password:

1. Enter their roll number.
2. Receive a password reset OTP through email.
3. Verify the OTP.
4. Set a new password.

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected API routes use authentication middleware
- Gemini API keys are encrypted before storage
- OAuth credentials are stored securely
- Gmail refresh tokens are stored as environment variables in production
- Sensitive files such as `.env`, `credentials.json`, and `token.json` are excluded from Git

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
- Google APIs
- Gmail API
- Google OAuth 2.0
- Gemini API

### Database

- MongoDB Atlas

### Deployment

- Render

## Project Structure

```text
borrow-tracker/
│
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Debt.js
│   │   └── PendingUser.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── debt.js
│   │   ├── users.js
│   │   └── ai.js
│   │
│   ├── utils/
│   │   ├── encryption.js
│   │   └── gmail.js
│   │
│   ├── .env
│   ├── credentials.json
│   ├── token.json
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
