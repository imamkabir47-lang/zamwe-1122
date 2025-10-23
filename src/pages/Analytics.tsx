import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  ShoppingCart,
} from "lucide-react";

const Analytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalEvents: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalEnrollments: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    loadStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/");
      }
    } catch (error) {
      navigate("/admin/login");
    }
  };

  const loadStats = async () => {
    try {
      const [
        profilesResult,
        applicationsResult,
        eventsResult,
        paymentsResult,
        ordersResult,
        enrollmentsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact" }),
        supabase.from("join_applications").select("*", { count: "exact" }),
        supabase.from("events").select("*", { count: "exact" }),
        supabase.from("payments").select("amount"),
        supabase.from("orders").select("*", { count: "exact" }),
        supabase.from("enrollments").select("*", { count: "exact" }),
      ]);

      const totalRevenue =
        paymentsResult.data?.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        ) || 0;

      const pendingApps = applicationsResult.data?.filter(
        (app) => app.status === "pending"
      ).length;

      setStats({
        totalMembers: profilesResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        pendingApplications: pendingApps || 0,
        totalEvents: eventsResult.count || 0,
        totalRevenue,
        totalOrders: ordersResult.count || 0,
        totalEnrollments: enrollmentsResult.count || 0,
        activeUsers: profilesResult.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

  const membershipData = [
    { name: "Starter", value: 45 },
    { name: "Pro", value: 25 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 4000 },
    { month: "Feb", revenue: 3000 },
    { month: "Mar", revenue: 5000 },
    { month: "Apr", revenue: 4500 },
    { month: "May", revenue: 6000 },
    { month: "Jun", revenue: 7500 },
  ];

  const businessTypeData = [
    { name: "Fashion", value: 30 },
    { name: "Food", value: 25 },
    { name: "Tech", value: 20 },
    { name: "Services", value: 15 },
    { name: "Others", value: 10 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-primary mb-8">
          Analytics Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Total Members</div>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {stats.totalMembers}
            </div>
            <div className="text-xs text-foreground/60 mt-1">
              +12% from last month
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Applications</div>
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold text-accent">
              {stats.pendingApplications}
            </div>
            <div className="text-xs text-foreground/60 mt-1">
              {stats.totalApplications} total
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Total Revenue</div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">
              ₦{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-foreground/60 mt-1">
              +23% from last month
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Events</div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-500">
              {stats.totalEvents}
            </div>
            <div className="text-xs text-foreground/60 mt-1">
              {stats.totalEnrollments} enrollments
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Business Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={businessTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {businessTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Membership Plan Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={membershipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Active Users</div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <div className="text-xs text-foreground/60 mt-1">
              Last 30 days
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Orders</div>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <div className="text-xs text-foreground/60 mt-1">
              All time
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-foreground/60">Course Enrollments</div>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <div className="text-xs text-foreground/60 mt-1">
              All time
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
