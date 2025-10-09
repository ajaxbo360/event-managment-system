# Event Management System - Complete Documentation

Full-stack event management application with Laravel backend and React frontend.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Database Design](#database-design)
9. [API Endpoints](#api-endpoints)
10. [Middleware](#middleware)
11. [Policies](#policies)
12. [Notifications](#notifications)
13. [Scheduled Commands](#scheduled-commands)
14. [Laravel Nova](#laravel-nova)
15. [Testing](#testing)
16. [Troubleshooting](#troubleshooting)

---

## Overview

This is a comprehensive event management system that allows users to register, browse events, join/leave events, and receive email notifications. Administrators can manage events through the Laravel Nova admin panel.

---

## Features

- ✅ User registration and authentication
- ✅ Browse and join events
- ✅ Admin panel for event management (Laravel Nova)
- ✅ Email notifications (confirmation & reminders)
- ✅ Conflict detection for overlapping events
- ✅ Capacity management with waitlist
- ✅ Role-based access control
- ✅ Queued email processing
- ✅ Daily reminder notifications
- ✅ Authorization policies

---

## Tech Stack

**Backend:** Laravel 11 + Laravel Nova + MySQL  
**Frontend:** React 18  
**Authentication:** Laravel Sanctum  
**Queue:** Database driver  
**Email:** SMTP (Mailtrap for development)

---

## Prerequisites

- PHP >= 8.1
- Composer >= 2.0
- Node.js >= 18
- MySQL >= 8.0 (or SQLite)
- Laravel Nova license (optional)

---

## Quick Start

### Backend Setup (Quick)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Backend runs on:** http://localhost:8000

### Frontend Setup (Quick)

```bash
cd frontend
npm install
npm start
```

**Frontend runs on:** http://localhost:3000

### Queue Worker (for emails)

```bash
cd backend
php artisan queue:work
```

---

## Backend Setup

### 1. Install Dependencies

```bash
composer install
```

### 2. Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

### 3. Configure Database

**Option A: SQLite (Development)**

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

```bash
touch database/database.sqlite
```

**Option B: MySQL**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create database:

```bash
mysql -u root -p
CREATE DATABASE event_management;
EXIT;
```

### 4. Run Migrations & Seeders

```bash
php artisan migrate --seed
```

**Seeded Data:**

- 1 admin: `admin@admin.com` / `admin@admin.com`
- 1 user: `user@user.com` / `user@user.com`
- 10 test users: `user1@example.com` to `user10@example.com` / `password`
- 104 events over next 30 days

### 5. Install Laravel Nova (Optional)

```bash
composer config repositories.nova '{"type": "composer", "url": "https://nova.laravel.com"}' --file composer.json
composer require laravel/nova
php artisan nova:install
php artisan migrate
```

### 6. Configure Mail

**Mailtrap (Testing):**

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_ADDRESS=noreply@eventmanagement.com
MAIL_FROM_NAME="Event Management"
```

**Log Driver (Alternative):**

```env
MAIL_MAILER=log
```

### 7. Setup Queue

```bash
php artisan queue:table
php artisan migrate
```

### 8. Start Servers

**Terminal 1 - Application:**

```bash
php artisan serve
```

**Terminal 2 - Queue Worker:**

```bash
php artisan queue:work
```

**Access:**

- API: http://localhost:8000/api
- Nova Admin: http://localhost:8000/nova

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm start
```

**Frontend runs on:** http://localhost:3000

### 4. Available Scripts

```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run eject      # Eject from Create React App
```

---

## Demo Accounts

### Admin (Nova panel at /nova)

- **Email:** admin@admin.com
- **Password:** admin@admin.com

### User (Frontend)

- **Email:** user@user.com
- **Password:** user@user.com

### Test Users

- **Email:** user1@example.com to user10@example.com
- **Password:** password

---

## Database Design

### Tables

**users**

```
id, name, email, password, role (admin/user), email_verified_at, timestamps
```

**events**

```
id, name, description, date_time, duration (minutes), location, 
capacity, waitlist_capacity, status (draft/published), timestamps
```

**event_user (pivot)**

```
id, event_id (FK), user_id (FK), status (confirmed/waitlist), 
registered_at, timestamps
UNIQUE(event_id, user_id)
```

**jobs** - Queue jobs  
**notifications** - User notifications

### Relationships

**Users ←→ Events (Many-to-Many through event_user)**

- User can join many events
- Event can have many users
- Pivot stores status and registered_at timestamp

---

## API Endpoints

### Authentication

#### Register

```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response 201:**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123..."
}
```

#### Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@user.com",
  "password": "user@user.com"
}
```

**Response 200:**

```json
{
  "user": {...},
  "token": "2|xyz789..."
}
```

#### Logout

```http
POST /api/logout
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "message": "Logged out successfully"
}
```

#### Get Current User

```http
GET /api/me
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

### Events

#### List Events

```http
GET /api/events
Authorization: Bearer {token}
```

**Query params:** `?start_date=2025-10-01&end_date=2025-10-31`

**Response 200:**

```json
[
  {
    "id": 1,
    "name": "Laravel Workshop",
    "description": "...",
    "date_time": "2025-10-15T10:00:00",
    "duration": 180,
    "location": "Conference Hall A",
    "capacity": 50,
    "waitlist_capacity": 10,
    "status": "published",
    "confirmed_count": 25,
    "waitlist_count": 3,
    "available_spots": 25,
    "available_waitlist_spots": 7,
    "is_full": false,
    "is_waitlist_full": false,
    "registration_status": null
  }
]
```

#### Get Event Details

```http
GET /api/events/{id}
Authorization: Bearer {token}
```

#### Join Event

```http
POST /api/events/{id}/join
Authorization: Bearer {token}
```

**Response 201 (Confirmed):**

```json
{
  "message": "Successfully registered for event. Confirmation email sent.",
  "registration_status": "confirmed",
  "event": {...}
}
```

**Response 201 (Waitlist):**

```json
{
  "message": "Event is full. You have been added to the waitlist. Confirmation email sent.",
  "registration_status": "waitlist",
  "event": {...}
}
```

**Response 400 (Already Registered):**

```json
{
  "message": "You are already registered for this event",
  "registration_status": "confirmed"
}
```

**Response 409 (Conflict):**

```json
{
  "message": "You have a scheduling conflict with another event",
  "conflicting_events": [
    {
      "id": 2,
      "name": "React Bootcamp",
      "date_time": "2025-10-15T12:00:00",
      "end_time": "2025-10-15T15:00:00"
    }
  ]
}
```

**Response 400 (Full):**

```json
{
  "message": "Event is full and waitlist is also full",
  "available_spots": 0,
  "available_waitlist_spots": 0
}
```

#### Leave Event

```http
POST /api/events/{id}/leave
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "message": "Successfully left the event"
}
```

#### My Events

```http
GET /api/my-events
Authorization: Bearer {token}
```

**Response 200:**

```json
[
  {
    "id": 1,
    "name": "Laravel Workshop",
    "description": "...",
    "date_time": "2025-10-15T10:00:00",
    "duration": 180,
    "location": "Conference Hall A",
    "capacity": 50,
    "registration_status": "confirmed",
    "registered_at": "2025-10-07T19:30:00"
  }
]
```

### API Summary Table

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Register new user |
| POST | /api/login | Login |
| POST | /api/logout | Logout |
| GET | /api/me | Get current user |
| GET | /api/events | List events |
| GET | /api/events/{id} | Get event details |
| POST | /api/events/{id}/join | Join event |
| POST | /api/events/{id}/leave | Leave event |
| GET | /api/my-events | User's events |

---

## Middleware

### CheckEventCapacity

**Applied to:** `POST /api/events/{id}/join`

**Checks:**

- Event capacity not exceeded
- Waitlist capacity not exceeded

**Returns:** 400 if both full.

### CheckScheduleConflict

**Applied to:** `POST /api/events/{id}/join`

**Checks:**

- User doesn't have conflicting confirmed events
- Compares event times and durations
- Returns conflicting events if found

**Returns:** 409 with conflicting event details.

---

## Policies

### EventPolicy

**Location:** `app/Policies/EventPolicy.php`

**Methods:**

- `viewAny()` - Can view event list
- `view()` - Can view specific event (admins see all, users see published only)
- `create()` - Can create events (admins only)
- `update()` - Can update events (admins only)
- `delete()` - Can delete events (admins only)
- `join()` - Can join events (users only, published events)
- `leave()` - Can leave events (if registered)

**Usage in controller:**

```php
$this->authorize('join', $event);
```

---

## Notifications

### EventRegistrationConfirmation

**Triggered:** When user joins event  
**Channels:** Mail + Database  
**Queue:** Yes (async)

**Content:**

- Event name and details
- Date, time, duration, location
- Action button to view event

### EventReminderNotification

**Triggered:** Daily at 8:00 AM (scheduled)  
**Channels:** Mail + Database  
**Queue:** Yes (async)

**Content:**

- Reminder that event is today
- Event details
- Hours until event starts

---

## Scheduled Commands

### Send Event Reminders

```bash
php artisan events:send-reminders
```

**Schedule:** Daily at 08:00 (configure in `routes/console.php`)

**What it does:**

- Finds all published events happening today
- Gets all confirmed users for each event
- Sends reminder notification to each user
- Logs execution summary

**Setup Cron:**

```bash
crontab -e
```

**Add:**

```
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

**Manual test:**

```bash
php artisan events:send-reminders
php artisan queue:work --once
```

---

## Laravel Nova

**Access:** http://localhost:8000/nova

**Login:**

- **Email:** admin@admin.com
- **Password:** admin@admin.com

**Features:**

- Event CRUD (create, edit, delete)
- View all events (draft + published)
- Manage user registrations
- Filter by status and date
- View registration counts (confirmed/waitlist)

**Resources:**

- `App\Nova\User` - User management
- `App\Nova\Event` - Event management with relationships

---

## Testing

### Manual Testing

1. Register at http://localhost:3000/register
2. Login with demo accounts
3. Browse events calendar
4. Join/leave events
5. Check Mailtrap for emails

### API Testing with cURL

**Register:**

```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123","password_confirmation":"password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@user.com","password":"user@user.com"}'
```

**List events:**

```bash
curl -X GET http://localhost:8000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Artisan Tinker Testing

```bash
php artisan tinker
```

**Test email:**

```php
$user = User::find(2);
$event = Event::find(1);
$user->notify(new \App\Notifications\EventRegistrationConfirmation($event));
exit
```

**Check queue:**

```bash
php artisan queue:work --once
```

**Test reminders:**

```php
// Create event for today
$event = Event::create([
    'name' => 'Test Event',
    'description' => 'Testing reminders',
    'date_time' => now()->addHours(2),
    'duration' => 120,
    'location' => 'Test Room',
    'capacity' => 50,
    'waitlist_capacity' => 10,
    'status' => 'published',
]);

$user = User::find(2);
$event->users()->attach($user->id, [
    'status' => 'confirmed',
    'registered_at' => now()
]);

exit
```

Then run:

```bash
php artisan events:send-reminders
php artisan queue:work
```

Check Mailtrap inbox!

---

## Seeders

### UserSeeder

**Creates:**

- 1 admin: `admin@admin.com` / `admin@admin.com`
- 1 user: `user@user.com` / `user@user.com`
- 10 test users: `user1@example.com` to `user10@example.com` / `password`

### EventSeeder

**Creates:**

- 100 random events distributed over next 30 days
- Duration variety: 2 hours (120 min) to 3 days (4320 min)
- Status mix: ~70% published, ~30% draft
- 4 intentional overlapping test events on same day:
  - Morning Workshop: 10:00-13:00
  - Midday Session: 12:00-15:00 (overlaps #1)
  - Afternoon Bootcamp: 14:00-17:00 (overlaps #2)
  - Evening Session: 18:00-21:00 (no overlap)

**Run seeders:**

```bash
php artisan db:seed
```

**Refresh database:**

```bash
php artisan migrate:fresh --seed
```

---

## Troubleshooting

### Clear Laravel Cache

```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Reset Database

```bash
php artisan migrate:fresh --seed
```

### CORS Errors

- Verify `backend/config/cors.php` includes `http://localhost:3000`
- Check `frontend/.env` has correct API URL

### Queue Not Processing

```bash
php artisan queue:restart
php artisan queue:work
```

### Email Not Sending

- Check Mailtrap credentials in `.env`
- Verify queue worker is running
- Check `storage/logs/laravel.log` for errors

### Frontend Not Connecting to Backend

- Ensure backend is running on `http://localhost:8000`
- Check `REACT_APP_API_URL` in `frontend/.env`
- Verify CORS configuration in Laravel

---

## Project Structure

```
event-management-system/
├── backend/              # Laravel API + Nova
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   ├── Notifications/
│   │   ├── Policies/
│   │   ├── Console/Commands/
│   │   └── Nova/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   ├── api.php
│   │   └── console.php
│   └── config/
└── frontend/             # React application
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── contexts/
    ├── public/
    └── package.json
```# Event Management System - Complete Documentation

Full-stack event management application with Laravel backend and React frontend.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Database Design](#database-design)
9. [API Endpoints](#api-endpoints)
10. [Middleware](#middleware)
11. [Policies](#policies)
12. [Notifications](#notifications)
13. [Scheduled Commands](#scheduled-commands)
14. [Laravel Nova](#laravel-nova)
15. [Testing](#testing)
16. [Troubleshooting](#troubleshooting)

---

## Overview

This is a comprehensive event management system that allows users to register, browse events, join/leave events, and receive email notifications. Administrators can manage events through the Laravel Nova admin panel.

---

## Features

- ✅ User registration and authentication
- ✅ Browse and join events
- ✅ Admin panel for event management (Laravel Nova)
- ✅ Email notifications (confirmation & reminders)
- ✅ Conflict detection for overlapping events
- ✅ Capacity management with waitlist
- ✅ Role-based access control
- ✅ Queued email processing
- ✅ Daily reminder notifications
- ✅ Authorization policies

---

## Tech Stack

**Backend:** Laravel 11 + Laravel Nova + MySQL  
**Frontend:** React 18  
**Authentication:** Laravel Sanctum  
**Queue:** Database driver  
**Email:** SMTP (Mailtrap for development)

---

## Prerequisites

- PHP >= 8.1
- Composer >= 2.0
- Node.js >= 18
- MySQL >= 8.0 (or SQLite)
- Laravel Nova license (optional)

---

## Quick Start

### Backend Setup (Quick)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Backend runs on:** http://localhost:8000

### Frontend Setup (Quick)

```bash
cd frontend
npm install
npm start
```

**Frontend runs on:** http://localhost:3000

### Queue Worker (for emails)

```bash
cd backend
php artisan queue:work
```

---

## Backend Setup

### 1. Install Dependencies

```bash
composer install
```

### 2. Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

### 3. Configure Database

**Option A: SQLite (Development)**

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

```bash
touch database/database.sqlite
```

**Option B: MySQL**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_management
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create database:

```bash
mysql -u root -p
CREATE DATABASE event_management;
EXIT;
```

### 4. Run Migrations & Seeders

```bash
php artisan migrate --seed
```

**Seeded Data:**

- 1 admin: `admin@admin.com` / `admin@admin.com`
- 1 user: `user@user.com` / `user@user.com`
- 10 test users: `user1@example.com` to `user10@example.com` / `password`
- 104 events over next 30 days

### 5. Install Laravel Nova (Optional)

```bash
composer config repositories.nova '{"type": "composer", "url": "https://nova.laravel.com"}' --file composer.json
composer require laravel/nova
php artisan nova:install
php artisan migrate
```

### 6. Configure Mail

**Mailtrap (Testing):**

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_ADDRESS=noreply@eventmanagement.com
MAIL_FROM_NAME="Event Management"
```

**Log Driver (Alternative):**

```env
MAIL_MAILER=log
```

### 7. Setup Queue

```bash
php artisan queue:table
php artisan migrate
```

### 8. Start Servers

**Terminal 1 - Application:**

```bash
php artisan serve
```

**Terminal 2 - Queue Worker:**

```bash
php artisan queue:work
```

**Access:**

- API: http://localhost:8000/api
- Nova Admin: http://localhost:8000/nova

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm start
```

**Frontend runs on:** http://localhost:3000

### 4. Available Scripts

```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run eject      # Eject from Create React App
```

---

## Demo Accounts

### Admin (Nova panel at /nova)

- **Email:** admin@admin.com
- **Password:** admin@admin.com

### User (Frontend)

- **Email:** user@user.com
- **Password:** user@user.com

### Test Users

- **Email:** user1@example.com to user10@example.com
- **Password:** password

---

## Database Design

### Tables

**users**

```
id, name, email, password, role (admin/user), email_verified_at, timestamps
```

**events**

```
id, name, description, date_time, duration (minutes), location, 
capacity, waitlist_capacity, status (draft/published), timestamps
```

**event_user (pivot)**

```
id, event_id (FK), user_id (FK), status (confirmed/waitlist), 
registered_at, timestamps
UNIQUE(event_id, user_id)
```

**jobs** - Queue jobs  
**notifications** - User notifications

### Relationships

**Users ←→ Events (Many-to-Many through event_user)**

- User can join many events
- Event can have many users
- Pivot stores status and registered_at timestamp

---

## API Endpoints

### Authentication

#### Register

```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response 201:**

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123..."
}
```

#### Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@user.com",
  "password": "user@user.com"
}
```

**Response 200:**

```json
{
  "user": {...},
  "token": "2|xyz789..."
}
```

#### Logout

```http
POST /api/logout
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "message": "Logged out successfully"
}
```

#### Get Current User

```http
GET /api/me
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

### Events

#### List Events

```http
GET /api/events
Authorization: Bearer {token}
```

**Query params:** `?start_date=2025-10-01&end_date=2025-10-31`

**Response 200:**

```json
[
  {
    "id": 1,
    "name": "Laravel Workshop",
    "description": "...",
    "date_time": "2025-10-15T10:00:00",
    "duration": 180,
    "location": "Conference Hall A",
    "capacity": 50,
    "waitlist_capacity": 10,
    "status": "published",
    "confirmed_count": 25,
    "waitlist_count": 3,
    "available_spots": 25,
    "available_waitlist_spots": 7,
    "is_full": false,
    "is_waitlist_full": false,
    "registration_status": null
  }
]
```

#### Get Event Details

```http
GET /api/events/{id}
Authorization: Bearer {token}
```

#### Join Event

```http
POST /api/events/{id}/join
Authorization: Bearer {token}
```

**Response 201 (Confirmed):**

```json
{
  "message": "Successfully registered for event. Confirmation email sent.",
  "registration_status": "confirmed",
  "event": {...}
}
```

**Response 201 (Waitlist):**

```json
{
  "message": "Event is full. You have been added to the waitlist. Confirmation email sent.",
  "registration_status": "waitlist",
  "event": {...}
}
```

**Response 400 (Already Registered):**

```json
{
  "message": "You are already registered for this event",
  "registration_status": "confirmed"
}
```

**Response 409 (Conflict):**

```json
{
  "message": "You have a scheduling conflict with another event",
  "conflicting_events": [
    {
      "id": 2,
      "name": "React Bootcamp",
      "date_time": "2025-10-15T12:00:00",
      "end_time": "2025-10-15T15:00:00"
    }
  ]
}
```

**Response 400 (Full):**

```json
{
  "message": "Event is full and waitlist is also full",
  "available_spots": 0,
  "available_waitlist_spots": 0
}
```

#### Leave Event

```http
POST /api/events/{id}/leave
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "message": "Successfully left the event"
}
```

#### My Events

```http
GET /api/my-events
Authorization: Bearer {token}
```

**Response 200:**

```json
[
  {
    "id": 1,
    "name": "Laravel Workshop",
    "description": "...",
    "date_time": "2025-10-15T10:00:00",
    "duration": 180,
    "location": "Conference Hall A",
    "capacity": 50,
    "registration_status": "confirmed",
    "registered_at": "2025-10-07T19:30:00"
  }
]
```

### API Summary Table

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Register new user |
| POST | /api/login | Login |
| POST | /api/logout | Logout |
| GET | /api/me | Get current user |
| GET | /api/events | List events |
| GET | /api/events/{id} | Get event details |
| POST | /api/events/{id}/join | Join event |
| POST | /api/events/{id}/leave | Leave event |
| GET | /api/my-events | User's events |

---

## Middleware

### CheckEventCapacity

**Applied to:** `POST /api/events/{id}/join`

**Checks:**

- Event capacity not exceeded
- Waitlist capacity not exceeded

**Returns:** 400 if both full.

### CheckScheduleConflict

**Applied to:** `POST /api/events/{id}/join`

**Checks:**

- User doesn't have conflicting confirmed events
- Compares event times and durations
- Returns conflicting events if found

**Returns:** 409 with conflicting event details.

---

## Policies

### EventPolicy

**Location:** `app/Policies/EventPolicy.php`

**Methods:**

- `viewAny()` - Can view event list
- `view()` - Can view specific event (admins see all, users see published only)
- `create()` - Can create events (admins only)
- `update()` - Can update events (admins only)
- `delete()` - Can delete events (admins only)
- `join()` - Can join events (users only, published events)
- `leave()` - Can leave events (if registered)

**Usage in controller:**

```php
$this->authorize('join', $event);
```

---

## Notifications

### EventRegistrationConfirmation

**Triggered:** When user joins event  
**Channels:** Mail + Database  
**Queue:** Yes (async)

**Content:**

- Event name and details
- Date, time, duration, location
- Action button to view event

### EventReminderNotification

**Triggered:** Daily at 8:00 AM (scheduled)  
**Channels:** Mail + Database  
**Queue:** Yes (async)

**Content:**

- Reminder that event is today
- Event details
- Hours until event starts

---

## Scheduled Commands

### Send Event Reminders

```bash
php artisan events:send-reminders
```

**Schedule:** Daily at 08:00 (configure in `routes/console.php`)

**What it does:**

- Finds all published events happening today
- Gets all confirmed users for each event
- Sends reminder notification to each user
- Logs execution summary

**Setup Cron:**

```bash
crontab -e
```

**Add:**

```
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

**Manual test:**

```bash
php artisan events:send-reminders
php artisan queue:work --once
```

---

## Laravel Nova

**Access:** http://localhost:8000/nova

**Login:**

- **Email:** admin@admin.com
- **Password:** admin@admin.com

**Features:**

- Event CRUD (create, edit, delete)
- View all events (draft + published)
- Manage user registrations
- Filter by status and date
- View registration counts (confirmed/waitlist)

**Resources:**

- `App\Nova\User` - User management
- `App\Nova\Event` - Event management with relationships

---

## Testing

### Manual Testing

1. Register at http://localhost:3000/register
2. Login with demo accounts
3. Browse events calendar
4. Join/leave events
5. Check Mailtrap for emails

### API Testing with cURL

**Register:**

```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123","password_confirmation":"password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@user.com","password":"user@user.com"}'
```

**List events:**

```bash
curl -X GET http://localhost:8000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Artisan Tinker Testing

```bash
php artisan tinker
```

**Test email:**

```php
$user = User::find(2);
$event = Event::find(1);
$user->notify(new \App\Notifications\EventRegistrationConfirmation($event));
exit
```

**Check queue:**

```bash
php artisan queue:work --once
```

**Test reminders:**

```php
// Create event for today
$event = Event::create([
    'name' => 'Test Event',
    'description' => 'Testing reminders',
    'date_time' => now()->addHours(2),
    'duration' => 120,
    'location' => 'Test Room',
    'capacity' => 50,
    'waitlist_capacity' => 10,
    'status' => 'published',
]);

$user = User::find(2);
$event->users()->attach($user->id, [
    'status' => 'confirmed',
    'registered_at' => now()
]);

exit
```

Then run:

```bash
php artisan events:send-reminders
php artisan queue:work
```

Check Mailtrap inbox!

---

## Seeders

### UserSeeder

**Creates:**

- 1 admin: `admin@admin.com` / `admin@admin.com`
- 1 user: `user@user.com` / `user@user.com`
- 10 test users: `user1@example.com` to `user10@example.com` / `password`

### EventSeeder

**Creates:**

- 100 random events distributed over next 30 days
- Duration variety: 2 hours (120 min) to 3 days (4320 min)
- Status mix: ~70% published, ~30% draft
- 4 intentional overlapping test events on same day:
  - Morning Workshop: 10:00-13:00
  - Midday Session: 12:00-15:00 (overlaps #1)
  - Afternoon Bootcamp: 14:00-17:00 (overlaps #2)
  - Evening Session: 18:00-21:00 (no overlap)

**Run seeders:**

```bash
php artisan db:seed
```

**Refresh database:**

```bash
php artisan migrate:fresh --seed
```

---

## Troubleshooting

### Clear Laravel Cache

```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Reset Database

```bash
php artisan migrate:fresh --seed
```

### CORS Errors

- Verify `backend/config/cors.php` includes `http://localhost:3000`
- Check `frontend/.env` has correct API URL

### Queue Not Processing

```bash
php artisan queue:restart
php artisan queue:work
```

### Email Not Sending

- Check Mailtrap credentials in `.env`
- Verify queue worker is running
- Check `storage/logs/laravel.log` for errors

### Frontend Not Connecting to Backend

- Ensure backend is running on `http://localhost:8000`
- Check `REACT_APP_API_URL` in `frontend/.env`
- Verify CORS configuration in Laravel

---

## Project Structure

```
event-management-system/
├── backend/              # Laravel API + Nova
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   ├── Notifications/
│   │   ├── Policies/
│   │   ├── Console/Commands/
│   │   └── Nova/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   ├── api.php
│   │   └── console.php
│   └── config/
└── frontend/             # React application
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── contexts/
    ├── public/
    └── package.json
```