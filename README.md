# SmartSeller - B2B E-commerce Platform

## Overview

**SmartSeller** is a comprehensive B2B SaaS e-commerce platform that enables businesses to create and manage their online stores with advanced features including multi-tenant architecture, loyalty programs, warehouse management, and integrated analytics.

### Business Model

- **Platform Type**: B2B SaaS (Software as a Service)
- **Target Market**: Small to medium businesses looking to establish online presence
- **Revenue Model**: Subscription-based with transaction fees
- **Competitive Advantage**: White-label storefront with comprehensive business management tools

### Current Implementation: Rexus Gaming Store

This repository contains the frontend implementation for **Rexus**, a gaming peripherals company using SmartSeller to run their online business.

## Architecture Overview

### Two-Tier Application Structure

#### 1. **Admin Dashboard** (B2B Management Platform)
The core business management interface where store owners manage their operations:

**Core Modules:**
- **Dashboard** - Business analytics, sales metrics, recent activity
- **Customer Management** - User accounts, activity monitoring, support tickets
- **Product Management** - Inventory control, product catalog, pricing
- **Order Management** - Order processing, fulfillment, shipping
- **Storefront Management** - Configure customer-facing store appearance
- **Warehouse Operations** - Inventory tracking, stock management
- **Marketing Tools** - Promotions, loyalty programs, affiliate management
- **Analytics & Reporting** - Business intelligence, performance metrics
- **Marketplace Integration** - Connect to external platforms (Shopify, Amazon, etc.)

#### 2. **Storefront** (Customer-Facing E-commerce)
The public-facing online store where end customers shop:

**Customer Features:**
- **Product Browsing** - Searchable catalog with detailed specifications
- **User Authentication** - Registration, login, profile management
- **Shopping Cart** - Add to cart, checkout, payment processing
- **Order Tracking** - Real-time shipping updates with detailed timeline
- **Loyalty Program** - Point earning and redemption system
- **Customer Support** - Warranty claims, support tickets
- **Social Features** - Product reviews, ratings, wishlist

## Technology Stack

### Frontend Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development and production builds)
- **UI Library**: shadcn/ui (high-quality component system)
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **Icons**: Lucide React (beautiful SVG icon library)
- **Routing**: React Router v6 (client-side routing)
- **State Management**: React Query + Context API
- **PWA**: Service Worker enabled for offline functionality

### Development Tools
- **Language**: TypeScript (type-safe JavaScript)
- **Linting**: ESLint with TypeScript rules
- **Package Manager**: npm/bun
- **Version Control**: Git

### Mobile Optimization
- **Design**: Mobile-first responsive design
- **Navigation**: Bottom tab navigation for mobile users
- **Performance**: Optimized for mobile networks and devices
- **PWA**: Progressive Web App capabilities

## Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── common/             # Shared components (Header, Navigation)
│   ├── sections/           # Page-specific sections
│   └── ui/                # shadcn/ui base components
├── pages/                  # Application pages and routes
│   ├── admin/             # Admin dashboard pages
│   └── storefront/        # Customer-facing pages
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
├── assets/                # Static assets (images, icons)
└── types/                 # TypeScript type definitions
```

## Key Features

### B2B Platform Features
- **Multi-Tenant Architecture** - Support multiple businesses on one platform
- **White-Label Branding** - Customizable storefront themes and branding
- **Comprehensive Analytics** - Sales reports, customer insights, inventory tracking
- **Inventory Management** - Real-time stock tracking, automated reordering
- **Order Fulfillment** - Integrated shipping, tracking, and customer notifications
- **Customer Relationship Management** - Customer profiles, support tickets, communication tools

### E-commerce Features
- **Product Catalog Management** - Rich product descriptions, images, specifications
- **Shopping Cart & Checkout** - Smooth purchase flow with multiple payment options
- **User Account System** - Customer registration, profiles, order history
- **Loyalty & Rewards** - Point-based system with gamification elements
- **Mobile Optimization** - Responsive design for all device sizes
- **SEO Optimization** - Search engine friendly URLs and metadata

### Advanced Features
- **Real-time Order Tracking** - Live shipping updates and delivery notifications
- **Affiliate Program** - Referral system with commission tracking
- **Warranty Management** - Digital warranty claims and tracking
- **Marketplace Integration** - Sync with external platforms
- **Gamification** - Spin-to-win, achievements, and engagement features

## Getting Started

### Prerequisites
- Node.js 16.0 or later
- npm or bun package manager
- Git for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/aswinda/rexus-project.git

# Navigate to project directory
cd smartseller-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint for code quality checks
npm run type-check       # Run TypeScript compiler checks

# Build Variants
npm run build:dev        # Development build with debugging enabled
```

## Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# The build artifacts will be stored in the 'dist/' directory
```

### Environment Configuration
Create environment files for different stages:
- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Multi-Tenant Considerations

### Current State
- Single-tenant implementation (Rexus store)
- Hardcoded branding and configuration
- Direct database connections

### Future Multi-Tenant Architecture
- **Tenant Isolation** - Separate data and configurations per business
- **Dynamic Branding** - Runtime theme and branding customization
- **Scalable Infrastructure** - Support for thousands of storefronts
- **API Gateway** - Centralized routing and tenant resolution

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test thoroughly on mobile and desktop
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **TypeScript**: All code must be properly typed
- **ESLint**: Follow the established linting rules
- **Component Structure**: Use functional components with hooks
- **Responsive Design**: Ensure mobile-first approach
- **Accessibility**: Follow WCAG guidelines for accessibility

## Roadmap

### Phase 1: Foundation (Current)
- ✅ Single-tenant storefront implementation
- ✅ Admin dashboard with core features
- ✅ Product and order management
- ✅ Customer loyalty system

### Phase 2: Multi-Tenant Platform
- 🔄 Multi-tenant architecture implementation
- 🔄 Dynamic branding and theming system
- 🔄 Tenant management dashboard
- 🔄 API gateway and tenant routing

### Phase 3: Advanced Features
- 📋 AI-powered analytics and recommendations
- 📋 Advanced inventory forecasting
- 📋 Integrated marketing automation
- 📋 Mobile app development

### Phase 4: Enterprise Features
- 📋 Advanced reporting and business intelligence
- 📋 Enterprise integrations (ERP, CRM)
- 📋 White-label mobile applications
- 📋 Advanced security and compliance features

## License

This project is proprietary software owned by SmartSeller. All rights reserved.

## Contact

For technical support or business inquiries:
- **Development Team**: dev@smartseller.com
- **Business Development**: business@smartseller.com
- **Support**: support@smartseller.com

---

**SmartSeller** - Empowering businesses to build exceptional online stores.
