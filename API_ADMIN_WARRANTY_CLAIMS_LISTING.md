# Admin Warranty Claims Listing API Documentation

## Overview

The Admin Warranty Claims Listing endpoint allows administrators to retrieve, filter, sort, and paginate warranty claims across all storefronts. This endpoint provides comprehensive claim management capabilities with detailed statistics and filtering options.

## Endpoint Details

- **URL**: `/api/v1/admin/warranty/claims`
- **Method**: `GET`
- **Authentication**: Bearer Token (Admin required)
- **Content-Type**: `application/json`

## Query Parameters

### Pagination Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-based) |
| `limit` | integer | No | 20 | Number of items per page (1-100) |

### Filtering Parameters

| Parameter | Type | Required | Description | Valid Values |
|-----------|------|----------|-------------|--------------|
| `status` | string | No | Filter by claim status | `pending`, `validated`, `in_progress`, `completed`, `rejected`, `cancelled` |
| `priority` | string | No | Filter by claim priority | `low`, `medium`, `high`, `urgent` |
| `severity` | string | No | Filter by claim severity | `low`, `medium`, `high`, `critical` |
| `assigned_to` | uuid | No | Filter by assigned technician ID | Valid UUID |
| `customer_email` | email | No | Filter by customer email | Valid email address |
| `created_from` | datetime | No | Filter by creation date (from) | ISO 8601 format |
| `created_to` | datetime | No | Filter by creation date (to) | ISO 8601 format |
| `search` | string | No | Search in claim number, customer name, or issue description | Any text |

### Sorting Parameters

| Parameter | Type | Required | Default | Description | Valid Values |
|-----------|------|----------|---------|-------------|--------------|
| `sort_by` | string | No | `created_at` | Sort claims by field | `created_at`, `updated_at`, `priority`, `status`, `severity` |
| `sort_order` | string | No | `desc` | Sort order | `asc`, `desc` |

## Request Examples

### Basic Request (No Filters)

```bash
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Paginated Request

```bash
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Filtered Request (Status)

```bash
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?status=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Multiple Filters with Sorting

```bash
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?status=pending&priority=medium&severity=high&sort_by=created_at&sort_order=asc" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Search Request

```bash
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?search=screen%20flickering" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Date Range Filter

```bash
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?created_from=2023-12-01T00:00:00Z&created_to=2023-12-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Response Structure

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Warranty claims retrieved successfully",
  "data": {
    "claims": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "claim_number": "WC-2023-001234",
        "warranty_id": "WB-2023-ABC123DEF456",
        "customer_name": "John Doe",
        "customer_email": "john.doe@example.com",
        "customer_phone": "+6281234567890",
        "status": "pending",
        "priority": "medium",
        "severity": "medium",
        "issue_type": "defective",
        "issue_description": "Screen flickering and touch not responsive",
        "assigned_to": null,
        "assigned_to_name": null,
        "estimated_completion": null,
        "created_at": "2023-12-01T10:00:00Z",
        "updated_at": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 20,
      "total_items": 150,
      "total_pages": 8,
      "has_next": true,
      "has_previous": false,
      "next_page": 2,
      "previous_page": null
    },
    "statistics": {
      "total_claims": 150,
      "pending_claims": 25,
      "in_progress_claims": 30,
      "completed_claims": 85,
      "rejected_claims": 10,
      "average_resolution_time_hours": 48.5,
      "claims_by_priority": {
        "low": 40,
        "medium": 60,
        "high": 35,
        "urgent": 15
      },
      "claims_by_severity": {
        "low": 50,
        "medium": 70,
        "high": 25,
        "critical": 5
      }
    },
    "filters": {
      "applied_filters": {},
      "available_filters": {
        "statuses": ["pending", "validated", "in_progress", "completed", "rejected", "cancelled"],
        "priorities": ["low", "medium", "high", "urgent"],
        "severities": ["low", "medium", "high", "critical"]
      }
    }
  }
}
```

### Filtered Response Example

```json
{
  "success": true,
  "message": "Warranty claims retrieved successfully",
  "data": {
    "claims": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "claim_number": "WC-2023-001234",
        "warranty_id": "WB-2023-ABC123DEF456",
        "customer_name": "John Doe",
        "customer_email": "john.doe@example.com",
        "customer_phone": "+6281234567890",
        "status": "pending",
        "priority": "medium",
        "severity": "medium",
        "issue_type": "defective",
        "issue_description": "Screen flickering and touch not responsive",
        "assigned_to": null,
        "assigned_to_name": null,
        "estimated_completion": null,
        "created_at": "2023-12-01T10:00:00Z",
        "updated_at": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 5,
      "total_items": 12,
      "total_pages": 3,
      "has_next": true,
      "has_previous": false,
      "next_page": 2,
      "previous_page": null
    },
    "statistics": {
      "total_claims": 12,
      "pending_claims": 12,
      "in_progress_claims": 0,
      "completed_claims": 0,
      "rejected_claims": 0,
      "average_resolution_time_hours": 0,
      "claims_by_priority": {
        "low": 0,
        "medium": 12,
        "high": 0,
        "urgent": 0
      },
      "claims_by_severity": {
        "low": 0,
        "medium": 12,
        "high": 0,
        "critical": 0
      }
    },
    "filters": {
      "applied_filters": {
        "status": "pending",
        "priority": "medium"
      },
      "available_filters": {
        "statuses": ["pending", "validated", "in_progress", "completed", "rejected", "cancelled"],
        "priorities": ["low", "medium", "high", "urgent"],
        "severities": ["low", "medium", "high", "critical"]
      }
    }
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": "Invalid status value. Must be one of: pending, validated, in_progress, completed, rejected, cancelled"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Missing or invalid authorization token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "Admin access required for this endpoint"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "An unexpected error occurred while processing the request"
}
```

## Response Field Descriptions

### Claim Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier for the warranty claim |
| `claim_number` | string | Human-readable claim number |
| `warranty_id` | string | Associated warranty barcode |
| `customer_name` | string | Name of the customer who submitted the claim |
| `customer_email` | email | Email address of the customer |
| `customer_phone` | string | Phone number of the customer |
| `status` | enum | Current status of the claim |
| `priority` | enum | Priority level assigned to the claim |
| `severity` | enum | Severity level of the reported issue |
| `issue_type` | string | Type of issue reported |
| `issue_description` | string | Detailed description of the issue |
| `assigned_to` | UUID | ID of the assigned technician (nullable) |
| `assigned_to_name` | string | Name of the assigned technician (nullable) |
| `estimated_completion` | datetime | Estimated completion date (nullable) |
| `created_at` | datetime | Timestamp when the claim was created |
| `updated_at` | datetime | Timestamp when the claim was last updated |

### Pagination Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `current_page` | integer | Current page number |
| `page_size` | integer | Number of items per page |
| `total_items` | integer | Total number of claims matching the filters |
| `total_pages` | integer | Total number of pages |
| `has_next` | boolean | Whether there is a next page |
| `has_previous` | boolean | Whether there is a previous page |
| `next_page` | integer | Next page number (nullable) |
| `previous_page` | integer | Previous page number (nullable) |

### Statistics Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_claims` | integer | Total number of claims |
| `pending_claims` | integer | Number of pending claims |
| `in_progress_claims` | integer | Number of claims in progress |
| `completed_claims` | integer | Number of completed claims |
| `rejected_claims` | integer | Number of rejected claims |
| `average_resolution_time_hours` | float | Average resolution time in hours |
| `claims_by_priority` | object | Breakdown of claims by priority level |
| `claims_by_severity` | object | Breakdown of claims by severity level |

## Implementation Notes

### Multi-Tenant Architecture

This endpoint implements a storefront fallback mechanism for admin users:

1. **Primary**: Attempts to get storefront context from middleware
2. **Fallback**: If no storefront context, retrieves admin user's associated storefront
3. **Scope**: All queries are scoped to the determined storefront for data isolation

### Performance Considerations

- **Pagination**: Always use pagination for large datasets
- **Filtering**: Apply filters to reduce dataset size before sorting
- **Indexing**: Database indexes exist on commonly filtered fields (status, priority, created_at)
- **Caching**: Consider implementing caching for statistics if performance becomes an issue

### Security Features

- **Authentication**: Requires valid admin bearer token
- **Authorization**: Admin-level permissions required
- **Input Validation**: All query parameters are validated and sanitized
- **SQL Injection Protection**: All database queries use parameterized statements

## Testing Examples

### Test Authentication

```bash
# Get admin token first
export ADMIN_TOKEN=$(make login-quick-token LOGIN_EMAIL=admin@example.com LOGIN_PASSWORD=adminpassword123)

# Test endpoint
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Test Pagination

```bash
# Test different page sizes
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?page=2&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Test Filtering

```bash
# Test status filter
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test multiple filters
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?status=pending&priority=medium&severity=high" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Test Sorting

```bash
# Test sorting by different fields
curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?sort_by=priority&sort_order=asc" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X GET "http://localhost:8090/api/v1/admin/warranty/claims?sort_by=created_at&sort_order=desc" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Related Documentation

- [OpenAPI Specification](../api/openapi/warranty-admin-endpoints.yaml)
- [Warranty Claims Schema](../api/openapi/warranty-schemas.yaml)
- [Authentication Guide](./AUTHENTICATION.md)
- [Multi-Tenant Architecture](./MULTI_TENANT_ARCHITECTURE.md)

## Changelog

- **2023-12-01**: Initial implementation with basic filtering and pagination
- **2023-12-01**: Added severity filtering, sorting, and search capabilities
- **2023-12-01**: Enhanced OpenAPI documentation with comprehensive examples
- **2023-12-01**: Added storefront fallback mechanism for admin users