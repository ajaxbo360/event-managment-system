<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Event extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'date_time',
        'duration',
        'location',
        'capacity',
        'waitlist_capacity',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_time' => 'datetime',
            'duration' => 'integer',
            'capacity' => 'integer',
            'waitlist_capacity' => 'integer',
        ];
    }

    /**
     * Relationships
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot("status", "registered_at")
            ->withTimestamps();
    }

    public function confirmedUsers()
    {
        return $this->belongsToMany(User::class, 'event_user')
            ->withPivot(['status', 'registered_at'])
            ->wherePivot('status', 'confirmed');
    }

    public function waitlistedUsers()
    {
        return $this->belongsToMany(User::class, 'event_user')
            ->withPivot(['status', 'registered_at'])
            ->wherePivot('status', 'waitlist')
            ->orderBy('event_user.registered_at', 'asc'); // FIFO - First In First Out
    }

    /**
     * Accessors & Mutators
     */

    // Calculate event end time
    public function getEndTimeAttribute(): Carbon
    {
        return $this->date_time->copy()->addMinutes($this->duration);
    }

    /**
     * Helper Methods - Counts
     */
    public function confirmedCount(): int
    {
        return $this->users()->wherePivot('status', 'confirmed')->count();
    }

    public function waitlistCount(): int
    {
        return $this->users()->wherePivot('status', 'waitlist')->count();
    }

    /**
     * Helper Methods - Capacity Checks
     */

    public function isFull(): bool
    {
        return $this->confirmedCount() >= $this->capacity;
    }

    public function availableSpots(): int
    {
        return max(0, $this->capacity - $this->confirmedCount());
    }

    /**
     * Check if waitlist is full
     */
    public function isWaitlistFull(): bool
    {
        return $this->waitlistCount() >= $this->waitlist_capacity;
    }

    public function availableWaitlistSpots(): int
    {
        return max(0, $this->waitlist_capacity - $this->waitlistCount());
    }

    /**
     * Can accept new registrations (main spots or waitlist)
     */
    public function canAcceptRegistrations(): bool
    {
        return !$this->isFull() || !$this->isWaitlistFull();
    }

    /**
     * NEW: Promote first person from waitlist to confirmed
     * Returns the promoted user or null
     */
    public function promoteFromWaitlist(): ?User
    {
        // Check if there's space available
        if ($this->isFull()) {
            return null; // No space available
        }

        // Get first waitlisted user (FIFO - First In First Out)
        $waitlistedUser = $this->waitlistedUsers()->first();

        if (!$waitlistedUser) {
            return null; // No one on waitlist
        }

        // Update their status from 'waitlist' to 'confirmed'
        $this->users()->updateExistingPivot($waitlistedUser->id, [
            'status' => 'confirmed',
        ]);

        return $waitlistedUser;
    }

    /**
     * Status Checks
     */

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Scopes
     */

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date_time', '>', now());
    }
}
