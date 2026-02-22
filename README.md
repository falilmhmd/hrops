# HRMS Backend - Human Resource Management System

A multi-tenant, role-based Human Resource Management System built with **NestJS** and **PostgreSQL**.

## Tech Stack

- **Backend:** NestJS (Node.js)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT + OAuth (Microsoft/Slack)
- **Authorization:** Role-Based Access Control (RBAC)

## Project Setup

```bash
$ npm install
```

## Compile and Run

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Project Structure

```
src/
├── common/                 # Shared utilities, guards, interceptors
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Common DTOs
│   ├── enums/              # Enums (Role, AuditAction)
│   ├── exceptions/         # Custom exceptions
│   ├── filters/            # Exception filters
│   ├── guards/             # Auth guards
│   ├── interceptors/       # Response interceptors
│   └── pipes/              # Validation pipes
├── database/               # Database configuration
│   └── entities/           # TypeORM entities
├── modules/                # Feature modules
│   ├── audit/              # Audit logging
│   ├── auth/               # Authentication
│   ├── employee/           # Employee management
│   ├── mail/               # Email services
│   └── example/            # Example module
└── main.ts                 # Application entry point
```

## Employee Management

### Employee Add Screen Structure

The employee creation form is organized into 4 sections:

#### Section 1: Personal Information
| Field | Type | Required |
|-------|------|----------|
| First Name | Text | Yes |
| Last Name | Text | Yes |
| Mobile Number | Text | No |
| Email Address | Email | Yes |
| Date of Birth | Date | No |
| Marital Status | Select | No |
| Gender | Select | No |
| Nationality | Text | No |
| City | Text | No |
| State | Text | No |
| Zipcode | Text | No |

#### Section 2: Professional Information
| Field | Type | Required |
|-------|------|----------|
| Employee ID | Auto/Manual | No |
| Username | Text | No |
| Employee Type | Select | No |
| Official Email Address | Email | No |
| Department | Select | No |
| Designation | Text | No |
| Working Days | Text | No |
| Joining Date | Date | No |
| Office Location | Text | No |

#### Section 3: Documents
| Field | Type | Required |
|-------|------|----------|
| Appointment Letter | File Upload | No |
| Salary Slips | File Upload | No |
| Relieving Letter | File Upload | No |
| Experience Letter | File Upload | No |
| Certificate Letter | File Upload | No |

#### Section 4: Account Access
| Field | Type | Required |
|-------|------|----------|
| Email Address | Email | Yes (auto-filled) |
| Slack ID | Text | No |
| Skype ID | Text | No |
| GitHub ID | Text | No |

### API Endpoints

#### Employee Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/employees` | Create a new employee |
| GET | `/employees` | Get all employees (with filters) |
| GET | `/employees/:id` | Get employee by ID |
| PATCH | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Soft delete employee |

### Business Rules

| Rule ID | Description |
|---------|-------------|
| BR-EMP-ADMIN-001 | Email must be unique |
| BR-EMP-ADMIN-002 | Employee must belong to one department |
| BR-EMP-ADMIN-003 | Hierarchy must not create circular reporting |
| BR-EMP-ADMIN-004 | Soft delete only (data retained) |
| BR-EMP-ADMIN-005 | Deleted employees cannot login |
| BR-EMP-ADMIN-006 | Historical attendance & payroll data preserved |
| BR-EMP-ADMIN-007 | Documents can be uploaded as files or URLs |
| BR-EMP-ADMIN-008 | Official email can be different from personal email |

## Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Platform-level administrator |
| HR_ADMIN | Organization-level administrator |
| REPORTING_MANAGER | Limited admin role |
| EMPLOYEE | Standard employee |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=hrms

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

## Documentation

For detailed requirements, see [HRMS_REQUIREMENTS.md](./HRMS_REQUIREMENTS.md)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).