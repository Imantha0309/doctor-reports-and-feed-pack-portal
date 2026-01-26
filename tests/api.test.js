const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');

// Test database setup
const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ec-healthcare-test';

beforeAll(async () => {
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clean up test data before each test
  await User.deleteMany({});
  await Doctor.deleteMany({});
  await Report.deleteMany({});
  await Feedback.deleteMany({});
  await Appointment.deleteMany({});
});

describe('Authentication Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
        userType: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
        userType: 'user'
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Credentials');
    });
  });
});

describe('User Routes', () => {
  let authToken;
  let adminToken;

  beforeEach(async () => {
    // Create regular user
    const user = new User({
      name: 'Test User',
      email: 'user@example.com',
      phone: '1234567890',
      password: 'password123',
      userType: 'user'
    });
    await user.save();

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567891',
      password: 'password123',
      userType: 'admin'
    });
    await admin.save();

    // Get tokens
    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    authToken = userResponse.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminResponse.body.token;
  });

  describe('GET /api/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('x-auth-token', adminToken)
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('should not allow non-admin to get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('x-auth-token', authToken)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Admins only.');
    });
  });

  describe('GET /api/users/count', () => {
    it('should get user count', async () => {
      const response = await request(app)
        .get('/api/users/count')
        .set('x-auth-token', adminToken)
        .expect(200);

      expect(response.body.count).toBe(2);
    });
  });
});

describe('Doctor Routes', () => {
  let authToken;

  beforeEach(async () => {
    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      password: 'password123',
      userType: 'admin'
    });
    await admin.save();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    authToken = response.body.token;
  });

  describe('POST /api/doctors', () => {
    it('should create a new doctor', async () => {
      const doctorData = {
        name: 'Dr. John Doe',
        age: 35,
        email: 'doctor@example.com',
        specialization: 'Cardiology',
        professionalSummary: 'Experienced cardiologist with 10 years of practice.',
        licenses: 'MD, Cardiology Board Certified',
        clinicalFocus: 'Heart Disease Prevention',
        hospitalAffiliations: 'City General Hospital',
        languages: 'English, Spanish',
        contactAvailability: 'Monday-Friday 9AM-5PM'
      };

      const response = await request(app)
        .post('/api/doctors')
        .set('x-auth-token', authToken)
        .send(doctorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Doctor created successfully');
    });
  });

  describe('GET /api/doctors', () => {
    beforeEach(async () => {
      // Create test doctors
      const doctor1 = new Doctor({
        name: 'Dr. John Doe',
        age: 35,
        email: 'doctor1@example.com',
        specialization: 'Cardiology',
        professionalSummary: 'Experienced cardiologist.'
      });
      await doctor1.save();

      const doctor2 = new Doctor({
        name: 'Dr. Jane Smith',
        age: 40,
        email: 'doctor2@example.com',
        specialization: 'Neurology',
        professionalSummary: 'Experienced neurologist.'
      });
      await doctor2.save();
    });

    it('should get all doctors', async () => {
      const response = await request(app)
        .get('/api/doctors')
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });
});

describe('Appointment Routes', () => {
  let authToken;
  let doctorId;

  beforeEach(async () => {
    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      password: 'password123',
      userType: 'admin'
    });
    await admin.save();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    authToken = response.body.token;

    // Create test doctor
    const doctor = new Doctor({
      name: 'Dr. John Doe',
      age: 35,
      email: 'doctor@example.com',
      specialization: 'Cardiology',
      professionalSummary: 'Experienced cardiologist.'
    });
    await doctor.save();
    doctorId = doctor._id;
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        patient: {
          name: 'Patient Name',
          email: 'patient@example.com',
          phone: '1234567890',
          age: 30,
          gender: 'male'
        },
        doctor: doctorId,
        appointmentDate: new Date('2024-12-01'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('x-auth-token', authToken)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment scheduled successfully');
    });
  });

  describe('GET /api/appointments/doctor/:doctorId/availability', () => {
    it('should get doctor availability', async () => {
      const response = await request(app)
        .get(`/api/appointments/doctor/${doctorId}/availability`)
        .query({ date: '2024-12-01' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

describe('Search Routes', () => {
  let authToken;

  beforeEach(async () => {
    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      password: 'password123',
      userType: 'admin'
    });
    await admin.save();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    authToken = response.body.token;

    // Create test data
    const doctor = new Doctor({
      name: 'Dr. John Doe',
      age: 35,
      email: 'doctor@example.com',
      specialization: 'Cardiology',
      professionalSummary: 'Experienced cardiologist.'
    });
    await doctor.save();

    const feedback = new Feedback({
      patientName: 'Patient Name',
      doctor: doctor._id,
      rating: 5,
      about: 'Great doctor, very helpful.'
    });
    await feedback.save();
  });

  describe('GET /api/search/global', () => {
    it('should perform global search', async () => {
      const response = await request(app)
        .get('/api/search/global')
        .set('x-auth-token', authToken)
        .query({ q: 'John' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
    });

    it('should require minimum search length', async () => {
      const response = await request(app)
        .get('/api/search/global')
        .set('x-auth-token', authToken)
        .query({ q: 'J' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/search/advanced', () => {
    it('should perform advanced search', async () => {
      const response = await request(app)
        .get('/api/search/advanced')
        .set('x-auth-token', authToken)
        .query({
          entity: 'doctors',
          searchTerm: 'John',
          filters: JSON.stringify({})
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});
