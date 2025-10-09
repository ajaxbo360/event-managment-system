<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Event $event): bool
    {
        // Admins can view all events (draft + published)
        if ($user->isAdmin()) {
            return true;
        }

        // Regular users can only view published events
        return $event->isPublished();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Event $event): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can join the event.
     */
    public function join(User $user, Event $event): bool
    {
        // Admins cannot join events (they manage, not participate)
        if ($user->isAdmin()) {
            return false;
        }

        // Event must be published
        if (!$event->isPublished()) {
            return false;
        }

        // User must not already be registered
        if ($user->hasRegisteredFor($event)) {
            return false;
        }

        // Event must have capacity (including waitlist)
        return $event->canAcceptRegistrations();
    }

    /**
     * Determine if the user can leave the event.
     */
    public function leave(User $user, Event $event): bool
    {
        // User must be registered to leave
        return $user->hasRegisteredFor($event);
    }


    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Event $event): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Event $event): bool
    {
        return false;
    }
}
