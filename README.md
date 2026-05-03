# EC Healthcare Portal 
<img width="1867" height="1008" alt="image" src="https://github.com/user-attachments/assets/d0f21099-4bba-4d68-81bf-458e0e88b36d" />
<img width="1850" height="910" alt="image" src="https://github.com/user-attachments/assets/070b8284-db12-4484-b890-2652af833f1e" />
<img width="1855" height="912" alt="image" src="https://github.com/user-attachments/assets/0738f690-d742-452e-896a-a3baa097bf92" />
<img width="1865" height="909" alt="image" src="https://github.com/user-attachments/assets/94677382-25d3-43ed-bdd7-d5711df53ce8" />
<img width="1871" height="909" alt="image" src="https://github.com/user-attachments/assets/0f496f93-a1fb-4c85-a7f7-565c5238eb01" />





A comprehensive healthcare management portal with dashboard, user management, doctor profiles, medical reports, and patient feedbacks. Built with Node.js, Express, MongoDB, and modern frontend technologies.

## 🚀 Features

### ✅ Complete CRUD Operations
- **User Management**: Create, read, update, delete users (admin, doctor, user types)
- **Doctor Profiles**: Comprehensive doctor management with specializations
- **Medical Reports**: Patient report management with file attachments
- **Patient Feedbacks**: Rating and review system for doctors

### 📊 Interactive Dashboard
- **Real-time Analytics**: KPI tiles, charts, and statistics
- **Data Visualizations**: User breakdown, reports timeline, doctor ratings
- **Recent Activity**: Latest users, doctors, reports, and feedbacks
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for passwords
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach
- **EC Healthcare Branding**: Consistent blue/white theme
- **Interactive Elements**: Hover states, animations, transitions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Express-validator** - Input validation
- **Multer** - File uploads
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **JavaScript ES6+** - Modern JavaScript features
- **Chart.js** - Data visualizations
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📁 Project Structure

```
ec-healthcare-portal/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── env.example               # Environment variables template
├── models/                   # Database models
│   ├── User.js              # User schema
│   ├── Doctor.js            # Doctor schema
│   ├── Report.js            # Report schema
│   └── Feedback.js          # Feedback schema
├── routes/                   # API routes
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User CRUD routes
│   ├── doctors.js           # Doctor CRUD routes
│   ├── reports.js           # Report CRUD routes
│   ├── feedbacks.js         # Feedback CRUD routes
│   └── dashboard.js         # Dashboard analytics routes
├── middleware/               # Custom middleware
│   └── auth.js              # JWT authentication middleware
├── public/                   # Static files
│   ├── index.html           # Landing page
│   ├── dashboard.html       # Admin dashboard
│   ├── admin-users.html     # User management
│   ├── admin-reports.html   # Report management
│   ├── doctor-profile-management.html # Doctor profile form
│   ├── doctors.html         # Doctors listing
│   ├── feedback.html        # Feedback management
│   ├── js/                  # JavaScript files
│   │   ├── api-client.js    # API client
│   │   ├── dashboard-script.js
│   │   ├── admin-script.js
│   │   └── doctor-profile-script.js
│   └── css/                 # Stylesheets
│       ├── styles.css
│       ├── dashboard-styles.css
│       ├── admin-styles.css
│       └── doctor-profile-styles.css
└── uploads/                  # File uploads directory
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ec-healthcare-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ec-healthcare
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:8000
   ```

4. **Start MongoDB**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - **Backend API**: http://localhost:5000/api
   - **Frontend**: http://localhost:8000
   - **Dashboard**: http://localhost:8000/dashboard.html

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/count` - Get user count
- `GET /api/users/breakdown` - Get user type breakdown

### Doctor Management
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/top-rated` - Get top rated doctors

### Report Management
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report by ID
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/timeseries` - Get reports time series

### Feedback Management
- `GET /api/feedbacks` - Get all feedbacks
- `GET /api/feedbacks/:id` - Get feedback by ID
- `POST /api/feedbacks` - Create new feedback
- `PUT /api/feedbacks/:id` - Update feedback
- `DELETE /api/feedbacks/:id` - Delete feedback
- `GET /api/feedbacks/recent` - Get recent feedbacks
- `GET /api/feedbacks/top-doctors` - Get top rated doctors
- `GET /api/feedbacks/ratings-distribution` - Get ratings distribution

### Dashboard Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/charts/users-over-time` - Get users over time
- `GET /api/dashboard/charts/doctor-specializations` - Get specializations
- `GET /api/dashboard/charts/feedback-trends` - Get feedback trends

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:8000

# Database
MONGODB_URI=mongodb://localhost:27017/ec-healthcare

# Security
JWT_SECRET=your-super-secret-jwt-key
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Models

#### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String (required),
  password: String (required),
  userType: String (enum: ['admin', 'doctor', 'user']),
  isActive: Boolean,
  profileImage: String,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Doctor Model
```javascript
{
  name: String (required),
  age: Number (required, 25-80),
  email: String (required, unique),
  specialization: String (required),
  summary: String (required),
  licenses: String (required),
  clinicalFocus: String (required),
  affiliations: String (required),
  languages: String (required),
  contact: String (required),
  ratings: {
    averageRating: Number,
    totalReviews: Number
  },
  profileImage: String,
  isActive: Boolean,
  userId: ObjectId (ref: User)
}
```

## 🧪 Testing

### Manual Testing
1. **User Registration/Login**
   - Register a new user
   - Login with credentials
   - Verify JWT token is stored

2. **CRUD Operations**
   - Create new users, doctors, reports, feedbacks
   - Read data with pagination and filtering
   - Update existing records
   - Delete records with confirmation

3. **Dashboard Functionality**
   - Verify KPI tiles show correct data
   - Check charts render properly
   - Test responsive design on different screen sizes

### API Testing with Postman
Import the API collection and test all endpoints:
- Authentication flow
- CRUD operations
- Error handling
- Validation

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   ```

2. **Build and Start**
   ```bash
   npm install --production
   npm start
   ```

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name ec-healthcare
   pm2 startup
   pm2 save
   ```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Best Practices

### Implemented Security Features
- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Secure cross-origin requests
- **Helmet**: Security headers
- **SQL Injection Prevention**: Mongoose ODM protection

### Additional Recommendations
- Use HTTPS in production
- Implement API versioning
- Add request logging
- Set up monitoring and alerting
- Regular security audits
- Database backup strategy

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill the process
   kill -9 <PID>
   ```

3. **JWT Token Issues**
   - Check JWT_SECRET in .env file
   - Verify token format in Authorization header
   - Check token expiration

4. **CORS Errors**
   - Verify FRONTEND_URL in .env
   - Check CORS configuration in server.js

## 📈 Performance Optimization

### Backend Optimizations
- Database indexing on frequently queried fields
- Pagination for large datasets
- Caching for frequently accessed data
- Compression middleware
- Rate limiting

### Frontend Optimizations
- Lazy loading for images
- Code splitting
- Minification of CSS/JS
- CDN for static assets
- Service worker for caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with complete CRUD functionality
- **v1.1.0** - Added authentication and security features
- **v1.2.0** - Enhanced dashboard with real-time analytics
- **v1.3.0** - Added file upload and image management

---

**Built with ❤️ for EC Healthcare**
