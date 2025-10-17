<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventRegistrationConfirmation extends Notification
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
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Convert duration (in minutes) to readable hours + minutes
        $hours = floor($this->event->duration / 60);
        $minutes = $this->event->duration % 60;
        $durationFormatted = $hours > 0
            ? ($minutes > 0 ? "{$hours}h {$minutes}m" : "{$hours}h")
            : "{$minutes}m";
        $eventUrl = config('app.frontend_url', 'http://localhost:3000') . '/events/' . $this->event->id;

        return (new MailMessage)
            ->subject('Event Registration Confirmed: ' . $this->event->name)
            ->greeting('🎉 Hello ' . $notifiable->name . '!')
            ->line('You have successfully registered for the following event:')
            ->line('')
            ->line('**Event:** ' . $this->event->name)
            ->line('**Date & Time:** ' . $this->event->date_time->format('F j, Y, g:i A'))
            ->line('**Duration:** ' . $durationFormatted)
            ->line('**Location:** ' . $this->event->location)
            ->line('')
            ->line('**Description:** ' . $this->event->description)
            ->action('View Event Details', $eventUrl)
            ->line('')
            ->line('We look forward to seeing you there!')
            ->line('If you need to cancel your registration, please log in to your account.')
            ->salutation('Best regards,')
            ->salutation(config('app.name'));
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
            'message' => 'You have successfully registered for ' . $this->event->name,
        ];
    }
}
