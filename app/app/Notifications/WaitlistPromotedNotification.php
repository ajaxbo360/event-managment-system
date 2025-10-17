<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WaitlistPromotedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $event;

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
        return (new MailMessage)
            ->subject('You\'re In! Promoted from Waitlist - ' . $this->event->name)
            ->greeting('Great News, ' . $notifiable->name . '!')
            ->line('A spot has opened up and you\'ve been promoted from the waitlist!')
            ->line('**Event:** ' . $this->event->name)
            ->line('**Date & Time:** ' . $this->event->date_time->format('F j, Y g:i A'))
            ->line('**Duration:** ' . $this->event->duration . ' minutes')
            ->line('**Location:** ' . $this->event->location)
            ->action('View Event Details', url('/events/' . $this->event->id))
            ->line('We look forward to seeing you there!')
            ->salutation('Best regards, Event Management Team');
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
            'message' => 'You have been promoted from the waitlist for ' . $this->event->name,
        ];
    }
}
