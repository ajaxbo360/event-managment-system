<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Notifications\EventReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendEventReminders extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'events:send-reminders';

    /**
     * The console command description.
     */
    protected $description = 'Send reminder notifications to users for events happening today';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for events today...');

        // Get all published events happening today
        $eventsToday = Event::whereDate('date_time', today())
            ->where('status', 'published')
            ->where('date_time', '>', now())
            ->with('users')
            ->get();

        if ($eventsToday->isEmpty()) {
            $this->info('No events found for today.');
            Log::info('Event reminders: No events today');
            return 0;
        }

        $this->info("Found {$eventsToday->count()} event(s) today.");

        $totalNotificationsSent = 0;

        foreach ($eventsToday as $event) {
            $users = $event->users;

            if ($users->isEmpty()) {
                $this->warn("Event '{$event->name}' has no registered users.");
                continue;
            }

            $this->info("Sending reminders for: {$event->name}");
            $this->info("Registered users: {$users->count()}");

            foreach ($users as $user) {
                try {
                    $user->notify(new EventReminderNotification($event));
                    $totalNotificationsSent++;
                    $this->line("  ✓ Sent to: {$user->email}");
                } catch (\Exception $e) {
                    $this->error("  ✗ Failed for: {$user->email}");
                    Log::error('Failed to send reminder', [
                        'user_id' => $user->id,
                        'event_id' => $event->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        $this->info("\n✅ Sent {$totalNotificationsSent} reminder notification(s).");

        Log::info('Event reminders sent', [
            'events_count' => $eventsToday->count(),
            'notifications_sent' => $totalNotificationsSent,
        ]);

        return 0;
    }
}
