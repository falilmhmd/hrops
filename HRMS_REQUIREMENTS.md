# HRMS – Human Resource Management System
## Phase 1 Requirements Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Portal (Phase 1)](#admin-portal-phase-1)
   - [Admin Portal Journey Overview](#411-admin-portal-journey-overview)
   - [Authentication & Authorization](#412-authentication--authorization)
   - [Organization Management](#413-organization-management)
   - [Employee Management](#414-employee-management)
   - [Leave Configuration](#415-leave-configuration)
   - [Holiday & Shift Configuration](#416-holiday--shift-configuration)
   - [Leave & Attendance Management](#417-leave--attendance-management)
   - [Expense & Request Management](#418-expense--request-management)
   - [Notification & Event Management](#419-notification--event-management)
   - [Audit & Security](#4110-audit--security)
   - [Non-Functional Requirements – Admin](#non-functional-requirements--admin-portal)
3. [Employee Portal (Phase 1)](#employee-portal-phase-1)
   - [Employee Portal Journey Overview](#421-employee-portal-journey-overview)
   - [Authentication](#422-authentication)
   - [Employee Dashboard](#423-employee-dashboard)
   - [Profile Management](#424-profile-management)
   - [Attendance Management](#425-attendance-management)
   - [Leave Management](#426-leave-management)
   - [Events & Calendar](#427-events--calendar)
   - [Notifications](#428-notifications)
   - [Expense Management](#429-expense-management)
   - [Salary Slip](#4210-salary-slip)
   - [HR Requests](#4211-hr-requests)
   - [Early Out](#4212-early-out-optional-feature)
   - [Non-Functional Requirements – Employee](#non-functional-requirements--employee-portal)

---

## Overview

The HRMS platform is a multi-tenant, role-based Human Resource Management System built with **NestJS** and **PostgreSQL**. Phase 1 covers the Admin Portal and Employee Portal with core HR operations.

**Tech Stack:**
- **Backend:** NestJS (Node.js)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT + OAuth (Microsoft/Slack)
- **Authorization:** Role-Based Access Control (RBAC)

---

## Admin Portal (Phase 1)

### 4.1.1 Admin Portal Journey Overview

#### Actors
| Actor | Description |
|-------|-------------|
| Super Admin | Platform-level administrator |
| HR Admin | Organization-level administrator |
| Reporting Manager | Limited admin role |
| System | HRMS Application |

#### Trigger
Organization subscribes to HRMS platform and Admin account is provisioned.

#### Goal
Enable HR/Admin to configure organization structure, manage employees, define policies, and control approvals.

#### Preconditions
- Organization account created
- Admin account provisioned
- Subscription active
- Role-based access control (RBAC) enabled

#### Success Criteria
- Admin can log in securely
- Organization profile configured
- Employees created and assigned hierarchy
- Leave policies configured
- Attendance and approval workflows operational
- Notifications and events managed successfully

#### Admin Journey Flow
1. Admin signs up / logs in
2. Admin completes organization profile
3. Admin configures roles & permissions
4. Admin adds employees
5. Admin sets hierarchy (Reporting Managers)
6. Admin configures leave policies and shifts
7. Admin configures holiday calendar
8. Admin monitors attendance
9. Admin manages leave approvals
10. Admin manages expenses & requests
11. Admin publishes notifications & events

---

### 4.1.2 Authentication & Authorization

#### FR-ADMIN-AUTH-001: Admin Sign Up
**Priority:** Must Have (M)

**User Story:**
> As a Super Admin, I want to create an Admin account, so that the organization can manage its HR operations.

**Acceptance Criteria:**

Given I am a Super Admin  
When I enter:
- Organization Name
- Admin Name
- Email
- Phone
- Password

Then the system should:
- Create organization record
- Create Admin user
- Assign role "HR Admin"
- Send verification email
- Log event in audit trail

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-ADMIN-001 | Organization name must be unique |
| BR-ADMIN-002 | Email must be unique across platforms |
| BR-ADMIN-003 | Email verification mandatory before login |

---

#### FR-ADMIN-AUTH-002: Role-Based Login (RBAC)
**Priority:** Must Have (M)

**Roles:**
- Super Admin
- HR Admin
- Reporting Manager

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-ADMIN-004 | Role determines system access |
| BR-ADMIN-005 | Only Super Admin can delete organization |
| BR-ADMIN-006 | HR Admin cannot access other organizations' data |

---

### 4.1.3 Organization Management

#### FR-ADMIN-ORG-001: Organization Profile Management
**Priority:** Must Have (M)

**Description:** Admin can configure:
- Company Name
- Logo
- Address
- Industry
- Contact details
- Working days
- Default shift timings

**Acceptance Criteria:**

Given I am logged in as HR Admin  
When I update organization profile  
Then changes should reflect across employee dashboard

---

### 4.1.4 Employee Management

#### FR-ADMIN-EMP-001: Add Employee
**Priority:** Must Have (M)

**User Story:**
> As an HR Admin, I want to create employee accounts, so that employees can access the HRMS.

**Employee Add Screen Sections:**

The employee creation form is organized into 4 sections:

##### Section 1: Personal Information
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

##### Section 2: Professional Information
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

##### Section 3: Documents
| Field | Type | Required |
|-------|------|----------|
| Appointment Letter | File Upload | No |
| Salary Slips | File Upload | No |
| Relieving Letter | File Upload | No |
| Experience Letter | File Upload | No |
| Certificate Letter | File Upload | No |

##### Section 4: Account Access
| Field | Type | Required |
|-------|------|----------|
| Email Address | Email | Yes (auto-filled from Personal Info) |
| Slack ID | Text | No |
| Skype ID | Text | No |
| GitHub ID | Text | No |

**Acceptance Criteria:**

Given I enter valid employee details  
When I click Save  
Then system should:
- Create employee record
- Assign reporting manager (if specified)
- Generate login credentials
- Send invitation email

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-EMP-ADMIN-001 | Email must be unique |
| BR-EMP-ADMIN-002 | Employee must belong to one department |
| BR-EMP-ADMIN-003 | Hierarchy must not create circular reporting |
| BR-EMP-ADMIN-007 | Documents can be uploaded as files or URLs |
| BR-EMP-ADMIN-008 | Official email can be different from personal email |

---

#### FR-ADMIN-EMP-002: Edit / Delete Employee
**Priority:** Must Have (M)

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-EMP-ADMIN-004 | Soft delete only (data retained) |
| BR-EMP-ADMIN-005 | Deleted employees cannot login |
| BR-EMP-ADMIN-006 | Historical attendance & payroll data preserved |

---

### 4.1.5 Leave Configuration

#### FR-ADMIN-LEAVE-CONFIG-001: Create Leave Types
**Priority:** Must Have (M)

**Leave Types:**
- Casual Leave
- Medical Leave
- Loss of Pay (LOP)
- Optional Leave

**Configurable Fields:**
| Field | Description |
|-------|-------------|
| Annual Allocation | Number of days per year |
| Carry Forward Allowed | Boolean |
| Max Consecutive Days | Integer |
| Approval Required | Boolean |
| Applicable Roles | Role list |

**Acceptance Criteria:**

Given I create leave type  
When I assign 12 days annually  
Then employees under that role should receive 12 days balance

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-LEAVE-001 | Leave accrual monthly or yearly |
| BR-LEAVE-002 | LOP has no balance restriction |
| BR-LEAVE-003 | Carry forward limit configurable |

---

### 4.1.6 Holiday & Shift Configuration

#### FR-ADMIN-SHIFT-001: Configure Shifts
Admin can:
- Define shift start & end time
- Grace period
- Overtime rules

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-SHIFT-001 | Late marking auto-trigger after grace time |
| BR-SHIFT-002 | Overtime calculated after shift end |

---

#### FR-ADMIN-HOLIDAY-001: Holiday Calendar
Admin can:
- Add public holidays
- Add optional holidays
- Assign by location

---

### 4.1.7 Leave & Attendance Management

#### FR-ADMIN-LEAVE-MGMT-001: Leave Approval
Admin/Manager can:
- Approve
- Reject
- Request modification

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-LEAVE-004 | Leave deducted only after approval |
| BR-LEAVE-005 | Rejected leave restores balance |

---

#### FR-ADMIN-ATT-001: Attendance Monitoring
Admin can:
- View attendance summary
- Filter by department
- Regularize attendance

---

### 4.1.8 Expense & Request Management

#### FR-ADMIN-EXP-001: Expense Approval
Admin can:
- View expense details
- Approve/Reject
- Mark reimbursement status

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-EXP-001 | Reimbursement cannot exceed submitted amount |
| BR-EXP-002 | Status must be tracked (Pending/Approved/Paid) |

---

#### FR-ADMIN-REQ-001: HR Request Management
Admin can:
- View employee requests
- Respond / Close ticket

---

### 4.1.9 Notification & Event Management

#### FR-ADMIN-NOTIF-001: Send Notifications
Admin can:
- Send company-wide notifications
- Send department-specific messages

---

#### FR-ADMIN-EVENT-001: Manage Events
Admin can:
- Create event
- Define date & location
- Mark event as mandatory/optional

---

### 4.1.10 Audit & Security

#### FR-ADMIN-AUDIT-001: Audit Logs
System shall log:
- Login attempts
- Employee creation
- Leave approvals
- Policy changes

---

### Non-Functional Requirements – Admin Portal

| NFR ID | Requirement |
|--------|-------------|
| NFR-ADMIN-001 | Role-based access enforced at API level |
| NFR-ADMIN-002 | Data encrypted at rest |
| NFR-ADMIN-003 | System response < 2 seconds |
| NFR-ADMIN-004 | All critical actions logged |
| NFR-ADMIN-005 | Multi-tenant data isolation |

---

### Phase 1 Admin Scope Summary

| Feature | Status |
|---------|--------|
| Organization Setup | ✅ In Scope |
| Employee Management | ✅ In Scope |
| Leave Configuration | ✅ In Scope |
| Attendance Monitoring | ✅ In Scope |
| Expense Approval | ✅ In Scope |
| Notification & Events | ✅ In Scope |
| Role-Based Access | ✅ In Scope |

---

## Employee Portal (Phase 1)

### 4.2.1 Employee Portal Journey Overview

#### Actors
| Actor | Description |
|-------|-------------|
| Employee | Primary user |
| Reporting Manager | Approver |
| HR Admin | Support |
| HRMS System | Application |

#### Trigger
Employee receives HRMS login credentials after being added by Admin.

#### Goal
Enable employees to manage their attendance, leave, profile, expenses, salary slips, and HR interactions digitally.

#### Preconditions
- Employee account exists in system
- Employee assigned a role & reporting manager
- Leave policies configured
- Holiday calendar configured
- Shift assigned

#### Success Criteria
- Employee logs in successfully
- Attendance entries recorded correctly
- Leave application workflow functions
- Employee can submit expenses & requests
- Payslips accessible

#### Employee Journey Flow
1. Employee logs in via SSO or credentials
2. Employee lands on dashboard
3. Employee completes profile setup
4. Employee performs daily check-in/check-out
5. Employee tracks attendance via calendar
6. Employee applies for leave
7. Employee submits expense claim
8. Employee views/downloads payslip
9. Employee raises HR request if needed

---

### 4.2.2 Authentication

#### FR-EMP-AUTH-001: Employee Login
**Priority:** Must Have (M)

**User Story:**
> As an Employee, I want to log in securely using SSO or credentials, so that I can access my HR services.

**Login Methods:**
- Microsoft Teams OAuth
- Slack OAuth
- Username & Password

**Acceptance Criteria:**

Given I am a registered employee  
When I select Microsoft or Slack login  
Then system authenticates via OAuth  
And redirects to dashboard

Given I enter valid credentials  
Then login should succeed

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-EMP-AUTH-001 | Email must be verified |
| BR-EMP-AUTH-002 | Account locks after 5 failed attempts |
| BR-EMP-AUTH-003 | Session timeout after inactivity |

---

### 4.2.3 Employee Dashboard

#### FR-EMP-DASH-001: Dashboard Overview
**Priority:** Must Have (M)

**Dashboard Widgets:**
- Today's attendance status
- Upcoming events
- Leave balance summary
- Attendance analytics

**Acceptance Criteria:**

Given I log in  
Then dashboard should display attendance and leave summary

---

### 4.2.4 Profile Management

#### FR-EMP-PROFILE-001: Manage Personal Profile
**Priority:** Must Have (M)

**Sections:**
- Basic Details
- Address
- Contact Info
- Family Details
- Experience
- Education
- Bank Details

**Acceptance Criteria:**

Given I update profile data  
Then changes should be saved  
And HR should be able to view updates

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-PROFILE-001 | Bank details encrypted |
| BR-PROFILE-002 | Certain fields editable only by HR |
| BR-PROFILE-003 | All changes logged |

---

### 4.2.5 Attendance Management

#### FR-EMP-ATT-001: Daily Check-In / Check-Out
**Priority:** Must Have (M)

**Features:**
- Check-In
- Check-Out
- Work Mode (WFH / WFO)
- Location capture
- Login/Logout history

**Acceptance Criteria:**

Given I click Check-In  
Then system logs timestamp & location

Given I check out  
Then total working hours calculated

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-ATT-EMP-001 | Only one check-in per day |
| BR-ATT-EMP-002 | Early Out requires approval (if enabled) |
| BR-ATT-EMP-003 | Work mode must be selected |

---

#### FR-EMP-ATT-002: Attendance Calendar
Employee can view:
- Present/Absent days
- Leave days
- Holidays
- Late marks

---

### 4.2.6 Leave Management

#### FR-EMP-LEAVE-001: Apply Leave
**Priority:** Must Have (M)

**Fields:**
| Field | Type |
|-------|------|
| Leave type | Select |
| From/To date | Date Range |
| Reason | Text |
| Attachment | File (optional) |

**Acceptance Criteria:**

Given I apply leave  
When balance is sufficient  
Then request goes to reporting manager

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-LEAVE-EMP-001 | Leave deducted only after approval |
| BR-LEAVE-EMP-002 | Overlapping leave not allowed |
| BR-LEAVE-EMP-003 | LOP allowed without balance |

---

#### FR-EMP-LEAVE-002: Leave History & Balance
Employee can:
- View leave balance
- Track leave status
- View leave history

---

### 4.2.7 Events & Calendar

#### FR-EMP-EVENT-001: View Events
Employee can:
- View upcoming events
- View past events
- Add reminders

---

#### FR-EMP-CAL-001: Personal Calendar
Calendar shows:
- Attendance
- Leaves
- Holidays
- Company events

---

### 4.2.8 Notifications

#### FR-EMP-NOTIF-001: Notifications Center
Employee receives:
- Leave approval/rejection
- HR announcements
- Event reminders
- Expense status updates

---

### 4.2.9 Expense Management

#### FR-EMP-EXP-001: Submit Expense Claim
**Priority:** Should Have (S)

**Fields:**
| Field | Type |
|-------|------|
| Expense category | Select |
| Amount | Number |
| Date | Date |
| Receipt upload | File |

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-EXP-EMP-001 | Receipt mandatory |
| BR-EXP-EMP-002 | Cannot edit after submission |

---

#### FR-EMP-EXP-002: Track Expense Status
Employee can view:
- Pending
- Approved
- Rejected
- Reimbursed

---

### 4.2.10 Salary Slip

#### FR-EMP-SAL-001: View Salary Slip
**Priority:** Must Have (M)

Employee can:
- View payslip by month
- Download PDF

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-SAL-EMP-001 | Payslips are read-only |
| BR-SAL-EMP-002 | Visible only after payroll published |

---

### 4.2.11 HR Requests

#### FR-EMP-REQ-001: Raise HR Request
Employee can submit:
- Document request
- Salary clarification
- Policy queries
- General HR help

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-REQ-EMP-001 | Each request gets unique ticket ID |
| BR-REQ-EMP-002 | Status tracked (Open/In Progress/Closed) |

---

### 4.2.12 Early Out (Optional Feature)

#### FR-EMP-ATT-003: Early Out Request
Employee can request early exit.

**Business Rules:**
| Rule ID | Description |
|---------|-------------|
| BR-EARLY-001 | Must include reason |
| BR-EARLY-002 | Requires manager approval |
| BR-EARLY-003 | Impacts attendance hours |

---

### Non-Functional Requirements – Employee Portal

| NFR ID | Requirement |
|--------|-------------|
| NFR-EMP-001 | Mobile responsive |
| NFR-EMP-002 | Response time < 2 sec |
| NFR-EMP-003 | Data encrypted in transit |
| NFR-EMP-004 | 99% uptime |
| NFR-EMP-005 | Activity audit logging |

---

### Phase 1 Employee Scope Summary

| Feature | Status |
|---------|--------|
| Login & Security | ✅ In Scope |
| Profile Management | ✅ In Scope |
| Attendance Tracking | ✅ In Scope |
| Leave Management | ✅ In Scope |
| Events & Calendar | ✅ In Scope |
| Notifications | ✅ In Scope |
| Expense Submission | ✅ In Scope |
| Salary Slip Access | ✅ In Scope |
| HR Requests | ✅ In Scope |
| Early Out | ✅ In Scope (Optional) |

---

*Document Version: 1.0 | Phase: 1 | Last Updated: February 2026*
