# SmartSeller Multi-Tenant Database Schema Design

## Overview

This document outlines the comprehensive database schema design for the SmartSeller multi-tenant B2B e-commerce platform. The design implements a **hybrid multi-tenant architecture** with separate databases per tenant for complete data isolation while maintaining shared platform resources.

## Table of Contents
1. [Database Architecture Strategy](#database-architecture-strategy)
2. [Platform Database Schema](#platform-database-schema)
3. [Tenant Database Schema](#tenant-database-schema)
4. [Multi-Tenant Considerations](#multi-tenant-considerations)
5. [Security and Isolation](#security-and-isolation)
6. [Performance Optimization](#performance-optimization)
7. [Backup and Recovery](#backup-and-recovery)
8. [Migration Strategies](#migration-strategies)

## Database Architecture Strategy

### Architecture Choice: Separate Databases per Tenant

We've chosen the **separate database per tenant** approach for the following reasons:

#### Advantages:
- **Complete Data Isolation**: No risk of data leakage between tenants
- **Independent Scaling**: Each tenant database can be scaled independently
- **Customizable Schema**: Tenants can have custom fields without affecting others
- **Compliance**: Easier to meet regulatory requirements (GDPR, data residency)
- **Backup/Recovery**: Tenant-specific backup and restore operations
- **Performance**: No cross-tenant query interference

#### Trade-offs:
- **Resource Usage**: Higher database resource requirements
- **Management Complexity**: Multiple databases to maintain
- **Cross-tenant Analytics**: Requires aggregation layer

### Database Technology Stack

```yaml
Primary Database: PostgreSQL 15+
Reasons:
  - Excellent multi-tenant capabilities
  - JSONB support for flexible schema
  - Strong ACID compliance
  - Advanced indexing options
  - Template database support

Connection Pooling: PgBouncer
Cache Layer: Redis 7+
Search Engine: Elasticsearch 8+ (optional)
Analytics Database: ClickHouse (optional)
```

## Platform Database Schema

The platform database contains shared resources and tenant management information.

### Database Name: `smartseller_platform`

```sql
-- Platform Database Schema
CREATE DATABASE smartseller_platform;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =============================================
-- 1. TENANT MANAGEMENT TABLES
-- =============================================

-- Core tenant information
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE, -- Custom domain (optional)
    subdomain VARCHAR(50) UNIQUE, -- tenant.smartseller.com
    status VARCHAR(20) NOT NULL DEFAULT 'pending_setup' 
        CHECK (status IN ('active', 'suspended', 'pending_setup', 'cancelled')),
    plan_type VARCHAR(20) NOT NULL DEFAULT 'basic'
        CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
    database_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Contact information
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    contact_name VARCHAR(255),
    
    -- Configuration
    theme_config JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Billing information
    billing_email VARCHAR(255),
    tax_id VARCHAR(100),
    billing_address JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Tenant plans and pricing
CREATE TABLE tenant_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Limits
    max_products INTEGER,
    max_orders_per_month INTEGER,
    max_customers INTEGER,
    max_staff_users INTEGER,
    max_file_storage_gb INTEGER,
    max_api_calls_per_hour INTEGER,
    
    -- Pricing
    monthly_price DECIMAL(10,2),
    annual_price DECIMAL(10,2),
    setup_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Features
    features JSONB DEFAULT '{}', -- Available features for this plan
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Can customers sign up for this plan
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO tenant_plans (name, display_name, description, max_products, max_orders_per_month, max_customers, max_staff_users, max_file_storage_gb, max_api_calls_per_hour, monthly_price, annual_price, features) VALUES
('basic', 'Basic', 'Perfect for small businesses', 100, 500, 1000, 3, 5, 1000, 29.00, 290.00, '{"analytics": false, "advanced_reports": false, "api_access": false, "custom_domain": false}'),
('premium', 'Premium', 'For growing businesses', 1000, 2000, 10000, 10, 25, 5000, 79.00, 790.00, '{"analytics": true, "advanced_reports": true, "api_access": true, "custom_domain": false}'),
('enterprise', 'Enterprise', 'For large businesses', -1, -1, -1, -1, 100, 20000, 199.00, 1990.00, '{"analytics": true, "advanced_reports": true, "api_access": true, "custom_domain": true, "white_label": true}');

-- =============================================
-- 2. USER MANAGEMENT TABLES
-- =============================================

-- Platform users (SmartSeller staff)
CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    role VARCHAR(50) NOT NULL DEFAULT 'support'
        CHECK (role IN ('super_admin', 'admin', 'support', 'developer')),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Tenant user access (which platform users can access which tenants)
CREATE TABLE tenant_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    
    permissions JSONB DEFAULT '{}', -- Custom permissions override
    
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES platform_users(id),
    
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(platform_user_id, tenant_id)
);

-- =============================================
-- 3. BILLING AND SUBSCRIPTIONS
-- =============================================

-- Tenant subscriptions
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES tenant_plans(id),
    
    -- Subscription details
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'past_due', 'suspended')),
    
    -- Billing cycle
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'annual')),
    
    -- Pricing (stored at time of subscription)
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Dates
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    trial_end DATE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment
    payment_method VARCHAR(50), -- stripe, paypal, bank_transfer
    external_subscription_id VARCHAR(255), -- ID from payment provider
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing history
CREATE TABLE billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID REFERENCES tenant_subscriptions(id),
    
    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Dates
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Payment
    payment_method VARCHAR(50),
    external_payment_id VARCHAR(255),
    
    -- Invoice content
    line_items JSONB NOT NULL DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. PLATFORM ANALYTICS
-- =============================================

-- Platform-wide metrics (aggregated daily)
CREATE TABLE platform_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Tenant metrics
    total_tenants INTEGER DEFAULT 0,
    active_tenants INTEGER DEFAULT 0,
    new_tenants INTEGER DEFAULT 0,
    churned_tenants INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    recurring_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Usage metrics
    total_orders INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(date)
);

-- System configuration
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can tenants read this setting?
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. AUDIT AND LOGGING
-- =============================================

-- Platform audit log
CREATE TABLE platform_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id), -- NULL for platform-level actions
    user_id UUID REFERENCES platform_users(id),
    
    action VARCHAR(100) NOT NULL, -- create_tenant, update_plan, etc.
    resource_type VARCHAR(50) NOT NULL, -- tenant, user, subscription
    resource_id UUID,
    
    -- Details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Tenants table indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan_type ON tenants(plan_type);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- Platform users indexes
CREATE INDEX idx_platform_users_email ON platform_users(email);
CREATE INDEX idx_platform_users_role ON platform_users(role);

-- Tenant access indexes
CREATE INDEX idx_tenant_access_user ON tenant_access(platform_user_id);
CREATE INDEX idx_tenant_access_tenant ON tenant_access(tenant_id);
CREATE INDEX idx_tenant_access_role ON tenant_access(role);

-- Subscription indexes
CREATE INDEX idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON tenant_subscriptions(current_period_end);

-- Billing indexes
CREATE INDEX idx_invoices_tenant ON billing_invoices(tenant_id);
CREATE INDEX idx_invoices_status ON billing_invoices(status);
CREATE INDEX idx_invoices_due_date ON billing_invoices(due_date);

-- Audit log indexes
CREATE INDEX idx_audit_tenant ON platform_audit_log(tenant_id);
CREATE INDEX idx_audit_user ON platform_audit_log(user_id);
CREATE INDEX idx_audit_action ON platform_audit_log(action);
CREATE INDEX idx_audit_created_at ON platform_audit_log(created_at);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_users_updated_at BEFORE UPDATE ON platform_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at BEFORE UPDATE ON billing_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate tenant database name
CREATE OR REPLACE FUNCTION generate_tenant_database_name(tenant_slug VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'smartseller_' || tenant_slug;
END;
$$ LANGUAGE plpgsql;
```

## Tenant Database Schema

Each tenant gets their own database created from a template. This ensures complete data isolation and allows for tenant-specific customizations.

### Template Database: `smartseller_tenant_template`

```sql
-- Tenant Database Template
CREATE DATABASE smartseller_tenant_template;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. PRODUCT MANAGEMENT
-- =============================================

-- Product categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Display
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product brands
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    
    -- Categorization
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    
    -- Pricing
    price DECIMAL(12,2) NOT NULL,
    compare_at_price DECIMAL(12,2), -- Original price for discounts
    cost_price DECIMAL(12,2), -- Cost for profit calculations
    
    -- Physical attributes
    weight DECIMAL(8,2), -- in grams
    length DECIMAL(8,2), -- in cm
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    
    -- Inventory
    track_inventory BOOLEAN DEFAULT true,
    inventory_quantity INTEGER DEFAULT 0,
    allow_backorder BOOLEAN DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 10,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
    visibility VARCHAR(20) DEFAULT 'visible'
        CHECK (visibility IN ('visible', 'hidden', 'catalog_only')),
    
    -- SEO and metadata
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    
    -- Additional data
    tags TEXT[], -- Array of tags
    features JSONB DEFAULT '{}', -- Key-value pairs for product features
    specifications JSONB DEFAULT '{}', -- Technical specifications
    variants JSONB DEFAULT '[]', -- Product variants (size, color, etc.)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Product images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    
    -- Image metadata
    filename VARCHAR(255),
    size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    mime_type VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product reviews
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL, -- References customers table
    order_id UUID, -- Optional reference to order
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Metadata
    helpful_votes INTEGER DEFAULT 0,
    is_verified_purchase BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. CUSTOMER MANAGEMENT
-- =============================================

-- Customer accounts
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic information
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Preferences
    marketing_consent BOOLEAN DEFAULT false,
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Loyalty program
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(20) DEFAULT 'bronze'
        CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Statistics
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Customer addresses
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Address information
    type VARCHAR(20) DEFAULT 'shipping' -- shipping, billing, both
        CHECK (type IN ('shipping', 'billing', 'both')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL, -- ISO country code
    
    -- Status
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. ORDER MANAGEMENT
-- =============================================

-- Shopping carts (for persistent carts)
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest carts
    
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Discounts
    coupon_code VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    
    -- Product variant information (if applicable)
    variant_info JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer information
    customer_id UUID REFERENCES customers(id),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed')),
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled'
        CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    
    -- Financial details
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Shipping information
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_method VARCHAR(100),
    shipping_carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_gateway VARCHAR(50),
    
    -- Additional information
    notes TEXT,
    tags TEXT[],
    discount_codes VARCHAR(50)[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Product information (snapshot at time of order)
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    variant_info JSONB DEFAULT '{}',
    
    -- Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Fulfillment
    quantity_fulfilled INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order status history
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    
    comment TEXT,
    updated_by VARCHAR(100), -- User ID or system
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. MARKETING AND PROMOTIONS
-- =============================================

-- Discount codes and coupons
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Discount type and value
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL,
    
    -- Usage limits
    usage_limit INTEGER, -- NULL for unlimited
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_customer INTEGER,
    
    -- Conditions
    minimum_order_amount DECIMAL(10,2),
    applicable_products UUID[], -- Array of product IDs
    applicable_categories UUID[], -- Array of category IDs
    
    -- Validity
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email marketing campaigns
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    
    -- Content
    html_content TEXT,
    text_content TEXT,
    
    -- Targeting
    customer_segment JSONB DEFAULT '{}', -- Criteria for targeting
    
    -- Scheduling
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Statistics
    recipients_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. ANALYTICS AND REPORTING
-- =============================================

-- Daily analytics snapshots
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Sales metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    
    -- Product metrics
    units_sold INTEGER DEFAULT 0,
    
    -- Traffic metrics (if integrated)
    website_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(date)
);

-- =============================================
-- 6. CONFIGURATION AND SETTINGS
-- =============================================

-- Tenant-specific settings
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook endpoints
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    
    -- Events to listen for
    events TEXT[] NOT NULL, -- Array of event names
    
    -- Security
    secret VARCHAR(255), -- For signature verification
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Headers
    custom_headers JSONB DEFAULT '{}',
    
    -- Statistics
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Products indexes
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Customers indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier);

-- Orders indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Analytics indexes
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Updated_at triggers (same as platform database)
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number generation function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    counter INTEGER;
BEGIN
    -- Get current year and month
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || 
           LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0')
    INTO new_number;
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM 7)::INTEGER), 0) + 1
    FROM orders 
    WHERE order_number LIKE new_number || '%'
    INTO counter;
    
    -- Format: YYYYMM000001
    new_number := new_number || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger 
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'delivered' THEN
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount
        WHERE id = NEW.customer_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'delivered' AND NEW.status = 'delivered' THEN
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount
        WHERE id = NEW.customer_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'delivered' AND NEW.status != 'delivered' THEN
        UPDATE customers 
        SET total_orders = total_orders - 1,
            total_spent = total_spent - OLD.total_amount
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Initialize default settings for new tenant
INSERT INTO settings (key, value, description) VALUES
('store_name', '"My Store"', 'Store display name'),
('store_email', '"store@example.com"', 'Store contact email'),
('currency', '"USD"', 'Default store currency'),
('timezone', '"UTC"', 'Store timezone'),
('tax_rate', '0', 'Default tax rate (decimal)'),
('shipping_rates', '[]', 'Shipping rate configuration'),
('email_templates', '{}', 'Email template configurations'),
('theme_settings', '{}', 'Theme and appearance settings');
```

## Multi-Tenant Considerations

### Database Creation Process

```sql
-- Function to create a new tenant database
CREATE OR REPLACE FUNCTION create_tenant_database(tenant_slug VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    db_name VARCHAR;
BEGIN
    db_name := 'smartseller_' || tenant_slug;
    
    -- Create database from template
    EXECUTE format('CREATE DATABASE %I WITH TEMPLATE smartseller_tenant_template', db_name);
    
    -- Update tenant record
    UPDATE tenants 
    SET database_name = db_name,
        status = 'active',
        activated_at = CURRENT_TIMESTAMP
    WHERE slug = tenant_slug;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create tenant database: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to drop tenant database (use with caution!)
CREATE OR REPLACE FUNCTION drop_tenant_database(tenant_slug VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    db_name VARCHAR;
BEGIN
    db_name := 'smartseller_' || tenant_slug;
    
    -- Terminate active connections
    PERFORM pg_terminate_backend(pid)
    FROM pg_stat_activity 
    WHERE datname = db_name AND pid != pg_backend_pid();
    
    -- Drop database
    EXECUTE format('DROP DATABASE IF EXISTS %I', db_name);
    
    -- Update tenant record
    UPDATE tenants 
    SET status = 'cancelled',
        suspended_at = CURRENT_TIMESTAMP
    WHERE slug = tenant_slug;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to drop tenant database: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

### Connection Management

```typescript
// TypeScript interface for database connection management
interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeout: number;
}

class TenantDatabaseManager {
  private platformConnection: DatabaseConnection;
  private tenantConnections: Map<string, ConnectionPool> = new Map();

  async getTenantConnection(tenantId: string): Promise<ConnectionPool> {
    if (!this.tenantConnections.has(tenantId)) {
      const tenant = await this.getTenantInfo(tenantId);
      const config: DatabaseConnectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: tenant.database_name,
        username: process.env.DB_USER || 'smartseller',
        password: process.env.DB_PASSWORD,
        ssl: process.env.NODE_ENV === 'production',
        maxConnections: 10,
        idleTimeout: 30000,
      };
      
      const pool = new ConnectionPool(config);
      this.tenantConnections.set(tenantId, pool);
    }
    
    return this.tenantConnections.get(tenantId);
  }

  async createTenantDatabase(tenantSlug: string): Promise<boolean> {
    const result = await this.platformConnection.query(
      'SELECT create_tenant_database($1) as success',
      [tenantSlug]
    );
    
    return result.rows[0].success;
  }
}
```

## Security and Isolation

### Row Level Security (Additional Protection)

Even though we use separate databases, we can implement additional security measures:

```sql
-- Enable RLS on sensitive tables (if needed for shared services)
ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy to ensure users only see their tenant's audit logs
CREATE POLICY tenant_audit_isolation ON platform_audit_log
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Set tenant context at connection level
SELECT set_config('app.current_tenant_id', 'tenant-uuid-here', false);
```

### Backup Strategy

```sql
-- Automated backup function
CREATE OR REPLACE FUNCTION backup_tenant_database(tenant_slug VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    db_name VARCHAR;
    backup_path VARCHAR;
BEGIN
    db_name := 'smartseller_' || tenant_slug;
    backup_path := '/backups/' || db_name || '_' || to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD_HH24-MI-SS') || '.dump';
    
    -- Execute pg_dump (requires appropriate permissions)
    PERFORM pg_dump(db_name, backup_path);
    
    -- Log backup completion
    INSERT INTO platform_audit_log (tenant_id, action, resource_type, metadata)
    SELECT t.id, 'database_backup', 'tenant', jsonb_build_object('backup_path', backup_path)
    FROM tenants t
    WHERE t.slug = tenant_slug;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Backup failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimization

### Connection Pooling Configuration

```yaml
# PgBouncer configuration for multi-tenant setup
[databases]
smartseller_platform = host=localhost port=5432 dbname=smartseller_platform
smartseller_* = host=localhost port=5432

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
max_db_connections = 100
reserve_pool_size = 5
server_lifetime = 3600
server_idle_timeout = 600
```

### Monitoring and Alerting

```sql
-- View for monitoring tenant database sizes
CREATE VIEW tenant_database_sizes AS
SELECT 
    t.slug as tenant_slug,
    t.name as tenant_name,
    t.status,
    pg_size_pretty(pg_database_size(t.database_name)) as database_size,
    pg_database_size(t.database_name) as size_bytes
FROM tenants t
WHERE t.status = 'active'
ORDER BY pg_database_size(t.database_name) DESC;

-- View for connection monitoring
CREATE VIEW tenant_connection_stats AS
SELECT 
    t.slug as tenant_slug,
    sa.datname as database_name,
    COUNT(*) as active_connections,
    COUNT(*) FILTER (WHERE sa.state = 'active') as active_queries,
    COUNT(*) FILTER (WHERE sa.state = 'idle') as idle_connections
FROM pg_stat_activity sa
JOIN tenants t ON sa.datname = t.database_name
WHERE sa.datname LIKE 'smartseller_%'
GROUP BY t.slug, sa.datname
ORDER BY active_connections DESC;
```

## Backup and Recovery

### Backup Strategy

```bash
#!/bin/bash
# Multi-tenant backup script

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup platform database
pg_dump -h localhost -U smartseller smartseller_platform > "$BACKUP_DIR/platform.sql"

# Backup all tenant databases
psql -h localhost -U smartseller -d smartseller_platform -t -c "SELECT slug FROM tenants WHERE status = 'active'" | while read tenant_slug; do
    if [ ! -z "$tenant_slug" ]; then
        db_name="smartseller_$(echo $tenant_slug | xargs)"
        pg_dump -h localhost -U smartseller "$db_name" > "$BACKUP_DIR/${tenant_slug}.sql"
        echo "Backed up $db_name"
    fi
done

# Compress backups
tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname $BACKUP_DIR)" "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo "Multi-tenant backup completed: $BACKUP_DIR.tar.gz"
```

### Recovery Procedures

```bash
#!/bin/bash
# Tenant database recovery script

TENANT_SLUG=$1
BACKUP_FILE=$2

if [ -z "$TENANT_SLUG" ] || [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <tenant_slug> <backup_file>"
    exit 1
fi

DB_NAME="smartseller_$TENANT_SLUG"

# Drop existing database
dropdb -h localhost -U smartseller "$DB_NAME" --if-exists

# Create new database
createdb -h localhost -U smartseller "$DB_NAME"

# Restore from backup
psql -h localhost -U smartseller -d "$DB_NAME" < "$BACKUP_FILE"

echo "Database $DB_NAME restored from $BACKUP_FILE"
```

## Migration Strategies

### Schema Versioning

```sql
-- Schema version tracking table (in both platform and tenant databases)
CREATE TABLE schema_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial version
INSERT INTO schema_versions (version, description) VALUES ('1.0.0', 'Initial schema');
```

### Tenant Migration Runner

```typescript
interface Migration {
  version: string;
  description: string;
  up: string; // SQL for applying migration
  down: string; // SQL for rolling back migration
}

class TenantMigrationRunner {
  async runMigration(tenantId: string, migration: Migration): Promise<boolean> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      await connection.beginTransaction();
      
      // Apply migration
      await connection.query(migration.up);
      
      // Record migration
      await connection.query(`
        INSERT INTO schema_versions (version, description) 
        VALUES ($1, $2)
      `, [migration.version, migration.description]);
      
      await connection.commitTransaction();
      return true;
      
    } catch (error) {
      await connection.rollbackTransaction();
      console.error(`Migration failed for tenant ${tenantId}:`, error);
      return false;
    }
  }

  async runMigrationForAllTenants(migration: Migration): Promise<void> {
    const tenants = await this.getActiveTenants();
    
    for (const tenant of tenants) {
      const success = await this.runMigration(tenant.id, migration);
      console.log(`Migration ${migration.version} for tenant ${tenant.slug}: ${success ? 'SUCCESS' : 'FAILED'}`);
    }
  }
}
```

This comprehensive database schema design provides a solid foundation for the SmartSeller multi-tenant B2B e-commerce platform, ensuring complete tenant isolation, scalability, and maintainability while supporting all the required business functionality.