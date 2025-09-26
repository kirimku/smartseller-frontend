/**
 * Order-related type definitions
 */

import type { CustomerAddress, CustomerUser } from './user';
import type { Product, ProductVariant } from './product';

/**
 * Order line item (product in an order)
 */
export interface OrderLineItem {
  id: string;
  orderId: string;
  
  // Product information
  productId: string;
  variantId?: string;
  productName: string;
  productSku: string;
  variantTitle?: string;
  
  // Pricing
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  discountAmount?: number;
  
  // Product snapshot at time of order
  productSnapshot: {
    name: string;
    description?: string;
    image?: string;
    weight?: number;
    requires_shipping: boolean;
  };
  
  // Fulfillment
  fulfillmentStatus: 'pending' | 'fulfilled' | 'partially_fulfilled' | 'restocked';
  quantityFulfilled: number;
  quantityToFulfill: number;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Order shipping information
 */
export interface OrderShipping {
  address: CustomerAddress;
  method: string;
  methodTitle: string;
  cost: number;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  
  // Shipping status
  status: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'exception' | 'returned';
  shippedAt?: string;
  deliveredAt?: string;
}

/**
 * Order payment information
 */
export interface OrderPayment {
  id: string;
  orderId: string;
  
  // Payment details
  method: string; // 'stripe', 'paypal', 'cash', etc.
  methodTitle: string;
  amount: number;
  currency: string;
  
  // Transaction details
  transactionId?: string;
  gatewayTransactionId?: string;
  
  // Status
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  
  // Timestamps
  processedAt?: string;
  failedAt?: string;
  refundedAt?: string;
  
  // Additional data from payment gateway
  gatewayData?: Record<string, unknown>;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Order discount/coupon
 */
export interface OrderDiscount {
  id: string;
  code?: string;
  title: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  amount: number; // calculated discount amount
  
  // Applied to
  appliesTo: 'order' | 'shipping' | 'product';
  productIds?: string[];
}

/**
 * Order fulfillment
 */
export interface OrderFulfillment {
  id: string;
  orderId: string;
  
  // Fulfillment details
  status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
  method: 'shipping' | 'pickup' | 'digital';
  
  // Line items included in this fulfillment
  lineItems: {
    lineItemId: string;
    quantity: number;
  }[];
  
  // Shipping details (if applicable)
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  shippingMethod?: string;
  
  // Timestamps
  fulfilledAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  
  // Notes
  notes?: string;
  notifyCustomer: boolean;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Order refund
 */
export interface OrderRefund {
  id: string;
  orderId: string;
  
  // Refund details
  amount: number;
  reason: string;
  note?: string;
  
  // Line items being refunded
  lineItems?: {
    lineItemId: string;
    quantity: number;
    amount: number;
  }[];
  
  // Shipping refund
  shippingRefund?: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Gateway details
  gatewayRefundId?: string;
  gatewayData?: Record<string, unknown>;
  
  // Timestamps
  processedAt?: string;
  completedAt?: string;
  
  createdAt: string;
  createdBy: string;
}

/**
 * Order note/comment
 */
export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  isPrivate: boolean; // private notes not visible to customer
  createdBy: string;
  createdAt: string;
}

/**
 * Order timeline event
 */
export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  type: 'created' | 'payment' | 'fulfillment' | 'shipping' | 'delivery' | 'cancellation' | 'refund' | 'note';
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
}

/**
 * Main order interface
 */
export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  
  // Customer information
  customerId?: string;
  customer?: CustomerUser;
  
  // Guest customer info (if no account)
  guestCustomer?: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  
  // Contact information
  email: string;
  phone?: string;
  
  // Addresses
  billingAddress: CustomerAddress;
  shippingAddress: CustomerAddress;
  
  // Order details
  currency: string;
  subtotalPrice: number;
  totalTax: number;
  totalShipping: number;
  totalDiscounts: number;
  totalPrice: number;
  
  // Line items
  lineItems: OrderLineItem[];
  lineItemsCount: number;
  
  // Discounts and coupons
  discounts: OrderDiscount[];
  couponCode?: string;
  
  // Status
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'draft';
  financialStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'partially_refunded' | 'voided';
  fulfillmentStatus: 'pending' | 'fulfilled' | 'partially_fulfilled' | 'unfulfilled';
  
  // Shipping
  shipping?: OrderShipping;
  requiresShipping: boolean;
  
  // Payments
  payments: OrderPayment[];
  
  // Fulfillments and refunds
  fulfillments: OrderFulfillment[];
  refunds: OrderRefund[];
  
  // Additional data
  notes: OrderNote[];
  timeline: OrderTimelineEvent[];
  tags?: string[];
  
  // Source information
  source: 'web' | 'mobile' | 'pos' | 'admin' | 'api';
  sourceIdentifier?: string;
  
  // Marketing attribution
  referrer?: string;
  landingPageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  closedAt?: string;
  
  // User who created/modified
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Order search filters
 */
export interface OrderFilters {
  search?: string;
  customerId?: string;
  status?: Order['status'][];
  financialStatus?: Order['financialStatus'][];
  fulfillmentStatus?: Order['fulfillmentStatus'][];
  minAmount?: number;
  maxAmount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  source?: Order['source'][];
  tags?: string[];
  sortBy?: 'created' | 'updated' | 'amount' | 'customer';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Order analytics data
 */
export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate?: number;
  
  // Status breakdown
  statusBreakdown: {
    status: Order['status'];
    count: number;
    percentage: number;
  }[];
  
  // Time-based data
  period: {
    start: string;
    end: string;
  };
  
  // Trends
  revenueGrowth?: number;
  orderGrowth?: number;
  
  // Top products/customers
  topProducts?: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
  
  topCustomers?: {
    customerId: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
  }[];
}

/**
 * Shopping cart item (pre-order)
 */
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Product snapshot
  product: Pick<Product, 'name' | 'images' | 'status'>;
  variant?: Pick<ProductVariant, 'sku' | 'options' | 'image'>;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Shopping cart
 */
export interface Cart {
  id: string;
  tenantId: string;
  customerId?: string;
  sessionId?: string;
  
  items: CartItem[];
  itemCount: number;
  
  // Pricing
  subtotalPrice: number;
  totalDiscounts: number;
  estimatedTax: number;
  estimatedShipping: number;
  totalPrice: number;
  
  // Applied discounts
  discounts: OrderDiscount[];
  couponCode?: string;
  
  // Shipping estimate
  shippingAddress?: Partial<CustomerAddress>;
  
  // Metadata
  notes?: string;
  customAttributes?: Record<string, string>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}