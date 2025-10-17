import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import eventsService from "@/services/events.ts";
import type { Event } from "@/types/types.ts";
import StatCard from "@/components/StatCard.tsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  Shield,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { format, differenceInHours, isTomorrow, isToday } from "date-fns";

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    registeredEvents: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all events and my events
      const [allEvents, registeredEvents] = await Promise.all([
        eventsService.fetchEvents(),
        eventsService.fetchMyEvents(),
      ]);

      // Calculate upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcoming = allEvents
        .filter((event) => {
          const eventDate = new Date(event.date_time);
          return eventDate >= now && eventDate <= nextWeek;
        })
        .sort(
          (a, b) =>
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        )
        .slice(0, 5);

      setUpcomingEvents(upcoming);
      setMyEvents(registeredEvents);
      setStats({
        totalEvents: allEvents.length,
        upcomingEvents: upcoming.length,
        registeredEvents: registeredEvents.length,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvent = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const openNovaAdmin = () => {
    window.open("http://localhost:8000/nova", "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Filter events for today and tomorrow for reminders
  const todayAndTomorrowEvents = myEvents.filter((event) => {
    const eventDate = new Date(event.date_time);
    return isToday(eventDate) || isTomorrow(eventDate);
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-1 dark:text-gray-400">
          Here's what's happening with your events
        </p>
      </div>

      {/* Admin Quick Access */}
      {isAdmin() && (
        <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <Shield className="w-5 h-5 text-purple-600" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-medium text-purple-900">Admin Access</p>
              <p className="text-sm text-purple-700">
                Manage events, users, and content in Laravel Nova
              </p>
            </div>
            <Button
              onClick={openNovaAdmin}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Nova Panel
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Event Reminders - Today and Tomorrow */}
      {todayAndTomorrowEvents.length > 0 && (
        <div className="space-y-3">
          {todayAndTomorrowEvents.map((event) => {
            const eventDate = new Date(event.date_time);
            const hoursUntil = differenceInHours(eventDate, new Date());
            const isEventToday = isToday(eventDate);

            return (
              <Alert
                key={event.id}
                className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 shadow-sm"
              >
                <Bell className="w-5 h-5 text-orange-600 animate-pulse" />
                <AlertDescription>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900 flex items-center gap-2 mb-1">
                        {isEventToday ? "🔔 Event Today!" : "📅 Event Tomorrow"}
                      </p>
                      <p className="text-base font-semibold text-gray-900 mb-2">
                        {event.name}
                      </p>
                      <div className="space-y-1 text-sm text-orange-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(eventDate, "h:mm a")}
                            {hoursUntil > 0 && hoursUntil < 24 && (
                              <span className="font-semibold ml-2">
                                (in {hoursUntil} hour
                                {hoursUntil !== 1 ? "s" : ""})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewEvent(event.id)}
                      className=" text-gray-700 hover:bg-orange-100 whitespace-nowrap"
                    >
                      View Details
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          gradient="from-blue-500 to-blue-600"
          description={
            isAdmin() ? "Including draft events" : "Published events"
          }
        />
        <StatCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon={Clock}
          gradient="from-purple-500 to-purple-600"
          description="In the next 7 days"
        />
        <StatCard
          title="My Registrations"
          value={stats.registeredEvents}
          icon={CheckCircle}
          gradient="from-green-500 to-green-600"
          description="Events you've joined"
        />
      </div>

      {/* Upcoming Events */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 dark:text-white">
              📅 Upcoming Events
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
              Next 7 days • {upcomingEvents.length} events
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/calendar")}
            className="cursor-pointer"
          >
            View Calendar
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleViewEvent(event.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-300">
                        {event.name}
                      </h4>
                      {event.status === "draft" && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-500 text-gray-700  rounded dark:text-gray-300">
                          Draft
                        </span>
                      )}
                      {event.is_joined && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                          ✓ Joined
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(
                          new Date(event.date_time),
                          "MMM dd, yyyy • h:mm a"
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.confirmed_count}/{event.capacity} registerations
                      </div>
                      {event.is_full && (
                        <div className="flex items-center gap-1  text-xs text-red-600 border border-red-800 px-2 py-1 rounded-2xl">
                          <AlertTriangle className="w-3 h-3 " />
                          Event Full
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 dark:border-gray-500 cursor-pointer"
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No upcoming events
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Check out the calendar to see all available events
              </p>
              <Button onClick={() => navigate("/calendar")}>
                Browse Calendar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
