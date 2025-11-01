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
  UserPlus,
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

      // Check if user was added to waitlist or confirmed
      const status = response.registration_status;

      if (status === "waitlist") {
        toast.success("Added to Waitlist! 📋", {
          description: `You've been added to the waitlist for ${event.name}. You'll be notified if a spot opens up.`,
        });
      } else {
        toast.success("Event Joined! 🎉", {
          description: `You've successfully registered for ${event.name}`,
        });
      }

      // Refresh event details to show updated status
      await loadEventDetails();
      setError("");
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

    try {
      setActionLoading(true);
      setError("");

      await eventsService.leaveEvent(event.id);
      toast.success("Left Event", {
        description: `You've successfully left ${event.name}`,
      });
      // Refresh event details
      await loadEventDetails();
      setShowLeaveDialog(false);
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

  // HELPER: Determine if user can join
  const canJoin = () => {
    if (!event) return false;
    if (event.is_joined) return false; // Already joined
    // Can join if spots available OR waitlist available
    return !event.is_full || !event.is_waitlist_full;
  };

  // HELPER: Determine button text and style
  const getJoinButtonConfig = () => {
    if (!event)
      return {
        text: "Join Event",
        variant: "default" as const,
        icon: <UserPlus className="w-4 h-4" />,
      };

    if (!event.is_full) {
      // Spots available
      return {
        text: "Join Event",
        variant: "default" as const,
        icon: <CheckCircle className="w-4 h-4" />,
        className:
          "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      };
    } else if (!event.is_waitlist_full) {
      // Full but waitlist available
      return {
        text: "Join Waitlist",
        variant: "outline" as const,
        icon: <UserPlus className="w-4 h-4" />,
        className: "border-orange-500 text-orange-600 hover:bg-orange-50",
      };
    }

    return {
      text: "Full",
      variant: "outline" as const,
      icon: <XCircle className="w-4 h-4" />,
    };
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
  const buttonConfig = getJoinButtonConfig();

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

                {/* UPDATED: Show user's specific status */}
                {event.registration_status === "confirmed" && (
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Confirmed
                  </span>
                )}

                {event.registration_status === "waitlist" && (
                  <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    On Waitlist
                  </span>
                )}

                {/* UPDATED: Show capacity status */}
                {event.is_full && !event.is_joined && (
                  <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">
                    {event.is_waitlist_full
                      ? "Fully Booked"
                      : "Full - Waitlist Available"}
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
                <p className="text-sm text-gray-600 dark:text-gray-300">
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
                {/* UPDATED: Show confirmed vs total capacity */}
                <p className="font-semibold text-gray-900 dark:text-gray-600">
                  {event.confirmed_count}/{event.capacity}
                  <span className="text-sm font-normal text-gray-600 ml-2 dark:text-gray-600">
                    ({event.available_spots}{" "}
                    {event.available_spots === 1 ? "spot" : "spots"} left)
                  </span>
                </p>

                {/* UPDATED: Show waitlist info */}
                {event.waitlist_capacity > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Waitlist: {event.waitlist_count}/{event.waitlist_capacity}
                    {event.available_waitlist_spots > 0 && (
                      <span className="text-orange-600 ml-1">
                        ({event.available_waitlist_spots} available)
                      </span>
                    )}
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

          {/* UPDATED: Action Buttons with Waitlist Support */}
          <div className="pt-4 border-t">
            {event.is_joined ? (
              <div className="space-y-4">
                {/* Show different message based on status */}
                {event.registration_status === "confirmed" ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      You're confirmed for this event
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <span className="font-semibold block">
                        You're on the waitlist
                      </span>
                      <span className="text-sm text-gray-600">
                        You'll be notified if a spot becomes available
                      </span>
                    </div>
                  </div>
                )}

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
                {/* Show join button or full message */}
                {canJoin() ? (
                  <div className="space-y-2">
                    {event.is_full && !event.is_waitlist_full && (
                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          This event is full. You can join the waitlist and will
                          be automatically confirmed if someone leaves.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleJoinEvent}
                      disabled={actionLoading}
                      variant={buttonConfig.variant}
                      className={`w-full md:w-auto flex items-center gap-2 ${
                        buttonConfig.className || ""
                      }`}
                    >
                      {buttonConfig.icon}
                      {actionLoading ? "Joining..." : buttonConfig.text}
                    </Button>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>
                      This event and its waitlist are completely full. Please
                      check back later.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>{event?.name}</strong>?
              {event?.registration_status === "confirmed" &&
                event?.waitlist_count > 0 && (
                  <span className="block mt-2 text-orange-600">
                    Note: If you leave, the next person on the waitlist will be
                    automatically confirmed.
                  </span>
                )}
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
