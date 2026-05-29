# Classroom Dashboard Backend

[![API Docs](https://img.shields.io/badge/API%20Docs-https%3A%2F%2Fclass-room-backend-nodejs-stop.vercel.app%2Fapi%2Fdocs-blue?style=for-the-badge)](https://class-room-backend-nodejs-stop.vercel.app/api/docs)

A comprehensive Node.js backend for a classroom management system built with Express.js and MongoDB. This backend provides secure authentication, payment processing, class management, and student administration capabilities with RESTful APIs.

## 📚 API Documentation

**[https://class-room-backend-nodejs-stop.vercel.app/api/docs](https://class-room-backend-nodejs-stop.vercel.app/api/docs)**

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── server.js              # Main server entry point
│   ├── config/               # Configuration files
│   │   ├── db.js             # MongoDB connection setup
│   │   ├── cloudinary.js     # Cloudinary configuration
│   │   └── stripe.js         # Stripe payment configuration
│   ├── api/                  # API route handlers
│   │   └── payment/          # Payment-related API handlers
│   ├── controllers/          # Business logic controllers
│   │   ├── AuthControlles.js       # Authentication logic
│   │   ├── AdminAuthControlles.js  # Admin authentication logic
│   │   ├── paymentController.js    # Payment processing
│   │   ├── planController.js      # Plan management
│   │   ├── StudentControlles.js   # Student management
│   │   ├── emailController.js      # Email sending
│   │   ├── handleAutoManage.js     # Auto-management features
│   │   └── patchedControllers.js   # Patched controllers
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js      # JWT authentication middleware
│   │   └── multer.js             # File upload middleware
│   ├── models/              # MongoDB models/schemas
│   │   ├── Users.js              # User model
│   │   ├── Admin.js              # Admin model
│   │   ├── Class.js              # Class model
│   │   ├── Plan.js               # Plan model
│   │   ├── Transaction.js        # Transaction model
│   │   └── PendingUser.js        # Pending user model
│   ├── routes/              # API route definitions
│   │   ├── AuthRoutes.js         # Authentication routes
│   │   ├── AdminAuthRoutes.js    # Admin authentication routes
│   │   ├── paymentRoutes.js      # Payment routes
│   │   ├── planRoutes.js         # Plan routes
│   │   └── StudentRoutes.js      # Student routes
│   ├── utils/               # Utility functions
│   │   ├── sendEmail.js          # Email sending utilities
│   │   ├── tokens.js             # JWT token utilities
│   │   └── emailTemplates/      # Email templates
│   └── docs/                # API documentation
│       └── docs.html            # API documentation HTML
├── seed.js                  # Database seeding script
├── vercel.json              # Vercel deployment configuration
├── package.json             # Dependencies and scripts
└── .env                    # Environment variables
```

## 🛠️ Technology Stack

### Core Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **JWT** - JSON Web Token for authentication
- **bcrypt** - Password hashing
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management

### Payment Processing
- **Stripe** - Payment processing and webhooks
- **uuid** - Unique identifier generation

### File Management
- **Cloudinary** - Cloud media management
- **multer** - File upload middleware

### Email Services
- **nodemailer** - Email sending
- **googleapis** - Google API integration

### Automation
- **node-cron** - Task scheduling

## 📦 Dependencies

### Production Dependencies
```json
{
  "bcrypt": "^6.0.0",
  "bcryptjs": "^3.0.2",
  "body-parser": "^2.2.0",
  "cloudinary": "^2.7.0",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^5.1.0",
  "googleapis": "^160.0.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.18.1",
  "multer": "^2.0.2",
  "node-cron": "^4.2.1",
  "nodemailer": "^7.0.3",
  "stripe": "^18.5.0",
  "uuid": "^13.0.0"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.1.10"
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB database
- Stripe account (for payments)
- Cloudinary account (for file uploads)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Build for Production
```bash
npm start
```

### Database Seeding
```bash
npm run seed
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/classroom_dashboard

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONT_BASE_URL=http://localhost:3000
```

## 🎯 Core Features

### 1. Authentication System
- **User Authentication**: JWT-based authentication with refresh tokens
- **Admin Authentication**: Separate admin authentication system
- **Password Management**: Secure password hashing and OTP-based password reset
- **Session Management**: Token-based session management

### 2. User Management
- **User Registration**: Create new users with pending status
- **User Activation**: Activate users after payment completion
- **Profile Management**: User profile and status management
- **Role-based Access**: Student and admin role separation

### 3. Class Management
- **Class Creation**: Admin can create new classes
- **Student Enrollment**: Students can join classes
- **Class Organization**: Files, notes, tasks, and videos organization
- **Instructor Management**: Class instructor assignment

### 4. Payment System
- **Stripe Integration**: Complete payment processing
- **Checkout Sessions**: Dynamic checkout session creation
- **Webhook Handling**: Secure webhook processing for payment events
- **Transaction Tracking**: Complete transaction history

### 5. Plans & Subscriptions
- **Plan Management**: Create and manage subscription plans
- **Plan Features**: Define features for each plan
- **Duration Control**: Monthly subscription management
- **Plan Activation**: Automatic plan activation after payment

### 6. File Management
- **Cloudinary Integration**: Cloud-based file storage
- **Multi-format Support**: Images, videos, and documents
- **Secure Uploads**: Authenticated file upload system
- **File Organization**: Class-based file categorization

### 7. Email System
- **Transaction Emails**: Automated payment confirmation emails
- **Password Reset**: OTP-based password reset
- **Welcome Emails**: New user welcome emails
- **Notification Emails**: System notifications and alerts

## 🔌 API Endpoints

### Authentication Endpoints
```bash
POST   /api/auth/pending          # Create pending user
GET    /api/auth/pending/:id      # Get pending user
GET    /api/auth/status/:id        # Check signup status
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
```

### Admin Endpoints
```bash
POST   /api/admin/login            # Admin login
GET    /api/admin/classes         # Get all classes
POST   /api/admin/classe/add      # Add new class
```

### Payment Endpoints
```bash
POST   /api/payment/create-checkout-session  # Create Stripe checkout
POST   /api/payment/webhook                  # Stripe webhook handler
```

### Plans Endpoints
```bash
GET    /api/plans                  # Get all plans
GET    /api/plans/:id              # Get plan by ID
```

### Student Endpoints
```bash
GET    /api/student/:id/classes    # Get student's classes
POST   /api/student/join-class     # Join a class
```

### Data Models

#### User Model
```javascript
{
  name: String,
  email: String,
  phone: String,
  password: String,
  plan: ObjectId,
  status: String, // "pending" | "active"
  accessToken: String,
  createdAt: Date,
  expiresAt: Date,
  resetOTP: String,
  resetOTPExpires: Date,
  classes: [ObjectId],
  deviceToken: String,
  warning7Sent: Boolean,
  warning1Sent: Boolean
}
```

#### Class Model
```javascript
{
  name: String,
  description: String,
  instructorId: ObjectId,
  students: [ObjectId],
  files: [{
    filename: String,
    path: String,
    uploadedAt: Date
  }],
  notes: [{
    title: String,
    content: String,
    createdAt: Date
  }],
  tasks: [{
    title: String,
    description: String,
    dueDate: Date,
    fileUrl: String,
    submissions: [{
      studentId: ObjectId,
      fileUrl: String,
      submittedAt: Date
    }]
  }],
  videos: [{
    title: String,
    url: String,
    uploadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Plan Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  duration: Number, // in months
  features: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Data Flow Architecture

### Authentication Flow
1. User registration creates pending user
2. User completes payment via Stripe
3. Webhook activates user account
4. JWT tokens issued for authentication
5. Middleware validates tokens for protected routes

### Class Management Flow
1. Admin creates new class
2. Student joins class via API
3. Class data cached in context
4. Students access class resources
5. Files and content uploaded to Cloudinary

### Payment Flow
1. User selects plan and creates pending account
2. Stripe checkout session created
3. User completes payment
4. Webhook processes payment success
5. User account activated and plan assigned

### State Management
- **MongoDB**: Primary data storage
- **JWT**: Authentication state
- **Cloudinary**: File storage
- **Stripe**: Payment state
- **Context**: Frontend state management

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up automatic deployment on push to main branch

### Environment Variables for Vercel
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured cross-origin resource sharing
- **Input Validation**: Request body validation
- **Webhook Security**: Stripe webhook signature verification
- **Rate Limiting**: Implemented for sensitive endpoints

## 📊 Monitoring & Logging

- **Console Logging**: Basic logging for development
- **Error Handling**: Comprehensive error handling middleware
- **Database Connection Monitoring**: MongoDB connection status
- **Payment Webhook Logging**: Stripe webhook event logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/api/docs`
- Review the code comments for implementation details

## 🔗 Related Projects

- **Frontend**: [Classroom Dashboard Frontend](../frontend/)
- **API Documentation**: [Live API Docs](https://class-room-backend-nodejs-stop.vercel.app/api/docs)

---

Built with ❤️ using Node.js and Express.js