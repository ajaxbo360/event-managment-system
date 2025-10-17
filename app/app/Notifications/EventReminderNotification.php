<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventReminderNotification extends Notification
{
    use Queueable;
    public $event;
    /**
     * Create a new notification instance.
     */
    public function __construct(Event $event)
    {
        $this->event = $event;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Duration formatting
        $hours = intdiv($this->event->duration, 60);
        $minutes = $this->event->duration % 60;
        $durationText = '';
        if ($hours > 0) {
            $durationText .= "{$hours} hour" . ($hours > 1 ? 's' : '');
        }
        if ($minutes > 0) {
            $durationText .= ($durationText ? ' ' : '') . "{$minutes} minute" . ($minutes > 1 ? 's' : '');
        }

        // Time until event
        $diffInMinutes = now()->diffInMinutes($this->event->date_time);
        $hoursUntilEvent = intdiv($diffInMinutes, 60);
        $minutesUntilEvent = $diffInMinutes % 60;
        $timeUntilEvent = "{$hoursUntilEvent} hour" . ($hoursUntilEvent != 1 ? 's' : '');
        if ($minutesUntilEvent > 0) {
            $timeUntilEvent .= " {$minutesUntilEvent} minute" . ($minutesUntilEvent != 1 ? 's' : '');
        }
        $eventUrl = config('app.frontend_url', 'http://localhost:3000') . '/events/' . $this->event->id;

        return (new MailMessage)
            ->subject('Reminder: ' . $this->event->name . ' is Today!')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('This is a reminder that you have an event today:')
            ->line('**Event:** ' . $this->event->name)
            ->line('**Time:** ' . $this->event->date_time->format('g:i A'))
            ->line('**Duration:** ' . $durationText)
            ->line('**Location:** ' . $this->event->location)
            ->line('The event starts in approximately **' . $timeUntilEvent . '**.')
            ->action('View Event Details', $eventUrl)
            ->line('See you there!');
    }



    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_id' => $this->event->id,
            'event_name' => $this->event->name,
            'event_date' => $this->event->date_time,
            'message' => 'Reminder: ' . $this->event->name . ' is today at ' . $this->event->date_time->format('g:i A'),
        ];
    }
}
