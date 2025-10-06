<?php

namespace App\Models;

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
}
