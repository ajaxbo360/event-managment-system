import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.tsx";
import eventsService from "@/services/events.ts";
import type { Event, ConflictingEvent } from "@/types/types.ts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
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
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [conflictError, setConflictError] = useState<ConflictingEvent[]>([]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventDetails();
    }
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const eventData = await eventsService.fetchEventDetails(Number(id));
      setEvent(eventData);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to load event details";
      setError(errorMsg);
      toast.error("Error Loading Event", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!event) return;

    try {
      setActionLoading(true);
      setError("");
      setConflictError([]);

      const response = await eventsService.joinEvent(event.id);

      toast.success("Event Joined! 🎉", {
        description: `You've successfully registered for ${event.name}`,
      });

      // Refresh event details to show updated status
      await loadEventDetails();

      // Show success message
      setError(""); // Clear any previous errors
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Conflict detected
        setConflictError(err.response.data.conflicting_events || []);
        setError(err.response.data.message);
        toast.error("Scheduling Conflict ⚠️", {
          description: "This event overlaps with another event you've joined",
        });
      } else {
        const errorMsg = err.response?.data?.message || "Failed to join event";
        setError(errorMsg);
        toast.error("Failed to Join Event", {
          description: errorMsg,
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!event) return;

    // const confirmed = window.confirm(
    //   "Are you sure you want to leave this event?"
    // );
    // if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await eventsService.leaveEvent(event.id);
      toast.success("Left Event", {
        description: `You've successfully left ${event.name}`,
      });
      // Refresh event details
      await loadEventDetails();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to leave event";
      setError(errorMsg);
      setShowLeaveDialog(false);
      toast.error("Failed to Leave Event", {
        description: errorMsg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openNovaEdit = () => {
    window.open(
      `http://localhost:8000/nova/resources/events/${event?.id}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Event Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The event you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/calendar")}>Back to Calendar</Button>
      </div>
    );
  }

  const eventDate = new Date(event.date_time);
  const eventEndTime = new Date(eventDate.getTime() + event.duration * 60000);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {event.status === "draft" && (
                  <span className="px-3 py-1 text-sm font-medium bg-gray-200 text-gray-700 rounded-full">
                    Draft
                  </span>
                )}
                {event.is_joined && (
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Joined
                  </span>
                )}
                {event.is_full && !event.is_joined && (
                  <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">
                    Full
                  </span>
                )}
              </div>
            </div>

            {/* Admin Edit Button */}
            {isAdmin() && (
              <Button
                variant="outline"
                onClick={openNovaEdit}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Edit in Nova
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Date & Time
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-600">
                  {format(eventDate, "EEEE, MMMM dd, yyyy")}
                </p>
                <p className="text-gray-700 dark:text-gray-600">
                  {format(eventDate, "h:mm a")} -{" "}
                  {format(eventEndTime, "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ">
                  Duration
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-600">
                  {Math.floor(event.duration / 60)} hours {event.duration % 60}{" "}
                  minutes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Location
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-600">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Capacity
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-600">
                  {event.confirmed_count}/{event.capacity}
                  <span className="text-sm font-normal text-gray-600 ml-2 dark:text-gray-600">
                    ({event.available_spots} spots left)
                  </span>
                </p>
                {event.waitlist_capacity > 0 && (
                  <p className="text-sm text-gray-600">
                    Waitlist: {event.waitlist_count}/{event.waitlist_capacity}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-300">
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Conflict Warning */}
          {conflictError.length > 0 && (
            <Alert>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <AlertTitle>Scheduling Conflict Detected</AlertTitle>
              <AlertDescription>
                <p className="mb-2">This event overlaps with:</p>
                {conflictError.map((conflict) => (
                  <div key={conflict.id} className="ml-4 mb-2">
                    <p className="font-semibold">{conflict.name}</p>
                    <p className="text-sm">
                      {format(new Date(conflict.date_time), "MMM dd, h:mm a")} -{" "}
                      {format(new Date(conflict.end_time), "h:mm a")}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/events/${conflict.id}`)}
                      className="p-0 h-auto"
                    >
                      View Event →
                    </Button>
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t">
            {event.is_joined ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    You're registered for this event
                  </span>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowLeaveDialog(true)}
                  disabled={actionLoading}
                  className="w-full md:w-auto"
                >
                  {actionLoading ? "Leaving..." : "Leave Event"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {event.is_full ? (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      This event is at full capacity. Waitlist is also full.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    onClick={handleJoinEvent}
                    disabled={actionLoading}
                    className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {actionLoading ? "Joining..." : "Join Event"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>{event?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveEvent}>
              Yes, Leave Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventDetails;
