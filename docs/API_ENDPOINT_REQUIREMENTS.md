# SmartSeller Multi-Tenant API Endpoint Requirements

## Overview

This document defines the comprehensive API endpoints required for the SmartSeller multi-tenant B2B e-commerce platform. The API structure supports three main user types: Platform Administrators, Tenant Administrators, and Customers.

## API Architecture

### Base URL Structure
```
https://api.smartseller.com/v1
├── /platform/*           # Platform management (SmartSeller admin)
├── /tenants/:tenantId/*   # Tenant-specific operations
└── /storefront/:slug/*    # Public storefront APIs
```

## Table of Contents
1. [API Architecture Overview](#api-architecture-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Warranty Management Endpoints](#warranty-management-endpoints)
4. [Claim Management Endpoints](#claim-management-endpoints)
5. [Admin Management Endpoints](#admin-management-endpoints)
6. [File & Document Management](#file--document-management)
7. [Notification Endpoints](#notification-endpoints)
8. [Reporting & Analytics](#reporting--analytics)
9. [Integration Endpoints](#integration-endpoints)
10. [Error Handling & Response Codes](#error-handling--response-codes)

---

## API Architecture Overview

### Base URL Structure
```
Production: https://api.rexus.com/v1
Development: https://dev-api.rexus.com/v1
Staging: https://staging-api.rexus.com/v1
```

### API Standards
- **Protocol**: REST with JSON payloads
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: 1000 requests/hour for authenticated users
- **Versioning**: URL path versioning (/v1/)
- **Pagination**: Cursor-based pagination for large datasets
- **CORS**: Enabled for approved origins

### Common Headers
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
X-API-Version: v1
X-Request-ID: {unique_request_id}
```

---

## Authentication & Authorization

### 1. Customer Authentication

#### 1.1 Register Customer
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "phone": "+62812345678",
  "address": {
    "street": "Jl. Sudirman No. 123",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "postalCode": "12190",
    "country": "Indonesia"
  }
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "customer": {
      "id": "cust_001",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+62812345678",
      "isVerified": false,
      "createdAt": "2024-09-26T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "expiresIn": 3600
    }
  },
  "message": "Registration successful. Please verify your email."
}
```

#### 1.2 Customer Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

#### 1.3 Refresh Token
```http
POST /auth/refresh
Authorization: Bearer {refresh_token}
```

#### 1.4 Password Reset
```http
POST /auth/password-reset
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

### 2. Admin Authentication

#### 2.1 Admin Login
```http
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@rexus.com",
  "password": "adminPassword123",
  "role": "admin" // admin, technician, manager
}
```

#### 2.2 Admin Session Validation
```http
GET /auth/admin/validate
Authorization: Bearer {admin_jwt_token}
```

---

## Warranty Management Endpoints

### 1. Warranty Lookup & Registration

#### 1.1 Warranty Lookup by ID
```http
GET /warranty/lookup/{warrantyId}

Example: GET /warranty/lookup/REX24A7M9K2P8Q1N5
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "warranty": {
      "id": "warranty_001",
      "barcodeNumber": "REX24A7M9K2P8Q1N5",
      "product": {
        "id": "prod_001",
        "name": "Rexus Gaming Mouse RX-110",
        "sku": "RX-110",
        "category": "Mouse",
        "warrantyPeriod": 12
      },
      "status": "active",
      "purchaseDate": "2024-07-15",
      "expiryDate": "2025-07-15",
      "isRegistered": true,
      "customer": {
        "id": "cust_001",
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    }
  }
}
```

#### 1.2 Warranty Registration
```http
POST /warranty/register
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "barcodeNumber": "REX2024092600001",
  "purchaseDate": "2024-07-15",
  "retailerInfo": {
    "name": "Best Electronics",
    "location": "Jakarta",
    "invoiceNumber": "INV-2024-001234"
  },
  "serialNumber": "RX110SN001234"
}
```

#### 1.3 QR Code Scan Lookup
```http
POST /warranty/scan
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "qrCodeData": "https://warranty.rexus.com/claim/REX2024092600001"
}
```

#### 1.4 Customer Warranty History
```http
GET /warranty/history
Authorization: Bearer {customer_jwt_token}
Query Parameters:
- page: number (optional, default: 1)
- limit: number (optional, default: 20)
- status: string (optional: active, expired, claimed)
- sortBy: string (optional: purchaseDate, expiryDate)
- sortOrder: string (optional: asc, desc)
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "warranties": [
      {
        "id": "warranty_001",
        "barcodeNumber": "REX2024092600001",
        "product": {
          "id": "prod_001",
          "name": "Rexus Gaming Mouse RX-110",
          "image": "https://cdn.rexus.com/products/rx110.jpg"
        },
        "status": "active",
        "purchaseDate": "2024-07-15",
        "expiryDate": "2025-07-15",
        "hasClaim": true,
        "activeClaim": {
          "id": "claim_001",
          "claimNumber": "WC-2024-09-001",
          "status": "in_repair"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 2. Warranty Status Management

#### 2.1 Check Warranty Validity
```http
GET /warranty/{warrantyId}/validity
```

#### 2.2 Warranty Details
```http
GET /warranty/{warrantyId}/details
Authorization: Bearer {customer_jwt_token}
```

---

## Claim Management Endpoints

### 1. Customer Claim Operations

#### 1.1 Submit Warranty Claim
```http
POST /claims
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "warrantyId": "warranty_001",
  "issueDescription": "Mouse left click not working properly, sometimes double clicks",
  "issueCategory": "Hardware Malfunction",
  "issueDate": "2024-09-20",
  "severity": "medium",
  "customerInfo": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+62812345678",
    "pickupAddress": {
      "street": "Jl. Sudirman No. 123",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12190",
      "country": "Indonesia"
    }
  },
  "logisticsPreference": {
    "provider": "jne",
    "serviceType": "express",
    "pickupInstructions": "Please call before pickup"
  },
  "attachmentIds": ["att_001", "att_002"] // Reference uploaded files
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "claim": {
      "id": "claim_001",
      "claimNumber": "WC-2024-09-001",
      "status": "pending",
      "estimatedProcessingTime": "2-3 business days",
      "createdAt": "2024-09-26T10:30:00Z"
    }
  },
  "message": "Warranty claim submitted successfully. You will receive updates via email and SMS."
}
```

#### 1.2 Get Claim Details
```http
GET /claims/{claimId}
Authorization: Bearer {customer_jwt_token}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "claim": {
      "id": "claim_001",
      "claimNumber": "WC-2024-09-001",
      "status": "in_repair",
      "warranty": {
        "barcodeNumber": "REX2024092600001",
        "product": {
          "name": "Rexus Gaming Mouse RX-110",
          "image": "https://cdn.rexus.com/products/rx110.jpg"
        }
      },
      "timeline": [
        {
          "status": "submitted",
          "date": "2024-09-26T10:30:00Z",
          "description": "Claim submitted and assigned reference number"
        },
        {
          "status": "validated",
          "date": "2024-09-26T14:20:00Z",
          "description": "Claim validated and approved for repair"
        },
        {
          "status": "in_repair",
          "date": "2024-09-27T09:15:00Z",
          "description": "Product received at service center and repair started"
        }
      ],
      "estimatedCompletion": "2024-09-30",
      "trackingInfo": {
        "provider": "jne",
        "trackingNumber": "JNE123456789",
        "status": "in_transit"
      },
      "repairDetails": {
        "diagnosis": "Left click button needs replacement",
        "estimatedRepairTime": "2-3 days",
        "assignedTechnician": "Tech-001"
      }
    }
  }
}
```

#### 1.3 Get Customer Claims List
```http
GET /claims
Authorization: Bearer {customer_jwt_token}
Query Parameters:
- page: number (optional)
- limit: number (optional)
- status: string (optional)
- sortBy: string (optional)
- sortOrder: string (optional)
```

#### 1.4 Update Claim Information
```http
PATCH /claims/{claimId}
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "customerNotes": "Additional information about the issue",
  "pickupAddress": {
    // Updated address if needed
  }
}
```

#### 1.5 Cancel Claim
```http
DELETE /claims/{claimId}
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "reason": "Issue resolved by customer",
  "cancelledBy": "customer"
}
```

### 2. Claim Status Tracking

#### 2.1 Get Claim Status
```http
GET /claims/{claimId}/status
Authorization: Bearer {customer_jwt_token}
```

#### 2.2 Get Claim Timeline
```http
GET /claims/{claimId}/timeline
Authorization: Bearer {customer_jwt_token}
```

#### 2.3 Get Shipping Tracking
```http
GET /claims/{claimId}/tracking
Authorization: Bearer {customer_jwt_token}
```

---

## Admin Management Endpoints

### 1. Admin Dashboard & Analytics

#### 1.1 Dashboard Statistics
```http
GET /admin/dashboard/stats
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- period: string (optional: today, week, month, year)
- startDate: string (optional)
- endDate: string (optional)
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "overview": {
      "totalBarcodes": 15420,
      "activeBarcodes": 12850,
      "totalClaims": 324,
      "pendingClaims": 28,
      "inRepairClaims": 45,
      "completedClaims": 251
    },
    "trends": {
      "claimsThisMonth": 89,
      "claimsLastMonth": 76,
      "avgProcessingTime": "4.2 days",
      "customerSatisfaction": 4.6
    },
    "urgentActions": [
      {
        "type": "overdue_claims",
        "count": 5,
        "description": "Claims pending validation for over 3 days"
      }
    ]
  }
}
```

### 2. Barcode Management

#### 2.0 Secure Barcode Generation Algorithm

**Security Features:**
```
Format: REX[YY][RANDOM_12]
- REX: Brand identifier
- YY: Generation year (2 digits)
- RANDOM_12: Cryptographically secure random string

Character Set: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
- Total characters: 32 (excludes I, O, 1, 0 for clarity)
- Entropy per character: log2(32) = 5 bits
- Total entropy: 12 × 5 = 60 bits
- Total combinations: 32^12 ≈ 1.2 × 10^18

Generation Process:
1. Use CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
2. Generate 12-character random string from character set
3. Check database for uniqueness (collision detection)
4. Retry if duplicate found (extremely rare)
5. Store with generation metadata
```

**Collision Prevention:**
- Database unique constraint on barcode_number
- Retry mechanism with exponential backoff
- Maximum 3 retry attempts before error
- Collision probability: <0.001% even with 1 billion codes

**Performance Characteristics:**
- Generation time: ~2ms per code (including DB check)
- Batch generation: ~200ms per 100 codes
- Memory usage: Minimal (stateless generation)
- Scalability: Can generate millions without performance degradation

#### 2.1 Generate Barcodes
```http
POST /admin/barcodes/generate
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "productId": "prod_001",
  "quantity": 100,
  "batchInfo": {
    "batchNumber": "BATCH-2024-09-001",
    "destinationRetailer": "Best Electronics",
    "notes": "Q4 2024 production batch"
  }
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "batch": {
      "id": "batch_001",
      "batchNumber": "BATCH-2024-09-001",
      "productId": "prod_001",
      "quantity": 100,
      "generatedAt": "2024-09-26T10:30:00Z",
      "generationMethod": "CSPRNG",
      "entropy": 60,
      "sampleCodes": [
        "REX24A7M9K2P8Q1N5",
        "REX24H3R7F9L2X8M6",
        "REX24N9K5T4W7Q2P3"
      ],
      "statistics": {
        "totalPossibleCombinations": "1.2e+18",
        "collisionProbability": "<0.001%",
        "duplicatesChecked": 100,
        "generationTime": "0.24s"
      }
    },
    "downloadUrl": "https://api.rexus.com/admin/barcodes/batch_001/download"
  }
}
```

#### 2.2 List Barcodes
```http
GET /admin/barcodes
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- page: number
- limit: number
- productId: string (optional)
- status: string (optional)
- batchId: string (optional)
- search: string (optional)
```

#### 2.3 Barcode Details
```http
GET /admin/barcodes/{barcodeId}
Authorization: Bearer {admin_jwt_token}
```

#### 2.4 Update Barcode Status
```http
PATCH /admin/barcodes/{barcodeId}
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "status": "distributed",
  "distributedTo": "Best Electronics Jakarta",
  "distributionDate": "2024-09-27",
  "notes": "Shipped with product batch PRD-2024-001"
}
```

#### 2.5 Validate Barcode Format
```http
POST /admin/barcodes/validate-format
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "barcodeNumber": "REX24A7M9K2P8Q1N5"
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "isValid": true,
    "format": "REX[YY][RANDOM_12]",
    "components": {
      "prefix": "REX",
      "year": "24",
      "randomPart": "A7M9K2P8Q1N5"
    },
    "entropy": 60,
    "characterSet": "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  }
}
```

#### 2.6 Check Barcode Uniqueness
```http
POST /admin/barcodes/check-uniqueness
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "barcodeNumbers": ["REX24A7M9K2P8Q1N5", "REX24H3R7F9L2X8M6"]
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "results": [
      {
        "barcodeNumber": "REX24A7M9K2P8Q1N5",
        "isUnique": true,
        "exists": false
      },
      {
        "barcodeNumber": "REX24H3R7F9L2X8M6", 
        "isUnique": false,
        "exists": true,
        "existingId": "barcode_12345"
      }
    ],
    "statistics": {
      "totalChecked": 2,
      "uniqueCount": 1,
      "duplicateCount": 1
    }
  }
}
```

#### 2.7 Generation Statistics
```http
GET /admin/barcodes/generation-stats
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- period: string (optional: today, week, month, year)
- productId: string (optional)
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "totalGenerated": 1500000,
    "generationRate": "99.999%", // Success rate
    "collisionCount": 3, // Total collisions detected and resolved
    "collisionRate": "0.0002%",
    "averageGenerationTime": "1.8ms",
    "entropyUtilization": "0.000000000012%", // of total possible combinations
    "estimatedCapacity": "1.2e+18", // Total possible unique codes
    "recommendedAction": "continue", // continue, monitor, or scale
    "securityStatus": "excellent"
  }
}
```

### 3. Claims Administration

#### 3.1 List All Claims
```http
GET /admin/claims
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- page: number
- limit: number
- status: string (optional)
- priority: string (optional)
- assignedTo: string (optional)
- dateFrom: string (optional)
- dateTo: string (optional)
- search: string (optional)
- sortBy: string (optional)
- sortOrder: string (optional)
```

#### 3.2 Get Claim Details (Admin View)
```http
GET /admin/claims/{claimId}
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "claim": {
      "id": "claim_001",
      "claimNumber": "WC-2024-09-001",
      "status": "pending",
      "priority": "normal",
      "customer": {
        "id": "cust_001",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+62812345678",
        "registrationDate": "2024-07-15"
      },
      "warranty": {
        "id": "warranty_001",
        "barcodeNumber": "REX2024092600001",
        "product": {
          "id": "prod_001",
          "name": "Rexus Gaming Mouse RX-110",
          "sku": "RX-110",
          "category": "Mouse",
          "price": 150000
        },
        "purchaseDate": "2024-07-15",
        "expiryDate": "2025-07-15"
      },
      "issue": {
        "description": "Mouse left click not working properly",
        "category": "Hardware Malfunction",
        "severity": "medium",
        "reportedDate": "2024-09-20"
      },
      "attachments": [
        {
          "id": "att_001",
          "type": "image",
          "filename": "mouse_issue.jpg",
          "url": "https://storage.rexus.com/claims/claim_001/mouse_issue.jpg",
          "uploadedAt": "2024-09-26T10:30:00Z"
        }
      ],
      "timeline": [...],
      "adminNotes": [
        {
          "id": "note_001",
          "author": "admin_001",
          "content": "Customer provided clear photos of the issue",
          "createdAt": "2024-09-26T11:00:00Z"
        }
      ],
      "costs": {
        "estimatedRepairCost": 25000,
        "actualRepairCost": null,
        "shippingCost": 15000,
        "totalCost": null
      }
    }
  }
}
```

#### 3.3 Validate/Reject Claim
```http
PATCH /admin/claims/{claimId}/validate
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "action": "validate", // or "reject"
  "reason": "Claim approved - valid warranty and clear issue documentation",
  "assignedTechnician": "tech_001",
  "estimatedCompletionDate": "2024-09-30",
  "adminNotes": "Priority repair due to customer VIP status"
}
```

#### 3.4 Update Claim Status
```http
PATCH /admin/claims/{claimId}/status
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "status": "in_repair",
  "updatedBy": "admin_001",
  "notes": "Repair started by technician",
  "estimatedCompletion": "2024-09-30"
}
```

#### 3.5 Assign Technician
```http
PATCH /admin/claims/{claimId}/assign
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "technicianId": "tech_001",
  "priority": "high",
  "specialInstructions": "Handle with care - VIP customer",
  "estimatedHours": 4
}
```

#### 3.6 Add Admin Notes
```http
POST /admin/claims/{claimId}/notes
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "content": "Customer called to confirm pickup address",
  "isInternal": true, // false if customer should see the note
  "category": "communication"
}
```

### 4. Repair Management

#### 4.1 Create Repair Ticket
```http
POST /admin/repairs
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "claimId": "claim_001",
  "technicianId": "tech_001",
  "diagnosis": "Left click button needs replacement",
  "estimatedHours": 2,
  "requiredParts": [
    {
      "partNumber": "RX110-BTN-L001",
      "quantity": 1,
      "description": "Left click button assembly"
    }
  ],
  "specialInstructions": "Test thoroughly after repair"
}
```

#### 4.2 Update Repair Progress
```http
PATCH /admin/repairs/{repairId}/progress
Authorization: Bearer {technician_jwt_token}
Content-Type: application/json

{
  "status": "in_progress",
  "completedSteps": [
    {
      "stepId": "step_001",
      "description": "Disassembled mouse housing",
      "completedAt": "2024-09-27T09:30:00Z",
      "notes": "Found worn button mechanism"
    }
  ],
  "partsUsed": [
    {
      "partNumber": "RX110-BTN-L001",
      "quantity": 1,
      "cost": 15000
    }
  ],
  "laborHours": 1.5,
  "technicianNotes": "Repair progressing well, button replaced successfully"
}
```

#### 4.3 Complete Repair
```http
PATCH /admin/repairs/{repairId}/complete
Authorization: Bearer {technician_jwt_token}
Content-Type: application/json

{
  "qualityCheckPassed": true,
  "testResults": {
    "clickTest": "passed",
    "sensorTest": "passed",
    "connectionTest": "passed"
  },
  "finalNotes": "Repair completed successfully, all functions tested",
  "totalLaborHours": 2,
  "totalPartsCost": 15000,
  "beforePhotos": ["photo_001", "photo_002"],
  "afterPhotos": ["photo_003", "photo_004"]
}
```

### 5. Shipping & Logistics

#### 5.1 Initiate Shipping
```http
POST /admin/claims/{claimId}/shipping
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "provider": "jne",
  "serviceType": "express",
  "trackingNumber": "JNE123456789",
  "estimatedDelivery": "2024-09-30",
  "shippingCost": 15000,
  "packageInfo": {
    "weight": "0.5kg",
    "dimensions": "20x15x8cm",
    "contents": "Repaired gaming mouse"
  },
  "notes": "Handle with care - repaired electronics"
}
```

#### 5.2 Update Shipping Status
```http
PATCH /admin/claims/{claimId}/shipping/{shippingId}
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "status": "delivered",
  "deliveredAt": "2024-09-30T14:30:00Z",
  "receivedBy": "John Doe",
  "deliveryNotes": "Package delivered to customer directly"
}
```

### 6. User Management

#### 6.1 List Customers
```http
GET /admin/customers
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- page: number
- limit: number
- search: string (optional)
- status: string (optional)
- registeredFrom: string (optional)
- registeredTo: string (optional)
```

#### 6.2 Customer Details
```http
GET /admin/customers/{customerId}
Authorization: Bearer {admin_jwt_token}
```

#### 6.3 Customer Claims History
```http
GET /admin/customers/{customerId}/claims
Authorization: Bearer {admin_jwt_token}
```

#### 6.4 Customer Warranty History
```http
GET /admin/customers/{customerId}/warranties
Authorization: Bearer {admin_jwt_token}
```

---

## File & Document Management

### 1. File Upload Operations

#### 1.1 Upload Claim Attachment
```http
POST /uploads/claims/{claimId}/attachments
Authorization: Bearer {customer_jwt_token}
Content-Type: multipart/form-data

{
  "file": <binary_data>,
  "type": "receipt", // receipt, photo, document, invoice
  "description": "Purchase receipt from Best Electronics"
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "attachment": {
      "id": "att_001",
      "filename": "receipt_001.pdf",
      "originalName": "purchase_receipt.pdf",
      "type": "receipt",
      "size": 245760,
      "mimeType": "application/pdf",
      "url": "https://storage.rexus.com/claims/claim_001/receipt_001.pdf",
      "thumbnailUrl": "https://storage.rexus.com/claims/claim_001/thumbs/receipt_001.jpg",
      "uploadedAt": "2024-09-26T10:30:00Z"
    }
  }
}
```

#### 1.2 Upload Repair Photos
```http
POST /uploads/repairs/{repairId}/photos
Authorization: Bearer {technician_jwt_token}
Content-Type: multipart/form-data

{
  "file": <binary_data>,
  "type": "before", // before, after, process
  "description": "Before repair - showing damaged button"
}
```

#### 1.3 Get File Details
```http
GET /uploads/files/{fileId}
Authorization: Bearer {jwt_token}
```

#### 1.4 Delete File
```http
DELETE /uploads/files/{fileId}
Authorization: Bearer {jwt_token}
```

### 2. Document Generation

#### 2.1 Generate Warranty Certificate
```http
POST /documents/warranty-certificate
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "warrantyId": "warranty_001",
  "format": "pdf" // pdf, png
}
```

#### 2.2 Generate Claim Report
```http
POST /documents/claim-report/{claimId}
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "format": "pdf",
  "includeAttachments": true,
  "includeTimeline": true
}
```

#### 2.3 Generate Barcode Labels
```http
POST /documents/barcode-labels
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "batchId": "batch_001",
  "format": "pdf", // pdf, png
  "layout": "A4_24_labels", // Various label layouts
  "includeProductInfo": true
}
```

---

## Notification Endpoints

### 1. Email Notifications

#### 1.1 Send Claim Confirmation Email
```http
POST /notifications/email/claim-confirmation
Authorization: Bearer {system_jwt_token}
Content-Type: application/json

{
  "claimId": "claim_001",
  "customerEmail": "john.doe@example.com",
  "customMessage": "Additional information about your claim",
  "priority": "normal" // low, normal, high, urgent
}
```

#### 1.2 Send Status Update Email
```http
POST /notifications/email/status-update
Authorization: Bearer {system_jwt_token}
Content-Type: application/json

{
  "claimId": "claim_001",
  "newStatus": "in_repair",
  "customerEmail": "john.doe@example.com",
  "estimatedCompletion": "2024-09-30"
}
```

### 2. SMS Notifications

#### 2.1 Send SMS Update
```http
POST /notifications/sms/send
Authorization: Bearer {system_jwt_token}
Content-Type: application/json

{
  "phone": "+62812345678",
  "message": "Your warranty claim WC-2024-09-001 status has been updated to: In Repair. Est. completion: Sep 30.",
  "type": "status_update"
}
```

### 3. Push Notifications (if mobile app exists)

#### 3.1 Send Push Notification
```http
POST /notifications/push/send
Authorization: Bearer {system_jwt_token}
Content-Type: application/json

{
  "userId": "cust_001",
  "title": "Warranty Claim Update",
  "body": "Your claim is now being repaired",
  "data": {
    "claimId": "claim_001",
    "type": "status_update",
    "action": "view_claim"
  }
}
```

### 4. Notification Preferences

#### 4.1 Get User Notification Preferences
```http
GET /notifications/preferences
Authorization: Bearer {customer_jwt_token}
```

#### 4.2 Update Notification Preferences
```http
PATCH /notifications/preferences
Authorization: Bearer {customer_jwt_token}
Content-Type: application/json

{
  "email": {
    "claimUpdates": true,
    "promotional": false,
    "warrantyExpiry": true
  },
  "sms": {
    "critical": true,
    "statusUpdates": false
  },
  "push": {
    "all": true
  }
}
```

---

## Reporting & Analytics

### 1. Admin Reports

#### 1.1 Claims Analytics Report
```http
GET /admin/reports/claims-analytics
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- startDate: string
- endDate: string
- groupBy: string (day, week, month)
- productId: string (optional)
- status: string (optional)
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "success": true,
  "data": {
    "summary": {
      "totalClaims": 324,
      "avgProcessingTime": 4.2,
      "completionRate": 94.8,
      "customerSatisfaction": 4.6
    },
    "trends": [
      {
        "date": "2024-09-01",
        "claimsSubmitted": 45,
        "claimsCompleted": 42,
        "avgProcessingTime": 4.1
      }
    ],
    "breakdown": {
      "byProduct": [
        {
          "productId": "prod_001",
          "productName": "Rexus Gaming Mouse RX-110",
          "claimCount": 89,
          "successRate": 96.2
        }
      ],
      "byIssueCategory": [
        {
          "category": "Hardware Malfunction",
          "count": 156,
          "percentage": 48.1
        }
      ]
    }
  }
}
```

#### 1.2 Financial Report
```http
GET /admin/reports/financial
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- startDate: string
- endDate: string
- currency: string (default: IDR)
```

#### 1.3 Technician Performance Report
```http
GET /admin/reports/technician-performance
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- technicianId: string (optional)
- startDate: string
- endDate: string
```

### 2. Product Analytics

#### 2.1 Product Warranty Performance
```http
GET /admin/reports/product-warranty
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- productId: string (optional)
- category: string (optional)
- startDate: string
- endDate: string
```

#### 2.2 Quality Insights
```http
GET /admin/reports/quality-insights
Authorization: Bearer {admin_jwt_token}
Query Parameters:
- productId: string (optional)
- issueCategory: string (optional)
- severity: string (optional)
```

### 3. Export Capabilities

#### 3.1 Export Claims Data
```http
POST /admin/exports/claims
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "format": "csv", // csv, xlsx, pdf
  "filters": {
    "startDate": "2024-09-01",
    "endDate": "2024-09-30",
    "status": "completed"
  },
  "fields": ["claimNumber", "customerName", "productName", "status", "completedDate"],
  "emailTo": "admin@rexus.com"
}
```

**Response:**
```http
HTTP/1.1 202 Accepted
{
  "success": true,
  "data": {
    "exportId": "export_001",
    "status": "processing",
    "estimatedCompletion": "2024-09-26T10:35:00Z"
  },
  "message": "Export started. You will receive an email when ready for download."
}
```

#### 3.2 Check Export Status
```http
GET /admin/exports/{exportId}/status
Authorization: Bearer {admin_jwt_token}
```

#### 3.3 Download Export
```http
GET /admin/exports/{exportId}/download
Authorization: Bearer {admin_jwt_token}
```

---

## Integration Endpoints

### 1. Logistics Integration

#### 1.1 Get Shipping Rates
```http
POST /integrations/logistics/rates
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "origin": {
    "city": "Jakarta",
    "postalCode": "12190"
  },
  "destination": {
    "city": "Surabaya",
    "postalCode": "60111"
  },
  "weight": 0.5,
  "dimensions": {
    "length": 20,
    "width": 15,
    "height": 8
  },
  "providers": ["jne", "jnt", "sicepat"]
}
```

#### 1.2 Create Shipping Order
```http
POST /integrations/logistics/orders
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "claimId": "claim_001",
  "provider": "jne",
  "serviceType": "express",
  "pickup": {
    "name": "Rexus Service Center",
    "phone": "+62211234567",
    "address": "Jl. Service Center No. 1, Jakarta 12190"
  },
  "destination": {
    "name": "John Doe",
    "phone": "+62812345678",
    "address": "Jl. Sudirman No. 123, Jakarta 12190"
  },
  "package": {
    "weight": 0.5,
    "dimensions": "20x15x8cm",
    "contents": "Repaired gaming mouse",
    "value": 150000
  }
}
```

#### 1.3 Track Shipment
```http
GET /integrations/logistics/track/{trackingNumber}
Authorization: Bearer {jwt_token}
Query Parameters:
- provider: string
```

### 2. Payment Integration (for refunds)

#### 2.1 Process Refund
```http
POST /integrations/payments/refunds
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "claimId": "claim_001",
  "amount": 150000,
  "reason": "Product replacement not available",
  "refundMethod": "original_payment", // original_payment, bank_transfer, store_credit
  "customerBankInfo": {
    "bankName": "Bank BCA",
    "accountNumber": "1234567890",
    "accountName": "John Doe"
  }
}
```

### 3. Inventory Integration

#### 3.1 Check Replacement Availability
```http
GET /integrations/inventory/availability/{productId}
Authorization: Bearer {admin_jwt_token}
```

#### 3.2 Reserve Replacement Product
```http
POST /integrations/inventory/reserve
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "productId": "prod_001",
  "quantity": 1,
  "reservedFor": "claim_001",
  "expiryHours": 48
}
```

### 4. CRM Integration

#### 4.1 Sync Customer Data
```http
POST /integrations/crm/customers/sync
Authorization: Bearer {system_jwt_token}
Content-Type: application/json

{
  "customerId": "cust_001",
  "action": "update", // create, update, delete
  "data": {
    "totalPurchases": 3,
    "totalWarrantyClaims": 1,
    "customerTier": "silver",
    "lastInteraction": "2024-09-26T10:30:00Z"
  }
}
```

---

## Error Handling & Response Codes

### HTTP Status Codes

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests |
| 202 | Accepted | Request accepted for processing |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request format/parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary service unavailable |

### Error Response Format

```http
HTTP/1.1 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_WARRANTY_ID",
    "message": "The warranty ID format is invalid",
    "details": {
      "field": "warrantyId",
      "provided": "INVALID123",
      "expected": "REX followed by 8 digits and 5 sequential numbers"
    }
  },
  "requestId": "req_123456789"
}
```

### Common Error Codes

#### Authentication Errors
- `AUTH_TOKEN_MISSING`: Authorization header missing
- `AUTH_TOKEN_INVALID`: Invalid JWT token
- `AUTH_TOKEN_EXPIRED`: Token has expired
- `AUTH_INSUFFICIENT_PERMISSIONS`: User lacks required permissions

#### Validation Errors
- `VALIDATION_FAILED`: Request validation failed
- `INVALID_WARRANTY_ID`: Warranty ID format invalid
- `INVALID_EMAIL_FORMAT`: Email format invalid
- `REQUIRED_FIELD_MISSING`: Required field not provided
- `FILE_SIZE_EXCEEDED`: Uploaded file too large
- `FILE_TYPE_NOT_SUPPORTED`: File type not allowed

#### Business Logic Errors
- `WARRANTY_NOT_FOUND`: Warranty ID does not exist
- `WARRANTY_EXPIRED`: Warranty period has ended
- `WARRANTY_ALREADY_CLAIMED`: Active claim exists
- `CLAIM_NOT_FOUND`: Claim ID does not exist
- `CLAIM_ALREADY_PROCESSED`: Cannot modify processed claim
- `INSUFFICIENT_STOCK`: No replacement products available

#### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `DAILY_LIMIT_REACHED`: Daily API quota exceeded

### Validation Rules

#### Warranty ID Format
- Pattern: `^REX\d{2}[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$`
- Example: `REX24A7M9K2P8Q1N5`
- Case sensitive
- 12-character random alphanumeric string (excludes I, O, 1, 0)
- Total entropy: ~60 bits
- Collision probability: <0.001% even with billions of codes

#### File Upload Limits
- Maximum file size: 5MB per file
- Allowed types: JPG, PNG, PDF, GIF
- Maximum files per claim: 10

#### Phone Number Format
- Pattern: `^\+62\d{8,12}$`
- Must start with +62 (Indonesia)
- 8-12 digits after country code

#### Email Validation
- Standard RFC 5322 format
- Maximum length: 254 characters
- Must be unique per customer

### Request/Response Examples

#### Successful Response
```http
HTTP/1.1 200 OK
X-Request-ID: req_123456789
X-Rate-Limit-Remaining: 999
Content-Type: application/json

{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

#### Error Response with Validation Details
```http
HTTP/1.1 422 Unprocessable Entity
X-Request-ID: req_123456789
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields failed validation",
    "validationErrors": [
      {
        "field": "email",
        "code": "INVALID_EMAIL_FORMAT",
        "message": "Please provide a valid email address"
      },
      {
        "field": "phone",
        "code": "INVALID_PHONE_FORMAT", 
        "message": "Phone number must start with +62 and contain 8-12 digits"
      }
    ]
  },
  "requestId": "req_123456789"
}
```

---

## Rate Limiting

### Limits by User Type
- **Customers**: 1,000 requests/hour
- **Admins**: 5,000 requests/hour  
- **Technicians**: 2,000 requests/hour
- **System/Integration**: 10,000 requests/hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1695734400
X-RateLimit-Retry-After: 3600
```

### Webhooks (Optional Future Enhancement)

#### Claim Status Changed
```http
POST {webhook_url}
Content-Type: application/json
X-Webhook-Signature: sha256=...

{
  "event": "claim.status_changed",
  "timestamp": "2024-09-26T10:30:00Z",
  "data": {
    "claimId": "claim_001",
    "claimNumber": "WC-2024-09-001",
    "previousStatus": "validated",
    "newStatus": "in_repair",
    "updatedBy": "admin_001"
  }
}
```

This comprehensive API specification covers all aspects of the warranty system functionality, providing a complete backend interface for both customer-facing and administrative operations.