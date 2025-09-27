import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { 
  Store, 
  Users, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  BarChart3,
  Plus,
  Settings,
  Activity,
  Globe,
  AlertCircle
} from 'lucide-react';

export const PlatformDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your stores.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stores</CardTitle>
              <Store className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">127</div>
              <div className="flex items-center space-x-1 text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Stores</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">98</div>
              <div className="flex items-center space-x-1 text-xs text-green-600 mt-1">
                <span>77% active rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$45,230</div>
              <div className="flex items-center space-x-1 text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+18% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Support Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                <span>3 urgent</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Top Stores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Stores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2 text-blue-600" />
                Recent Stores
              </CardTitle>
              <CardDescription>Latest stores created on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Rexus Gaming", owner: "Rexus Indonesia", status: "Active", created: "2 days ago", revenue: "$2,450" },
                  { name: "TechStore Pro", owner: "John Smith", status: "Setup", created: "5 days ago", revenue: "$0" },
                  { name: "Fashion Hub", owner: "Sarah Wilson", status: "Active", created: "1 week ago", revenue: "$1,230" },
                  { name: "HomeDecor Plus", owner: "Mike Johnson", status: "Suspended", created: "2 weeks ago", revenue: "$890" }
                ].map((store, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-600">{store.owner}</div>
                    </div>
                    <div className="text-center">
                      <Badge 
                        variant={store.status === 'Active' ? 'default' : store.status === 'Setup' ? 'secondary' : 'destructive'}
                        className="mb-1"
                      >
                        {store.status}
                      </Badge>
                      <div className="text-xs text-gray-500">{store.created}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{store.revenue}</div>
                      <div className="text-xs text-gray-500">30d revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Stores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Top Performers
              </CardTitle>
              <CardDescription>Highest revenue generating stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Rexus Gaming", revenue: "$12,450", growth: "+23%", orders: 145 },
                  { name: "ElectroWorld", revenue: "$9,230", growth: "+18%", orders: 89 },
                  { name: "Fashion Central", revenue: "$8,890", growth: "+15%", orders: 156 },
                  { name: "Sports Gear", revenue: "$7,650", growth: "+12%", orders: 78 }
                ].map((store, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{store.name}</div>
                        <div className="text-sm text-gray-600">{store.orders} orders</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{store.revenue}</div>
                      <div className="text-sm text-green-600">{store.growth}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response Time</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">120ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Uptime</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">99.9%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Load</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Medium</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CDN Status</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Healthy</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New Store
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Platform Settings
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-gray-900">New store "TechGadgets" created</p>
                    <p className="text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="text-gray-900">Store "Fashion Hub" went live</p>
                    <p className="text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <div>
                    <p className="text-gray-900">Support ticket #1247 resolved</p>
                    <p className="text-gray-500">3 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <div>
                    <p className="text-gray-900">Platform update deployed</p>
                    <p className="text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};