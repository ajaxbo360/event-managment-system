<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Faker\Factory as Faker;


class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //


        $events = [];
        $locations = [
            'Conference Hall A',
            'Conference Hall B',
            'Meeting Room 101',
            'Meeting Room 102',
            'Auditorium',
            'Training Center',
            'Online - Zoom',
            'Online - Google Meet',
            'Workshop Space',
            'Innovation Lab',
        ];

        $eventTypes = [
            'Workshop',
            'Seminar',
            'Conference',
            'Meetup',
            'Training',
            'Webinar',
            'Bootcamp',
            'Hackathon',
            'Networking Event',
            'Panel Discussion',
        ];

        $topics = [
            'Laravel Development',
            'React Fundamentals',
            'Database Design',
            'API Development',
            'DevOps Practices',
            'Cloud Computing',
            'Machine Learning',
            'Cybersecurity',
            'Mobile Development',
            'UI/UX Design',
            'Agile Methodology',
            'Microservices',
            'GraphQL',
            'Docker & Kubernetes',
            'Testing Strategies',
        ];

        for ($i = 0; $i < 100; $i++) {
            // Random day in next 30 days
            $daysFromNow = rand(0, 29);

            // Random hour between 8 AM and 6 PM
            $hour = rand(8, 18);

            // Random minute (0, 15, 30, 45)
            $minute = [0, 15, 30, 45][rand(0, 3)];

            // Create date_time
            $dateTime = Carbon::now()
                ->addDays($daysFromNow)
                ->setTime($hour, $minute, 0);

            // Duration: minimum 2 hours (120 min), maximum 3 days (4320 min)
            $durationRand = rand(1, 100);

            if ($durationRand <= 70) {
                // 70% of events: 2-6 hours
                $duration = rand(120, 360);
            } elseif ($durationRand <= 90) {
                // 20% of events: 6-24 hours (1 day)
                $duration = rand(360, 1440);
            } else {
                // 10% of events: 1-3 days
                $duration = rand(1440, 4320);
            }

            // Random capacity
            $capacity = [20, 30, 50, 100, 150, 200][rand(0, 5)];

            // Waitlist capacity (20% of main capacity)
            $waitlistCapacity = (int)($capacity * 0.2);

            // Random status (70% published, 30% draft)
            $status = rand(1, 100) <= 70 ? 'published' : 'draft';

            // Create event
            $topic = $topics[array_rand($topics)];
            $type = $eventTypes[array_rand($eventTypes)];

            Event::create([
                'name' => "{$type}: {$topic}",
                'description' => $this->generateDescription($topic, $type),
                'date_time' => $dateTime,
                'duration' => $duration,
                'location' => $locations[array_rand($locations)],
                'capacity' => $capacity,
                'waitlist_capacity' => $waitlistCapacity,
                'status' => $status,
            ]);
        }

        // Create some INTENTIONAL overlapping events for testing
        $this->createOverlappingEvents();

        $this->command->info('✅ Created 100 events over the next 30 days');
        $this->command->info('✅ Created intentional overlapping events for testing');
    }

    /**
     * Generate a realistic event description
     */
    private function generateDescription(string $topic, string $type): string
    {
        $descriptions = [
            "Join us for an engaging {$type} focused on {$topic}. Perfect for beginners and intermediate developers.",
            "Deep dive into {$topic} with industry experts. This {$type} covers practical applications and best practices.",
            "Learn {$topic} from scratch in this comprehensive {$type}. Hands-on exercises included.",
            "Advanced {$type} on {$topic}. Bring your laptop and be ready to code along with our instructors.",
            "Interactive {$type} exploring the latest trends in {$topic}. Network with fellow developers.",
        ];

        return $descriptions[array_rand($descriptions)];
    }

    /**
     * Create intentionally overlapping events for testing conflict detection
     */
    private function createOverlappingEvents(): void
    {
        // Create 3 events on the same day with overlapping times
        $testDate = Carbon::now()->addDays(5)->setTime(10, 0, 0);

        // Event 1: 10:00 AM - 1:00 PM (3 hours)
        Event::create([
            'name' => 'TEST - Morning Workshop',
            'description' => 'This event intentionally overlaps with the afternoon session for testing.',
            'date_time' => $testDate,
            'duration' => 180, // 3 hours
            'location' => 'Test Room A',
            'capacity' => 30,
            'waitlist_capacity' => 5,
            'status' => 'published',
        ]);

        // Event 2: 12:00 PM - 3:00 PM (3 hours) - OVERLAPS with Event 1
        Event::create([
            'name' => 'TEST - Midday Session',
            'description' => 'This event overlaps with both morning and afternoon events for testing.',
            'date_time' => $testDate->copy()->setTime(12, 0, 0),
            'duration' => 180, // 3 hours
            'location' => 'Test Room B',
            'capacity' => 30,
            'waitlist_capacity' => 5,
            'status' => 'published',
        ]);

        // Event 3: 2:00 PM - 5:00 PM (3 hours) - OVERLAPS with Event 2
        Event::create([
            'name' => 'TEST - Afternoon Bootcamp',
            'description' => 'This event overlaps with the midday session for testing.',
            'date_time' => $testDate->copy()->setTime(14, 0, 0),
            'duration' => 180, // 3 hours
            'location' => 'Test Room C',
            'capacity' => 30,
            'waitlist_capacity' => 5,
            'status' => 'published',
        ]);

        // Event 4: Same day, but NO overlap - 6:00 PM - 9:00 PM
        Event::create([
            'name' => 'TEST - Evening Session (No Overlap)',
            'description' => 'This event does NOT overlap with any other event for testing.',
            'date_time' => $testDate->copy()->setTime(18, 0, 0),
            'duration' => 180, // 3 hours
            'location' => 'Test Room D',
            'capacity' => 30,
            'waitlist_capacity' => 5,
            'status' => 'published',
        ]);

        $this->command->info("   → Created 4 test events on {$testDate->format('Y-m-d')} with overlaps");
    }
}
