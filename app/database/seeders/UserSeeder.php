<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //Admin

        User::create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('admin@admin.com'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Regular user
        User::create([
            'name' => 'User',
            'email' => 'user@user.com',
            'password' => bcrypt('user@user.com'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        for ($i = 1; $i <= 10; $i++) {
            User::create([
                'name' => "Test User {$i}",
                'email' => "user{$i}@example.com",
                'password' => bcrypt('password'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]);
        }

        $this->command->info('✅ Created 12 users (1 admin, 11 regular users)');
    }
}
