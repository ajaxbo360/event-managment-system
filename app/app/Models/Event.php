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
        return $this->belongsToMany(User::class)->withPivot("status", "registered_at")->withTimestamps();
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
     * Helper Methods
     */
    public function isFull(): bool
    {
        return $this->users()->count() >= $this->capacity;
    }

    public function availableSpots(): int
    {
        return max(0, $this->capacity - $this->users()->count());
    }

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
