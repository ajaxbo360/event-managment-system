<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relationships
     */

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class)->withPivot('status', 'registered_at')->withTimestamps();
    }

    /**
     * Helper Methods
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function hasRegisteredFor(Event $event): bool
    {
        return $this->events()->where('event_id', $event->id)->exists();
    }

    public function hasConflictWith(Event $newEvent): bool
    {
        return $this->events()
            ->whereDate('date_time', $newEvent->date_time->toDateString())
            ->get()
            ->contains(function ($existingEvent) use ($newEvent) {
                $existingStart = $existingEvent->date_time;
                $existingEnd = $existingEvent->end_time;
                $newStart = $newEvent->date_time;
                $newEnd = $newEvent->end_time;

                return ($newStart < $existingEnd) && ($newEnd > $existingStart);
            });
    }
}
