import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import { 
  Users, 
  Store,
  DollarSign, 
  TrendingUp,
  Plus,
  Settings,
  BarChart3,
  Globe,
  Shield,
  Zap
} from "lucide-react";

// Mock platform data
const platformStats = [
  {
    title: "Active Tenants",
    value: "1,247",
    change: "+12.5%",
    trend: "up",
    icon: Store,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Monthly Revenue",
    value: "$425,200",
    change: "+8.2%", 
    trend: "up",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Total Users",
    value: "45,892",
    change: "+15.3%",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    title: "Platform Growth",
    value: "32.8%",
    change: "+4.1%",
    trend: "up", 
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  }
];

const recentTenants = [
  {
    id: 1,
    name: "Gaming Pro Store",
    domain: "gaming-pro.smartseller.com",
    plan: "Premium",
    status: "active",
    revenue: "$2,450",
    createdAt: "2024-03-15"
  },
  {
    id: 2,
    name: "Tech Gadgets Hub",
    domain: "tech-hub.smartseller.com", 
    plan: "Enterprise",
    status: "active",
    revenue: "$5,680",
    createdAt: "2024-03-14"
  },
  {
    id: 3,
    name: "Fashion Boutique",
    domain: "fashion-boutique.smartseller.com",
    plan: "Basic", 
    status: "trial",
    revenue: "$890",
    createdAt: "2024-03-13"
  },
  {
    id: 4,
    name: "Home & Garden",
    domain: "home-garden.smartseller.com",
    plan: "Premium",
    status: "active", 
    revenue: "$3,240",
    createdAt: "2024-03-12"
  }
];

const PlatformDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
              <p className="text-gray-600">Manage your SmartSeller tenants and platform</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {platformStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Tenant Management
              </CardTitle>
              <CardDescription>Manage tenant configurations and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View All Tenants
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Platform Analytics
              </CardTitle>
              <CardDescription>View comprehensive platform insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                System Health
              </CardTitle>
              <CardDescription>Monitor platform performance and security</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View System Status
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
            <CardDescription>Latest tenant registrations and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Revenue</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <span className="text-blue-600">{tenant.domain}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        tenant.plan === 'Enterprise' ? 'default' : 
                        tenant.plan === 'Premium' ? 'secondary' : 'outline'
                      }>
                        {tenant.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.revenue}</TableCell>
                    <TableCell>{tenant.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDashboard;