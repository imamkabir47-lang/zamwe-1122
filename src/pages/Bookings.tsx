import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, User, Video } from "lucide-react";
import { format } from "date-fns";

const Bookings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [formData, setFormData] = useState({
    mentor_id: "",
    title: "",
    description: "",
    booking_type: "mentorship",
    time: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    loadBookings();
    loadMentors();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setUser(user);
  };

  const loadBookings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          mentor:mentor_id (full_name, business_name, photo_url),
          user:user_id (full_name)
        `
        )
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(20);

      if (error) throw error;
      setMentors(data || []);
    } catch (error) {
      console.error("Error loading mentors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !formData.time || !formData.mentor_id) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const [hours, minutes] = formData.time.split(":");
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        mentor_id: formData.mentor_id,
        title: formData.title,
        description: formData.description,
        booking_type: formData.booking_type,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking created",
        description: "Your booking request has been sent",
      });

      setShowBookingForm(false);
      setFormData({
        mentor_id: "",
        title: "",
        description: "",
        booking_type: "mentorship",
        time: "",
      });
      loadBookings();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking failed",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">
              My Bookings
            </h1>
            <p className="text-foreground/70">
              Schedule mentorship sessions, consultations, and workshops
            </p>
          </div>
          <Button onClick={() => setShowBookingForm(!showBookingForm)}>
            {showBookingForm ? "View Bookings" : "New Booking"}
          </Button>
        </div>

        {showBookingForm ? (
          <Card className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Create New Booking</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Select Mentor</Label>
                <Select
                  value={formData.mentor_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mentor_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.user_id} value={mentor.user_id}>
                        {mentor.full_name} - {mentor.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Booking Type</Label>
                <Select
                  value={formData.booking_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, booking_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Session title"
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What would you like to discuss?"
                  rows={4}
                />
              </div>

              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Create Booking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-foreground/20" />
                <p className="text-foreground/60 mb-4">No bookings yet</p>
                <Button onClick={() => setShowBookingForm(true)}>
                  Create Your First Booking
                </Button>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">
                          {booking.title}
                        </h3>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/70 capitalize">
                        {booking.booking_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>
                        {booking.mentor?.full_name} (
                        {booking.mentor?.business_name})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {format(new Date(booking.start_time), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(booking.start_time), "h:mm a")}</span>
                    </div>
                  </div>

                  {booking.description && (
                    <p className="text-sm text-foreground/70 mb-4">
                      {booking.description}
                    </p>
                  )}

                  {booking.meeting_link && booking.status === "confirmed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(booking.meeting_link, "_blank")}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting
                    </Button>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
