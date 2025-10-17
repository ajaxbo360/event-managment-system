<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Notifications\EventRegistrationConfirmation;
use App\Notifications\WaitlistPromotedNotification; // NEW
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    use AuthorizesRequests;

    /**
     * Get all published events
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Event::class);
        $query = Event::query();

        if (!$request->user()->isAdmin()) {
            $query->where('status', 'published');
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date_time', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $events = $query->withCount('users')
            ->orderBy('date_time', 'asc')
            ->get()
            ->map(function ($event) use ($request) {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date_time' => $event->date_time,
                    'duration' => $event->duration,
                    'location' => $event->location,
                    'capacity' => $event->capacity,
                    'waitlist_capacity' => $event->waitlist_capacity,
                    'status' => $event->status,
                    'registered_count' => $event->users_count,
                    'available_spots' => $event->availableSpots(),
                    'is_full' => $event->isFull(),
                    'is_joined' => $request->user()->hasRegisteredFor($event),
                ];
            });

        return response()->json($events);
    }

    /**
     * Get single event details
     */
    public function show(Request $request, Event $event)
    {
        $this->authorize('view', $event);

        if (!$request->user()->isAdmin() && $event->status !== 'published') {
            return response()->json([
                'message' => 'Event not found',
            ], 404);
        }

        return response()->json([
            'id' => $event->id,
            'name' => $event->name,
            'description' => $event->description,
            'date_time' => $event->date_time,
            'duration' => $event->duration,
            'location' => $event->location,
            'capacity' => $event->capacity,
            'waitlist_capacity' => $event->waitlist_capacity,
            'status' => $event->status,
            'registered_count' => $event->users()->count(),
            'available_spots' => $event->availableSpots(),
            'is_full' => $event->isFull(),
            'is_joined' => $request->user()->hasRegisteredFor($event),
        ]);
    }

    /**
     * Join an event
     */
    public function join(Request $request, Event $event)
    {
        $this->authorize('join', $event);
        $user = $request->user();

        // Check for time conflicts
        if ($user->hasConflictWith($event)) {
            $conflictingEvents = $user->events()
                ->whereDate('date_time', $event->date_time->toDateString())
                ->get()
                ->filter(function ($existingEvent) use ($event) {
                    $existingEnd = $existingEvent->end_time;
                    $newEnd = $event->end_time;
                    return ($event->date_time < $existingEnd) &&
                        ($newEnd > $existingEvent->date_time);
                });

            return response()->json([
                'message' => 'You have a scheduling conflict with another event',
                'conflicting_events' => $conflictingEvents->map(function ($e) {
                    return [
                        'id' => $e->id,
                        'name' => $e->name,
                        'date_time' => $e->date_time,
                        'end_time' => $e->end_time,
                    ];
                }),
            ], 409);
        }

        // Check if BOTH capacity and waitlist are full
        if ($event->isFull() && $event->isWaitlistFull()) {
            return response()->json([
                'message' => 'Event is full and waitlist is also full',
                'available_spots' => 0,
                'available_waitlist_spots' => 0,
            ], 400);
        }

        try {
            // FIXED: Determine status based on capacity
            $confirmedCount = $event->users()->wherePivot('status', 'confirmed')->count();
            $status = $confirmedCount < $event->capacity ? 'confirmed' : 'waitlist';

            DB::transaction(function () use ($event, $user, $status) {
                $event->users()->attach($user->id, [
                    'status' => $status,  // ADDED
                    'registered_at' => now(),
                ]);
            });

            // Send confirmation email
            $user->notify(new EventRegistrationConfirmation($event));

            Log::info('User registered for event', [
                'user_id' => $user->id,
                'event_id' => $event->id,
                'event_name' => $event->name,
                'status' => $status,  // ADDED
            ]);

            // IMPROVED: Different messages for confirmed vs waitlist
            $message = $status === 'confirmed'
                ? 'Successfully registered for event. Confirmation email sent.'
                : 'Event is full. You have been added to the waitlist. Confirmation email sent.';

            return response()->json([
                'message' => $message,
                'registration_status' => $status,  // ADDED
                'event' => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'date_time' => $event->date_time,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Event registration failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'event_id' => $event->id,
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Leave an event
     */
    public function leave(Request $request, Event $event)
    {
        $this->authorize('leave', $event);
        $user = $request->user();

        try {
            DB::transaction(function () use ($event, $user) {
                // Get user's current status BEFORE detaching
                $userPivot = $event->users()->find($user->id)->pivot;
                $userStatus = $userPivot->status;

                // Remove user from event
                $event->users()->detach($user->id);

                // If a CONFIRMED user left, promote first person from waitlist
                if ($userStatus === 'confirmed') {
                    $firstWaitlistUser = $event->users()
                        ->wherePivot('status', 'waitlist')
                        ->orderBy('event_user.registered_at', 'asc')
                        ->first();

                    if ($firstWaitlistUser) {
                        // Promote to confirmed
                        $event->users()->updateExistingPivot($firstWaitlistUser->id, [
                            'status' => 'confirmed',
                        ]);

                        // Notify promoted user
                        $firstWaitlistUser->notify(new WaitlistPromotedNotification($event));

                        Log::info('User promoted from waitlist', [
                            'promoted_user_id' => $firstWaitlistUser->id,
                            'event_id' => $event->id,
                            'event_name' => $event->name,
                        ]);
                    }
                }
            });

            Log::info('User left event', [
                'user_id' => $user->id,
                'event_id' => $event->id,
            ]);

            return response()->json([
                'message' => 'Successfully left the event',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to leave event', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'event_id' => $event->id,
            ]);

            return response()->json([
                'message' => 'Failed to leave event. Please try again.',
            ], 500);
        }
    }

    /**
     * Get user's registered events
     */
    public function myEvents(Request $request)
    {
        $user = $request->user();

        $events = $user->events()
            ->orderBy('date_time', 'asc')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date_time' => $event->date_time,
                    'duration' => $event->duration,
                    'location' => $event->location,
                    'capacity' => $event->capacity,
                    'registration_status' => $event->pivot->status,  // ADDED
                    'registered_at' => $event->pivot->registered_at,
                ];
            });

        return response()->json($events);
    }
}
