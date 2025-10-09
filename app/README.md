# Event Management System - Setup Instructions

## Backend Setup

### Prerequisites

-   PHP 8.1+
-   Composer
-   SQLite

### Installation

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
