# 🏋️ Gym Management System - Backend

A microservices-based backend system for managing gym memberships, classes, and facility bookings.

## 🚀 Features

- **Authentication Service**: User registration, login, and JWT token management
- **Member Management**: Track member profiles and memberships
- **Class Scheduling**: Manage fitness classes and trainer schedules
- **Facility Booking**: Handle gym equipment and room reservations
- **Billing & Payments**: Process membership fees and payments
- **Attendance Management**: Track gym attendance and member check-ins
- **Notification System**: Send SMS and email notifications

## 🏗 Project Structure

```
Gym_management_system_backend/
├── auth-service/           # Authentication and authorization service
├── gym-service/            # Gym management service
├── user-service/           # User management service
├── payment-service/        # Payment processing service
├── attendance-service/     # Attendance tracking service
├── notification-service/   # Notification service
├── docker-compose.yml      # Docker compose configuration
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation
```

## 🛠 Setup

1. **Prerequisites**
   - Node.js 18+
   - Docker & Docker Compose
   - npm or yarn

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/Gym_management_system_backend.git
   cd Gym_management_system_backend

   # Install dependencies for each service
   cd auth-service
   npm install
   
   # Copy .env.example to .env and configure
   cp .env.example .env
   ```

3. **Running with Docker**
   ```bash
   # Start all services
   docker-compose up -d
   ```

## 📚 API Documentation

API documentation is available at `/api-docs` when running the service locally.

## 🧪 Testing

```bash
# Run tests
cd auth-service
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- [Your Name](https://github.com/yourusername)
