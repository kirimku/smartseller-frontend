import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { ArrowRight, Users, Store, BarChart3, Settings, Zap, Shield, Globe, TrendingUp } from 'lucide-react';

export default function PlatformLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SmartSeller</h1>
                <p className="text-xs text-blue-600 font-medium">Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  className="text-gray-600"
                >
                  Login
                </Button>
              </Link>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 px-4 py-2">
            🚀 Multi-Tenant E-commerce Platform
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Build and Manage
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Multiple Storefronts </span>
            from One Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            SmartSeller Platform empowers you to create, manage, and scale multiple e-commerce stores 
            with powerful tools, analytics, and automation. Perfect for agencies, enterprises, and growing businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-blue-200 text-blue-700 hover:bg-blue-50">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { number: "1000+", label: "Active Stores", icon: Store },
            { number: "50K+", label: "Products Managed", icon: BarChart3 },
            { number: "99.9%", label: "Uptime", icon: Zap },
            { number: "$2M+", label: "Revenue Generated", icon: TrendingUp }
          ].map((stat, index) => (
            <Card key={index} className="text-center border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Scale Your Business
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From tenant management to advanced analytics, SmartSeller Platform provides 
            all the tools you need to run successful e-commerce operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: "Multi-Tenant Management",
              description: "Create and manage unlimited stores with separate branding, products, and customers.",
              color: "blue"
            },
            {
              icon: BarChart3,
              title: "Advanced Analytics",
              description: "Real-time dashboards with sales metrics, customer insights, and performance tracking.",
              color: "indigo"
            },
            {
              icon: Settings,
              title: "Flexible Configuration",
              description: "Customize themes, features, and settings for each store independently.",
              color: "purple"
            },
            {
              icon: Shield,
              title: "Enterprise Security",
              description: "Built-in security features, data encryption, and compliance tools.",
              color: "green"
            },
            {
              icon: Globe,
              title: "Global Reach",
              description: "Multi-currency, multi-language support with CDN and fast loading.",
              color: "orange"
            },
            {
              icon: Zap,
              title: "Automation Tools",
              description: "Automated workflows, inventory management, and customer communications.",
              color: "red"
            }
          ].map((feature, index) => (
            <Card key={index} className="border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your business needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                period: "/month",
                description: "Perfect for small businesses getting started",
                features: [
                  "Up to 3 stores",
                  "1,000 products per store",
                  "Basic analytics",
                  "Email support",
                  "Standard themes"
                ],
                popular: false
              },
              {
                name: "Professional",
                price: "$79",
                period: "/month", 
                description: "Ideal for growing businesses and agencies",
                features: [
                  "Up to 10 stores",
                  "10,000 products per store",
                  "Advanced analytics",
                  "Priority support",
                  "Custom themes",
                  "API access"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "$199",
                period: "/month",
                description: "For large organizations with complex needs",
                features: [
                  "Unlimited stores",
                  "Unlimited products",
                  "Custom analytics",
                  "24/7 phone support",
                  "White-label solution",
                  "Advanced integrations"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700">
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Scale Your E-commerce Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using SmartSeller Platform to create and manage 
            successful online stores. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">SmartSeller</span>
              </div>
              <p className="text-gray-400">
                The complete multi-tenant e-commerce platform for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SmartSeller Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};