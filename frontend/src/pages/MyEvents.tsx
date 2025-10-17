import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import eventsService from "@/services/events.ts";
import type { Event } from "@/types/types.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  CalendarOff,
} from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { toast } from "sonner";

type FilterType = "all" | "upcoming" | "past";

const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [eventToLeave, setEventToLeave] = useState<Event | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      const myEvents = await eventsService.fetchMyEvents();
      setEvents(myEvents);
    } catch (error: any) {
      toast.error("Failed to Load Events", {
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!eventToLeave) return;

    try {
      setActionLoading(true);
      await eventsService.leaveEvent(eventToLeave.id);
      toast.success("Left Event ✅", {
        description: `You've successfully left ${eventToLeave.name}`,
      });
      // Refresh events list
      await loadMyEvents();

      // Close dialog
      setEventToLeave(null);
    } catch (error: any) {
      toast.error("Failed to Leave Event", {
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date_time);

    if (filter === "upcoming") {
      return isFuture(eventDate);
    } else if (filter === "past") {
      return isPast(eventDate);
    }
    return true; // 'all'
  });

  // Separate into upcoming and past
  const upcomingEvents = filteredEvents.filter((event) =>
    isFuture(new Date(event.date_time))
  );
  const pastEvents = filteredEvents.filter((event) =>
    isPast(new Date(event.date_time))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Events
        </h1>
        <p className="text-gray-600 mt-1 dark:text-gray-400">
          Events you've registered for
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          All ({events.length})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === "upcoming"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Upcoming (
          {events.filter((e) => isFuture(new Date(e.date_time))).length})
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === "past"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Past ({events.filter((e) => isPast(new Date(e.date_time))).length})
        </button>
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {filter === "all" ? "No Events Yet" : `No ${filter} events`}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {filter === "all"
                ? "You haven't joined any events yet. Browse the calendar to find events to join!"
                : `You have no ${filter} events.`}
            </p>
            {filter === "all" && (
              <Button onClick={() => navigate("/calendar")}>
                Browse Calendar
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {(filter === "all" || filter === "upcoming") &&
        upcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900  dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Events ({upcomingEvents.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={() => navigate(`/events/${event.id}`)}
                  onLeave={() => setEventToLeave(event)}
                  isPast={false}
                />
              ))}
            </div>
          </div>
        )}

      {/* Past Events */}
      {(filter === "all" || filter === "past") && pastEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Past Events ({pastEvents.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={() => navigate(`/events/${event.id}`)}
                onLeave={() => setEventToLeave(event)}
                isPast={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leave Event Dialog */}
      <AlertDialog
        open={!!eventToLeave}
        onOpenChange={() => setEventToLeave(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave{" "}
              <strong>{eventToLeave?.name}</strong>? You can always register
              again later if spots are available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveEvent}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Leaving..." : "Yes, Leave Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: Event;
  onViewDetails: () => void;
  onLeave: () => void;
  isPast: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewDetails,
  onLeave,
  isPast,
}) => {
  const eventDate = new Date(event.date_time);
  const eventEndTime = new Date(eventDate.getTime() + event.duration * 60000);

  return (
    <Card
      className={`hover:shadow-md transition-shadow dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Event Name and Status */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {event.name}
              </h3>
              {event.is_joined === true && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Confirmed
                </span>
              )}
              {event.is_joined === false && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Waitlist
                </span>
              )}
              {isPast && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  Past Event
                </span>
              )}
            </div>

            {/* Event Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(eventDate, "EEEE, MMMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {format(eventDate, "h:mm a")} -{" "}
                  {format(eventEndTime, "h:mm a")} (
                  {Math.floor(event.duration / 60)}h {event.duration % 60}m)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {event.confirmed_count}/{event.capacity} registered
                  </span>
                </div>
              )}
              {event.registered_at && (
                <div className="text-xs text-gray-500 mt-2">
                  Registered on{" "}
                  {format(new Date(event.registered_at), "MMM dd, yyyy")}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row ">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="cursor-pointer"
            >
              View Details
            </Button>
            {!isPast && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onLeave}
                className="cursor-pointer"
              >
                Leave Event
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyEvents;
