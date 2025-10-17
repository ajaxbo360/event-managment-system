import React, { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import eventsService from "@/services/events.ts";
import type { Event } from "@/types/types.ts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar-custom.css";

// Setup date-fns localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Calendar event type
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Event; // Store full event data
}

const EventsCalendar: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarView, setCalendarView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDrafts, setShowDrafts] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate, calendarView]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Calculate date range based on current view
      let startDate, endDate;

      if (calendarView === "month") {
        // Month view: show entire month + next month for better performance
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(addMonths(currentDate, 1));
      } else if (calendarView === "week") {
        // Week view: show current week + padding
        const weekStart = startOfWeek(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        startDate = weekStart;
        endDate = weekEnd;
      } else {
        // Day view: show current day + padding
        startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 2);
      }

      const fetchedEvents = await eventsService.fetchEvents(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform events to calendar format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    let filteredEvents = events;

    // Filter out draft events for non-admins
    if (!isAdmin() || !showDrafts) {
      filteredEvents = events.filter((event) => event.status === "published");
    }

    return filteredEvents.map((event) => {
      const start = new Date(event.date_time);
      const end = new Date(start.getTime() + event.duration * 60000); // duration in minutes

      return {
        id: event.id,
        title: event.name,
        start,
        end,
        resource: event,
      };
    });
  }, [events, isAdmin, showDrafts]);

  // Custom event style based on registration status
  const eventStyleGetter = (event: CalendarEvent) => {
    const eventData = event.resource;
    let backgroundColor = "#3b82f6"; // default blue (available)
    let borderColor = "#2563eb";

    // Color coding based on status
    if (eventData.status === "draft") {
      backgroundColor = "#9ca3af"; // gray (draft)
      borderColor = "#6b7280";
    } else if (eventData.is_joined) {
      backgroundColor = "#10b981"; // green (joined)
      borderColor = "#059669";
    } else if (eventData.is_full) {
      backgroundColor = "#ef4444"; // red (full)
      borderColor = "#dc2626";
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: "6px",
        color: "#ffffff",
        fontWeight: eventData.is_joined ? "bold" : "normal",
        padding: "2px 6px",
      },
    };
  };

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/events/${event.id}`);
  };

  // Handle navigation
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  // Handle view change
  const handleViewChange = (newView: View) => {
    setCalendarView(newView);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
            <CalendarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Events Calendar
          </h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">
            View and manage your event schedule
          </p>
        </div>

        {/* Admin Draft Toggle */}
        {isAdmin() && (
          <Button
            variant={showDrafts ? "default" : "outline"}
            onClick={() => setShowDrafts(!showDrafts)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {showDrafts ? "✓ Showing Drafts" : "Show Draft Events"}
          </Button>
        )}
      </div>

      {/* Legend */}
      <Alert className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Info className="w-4 h-4" />
        <AlertDescription>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Joined</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Full</span>
            </div>
            {isAdmin() && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400"></div>
                <span>Draft</span>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Calendar */}
      <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div style={{ height: "700px" }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              view={calendarView}
              date={currentDate}
              eventPropGetter={eventStyleGetter}
              popup
              views={["month", "week", "day"]}
              messages={{
                next: "Next",
                previous: "Previous",
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Events
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {calendarEvents.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">Joined</p>
            <p className="text-2xl font-bold text-green-600">
              {calendarEvents.filter((e) => e.resource.is_joined).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-blue-600">
              {
                calendarEvents.filter(
                  (e) => !e.resource.is_joined && !e.resource.is_full
                ).length
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">Full Events</p>
            <p className="text-2xl font-bold text-red-600">
              {calendarEvents.filter((e) => e.resource.is_full).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventsCalendar;
