# Barcode Implementation & QR Generation Guide

## 📋 Overview

This guide provides comprehensive documentation for implementing warranty barcodes and QR code generation in the SmartSeller system. The system uses cryptographically secure REX format barcodes with on-demand QR code generation.

---

## 🔐 REX Barcode Format Specification

### Format Structure
```
REX[YY][RANDOM_12]

Components:
┌─────┬──────┬──────────────────────────────────┐
│ REX │  YY  │         RANDOM_12                │
├─────┼──────┼──────────────────────────────────┤
│ 3   │  2   │             12                   │
│chars│digits│           chars                  │
└─────┴──────┴──────────────────────────────────┘
Total Length: 17 characters

REX    : Fixed warranty identifier prefix
YY     : Two-digit year (24 for 2024) 
RANDOM : 12 cryptographically secure random characters
```

### Character Set
```go
const BarcodeCharacterSet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

Characteristics:
- 32 characters total (2^5 = 5 bits entropy per character)
- Excludes confusing characters: I, O, 1, 0
- Human-readable and OCR-friendly
- Case-insensitive scanning support
- Optimized for visual clarity
```

### Security Properties
```
Security Metrics:
┌─────────────────────────────────┬─────────────────┐
│ Metric                          │ Value           │
├─────────────────────────────────┼─────────────────┤
│ Entropy Bits                    │ 60 bits         │
│ Total Combinations              │ 1.2 × 10¹⁸     │
│ Brute Force Resistance          │ 2⁶⁰ attempts   │
│ Collision Probability (1B codes)│ < 0.001%        │
│ Prediction Resistance           │ Cryptographic   │
│ Pattern Recognition             │ Impossible      │
└─────────────────────────────────┴─────────────────┘
```

### Example Barcodes
```
REX24A7M9K2P8Q1N5  ✅ Valid
REX25EMYRASM7M2MX  ✅ Valid
REX23INVALID123    ❌ Invalid (contains I)
REX2024TOOLONG     ❌ Invalid (wrong format)
```

---

## 🎯 QR Code Generation

### QR String Format
The QR code contains a URL that points to the warranty claim page:

```
Default Format:
https://app.rexus.id/warranty/{BARCODE_NUMBER}

Example:
https://app.rexus.id/warranty/REX24A7M9K2P8Q1N5
```

### Configuration Options
```go
// QR Code Configuration (from config.go)
type QRConfig struct {
    Domain      string // Default: "app.rexus.id"
    BasePath    string // Default: "/warranty"
    Protocol    string // Default: "https"
    Size        int    // Default: 256 pixels
    ErrorLevel  string // Default: "M" (L, M, Q, H)
    BorderWidth int    // Default: 4 pixels
}
```

### QR Generation Options
```go
type QRGenerationOptions struct {
    // Size of the QR code in pixels (64-1024)
    Size int
    
    // Error correction level (Low, Medium, High, Highest)
    ErrorLevel qrcode.RecoveryLevel
    
    // Disable border around QR code
    DisableBorder bool
    
    // Custom string options for URL generation
    StringOptions *QRStringOptions
    
    // Output format (png, base64, bytes)
    Format QROutputFormat
}

type QRStringOptions struct {
    // Override default domain
    Domain string
    // Override default base path
    BasePath string
    // Override default protocol
    Protocol string
    // Additional query parameters
    QueryParams map[string]string
    // Additional path segments
    PathSegments []string
}
```

---

## 🛠 API Endpoints

### Generate QR Code
```
GET /api/v1/admin/warranty/barcodes/{id}/qr

Parameters:
- id (path): Warranty barcode UUID
- size (query): QR code size in pixels (64-1024, default: 256)
- error_level (query): Error correction level (L/M/Q/H, default: M)
- format (query): Response format (base64/png, default: base64)
- disable_border (query): Disable QR border (true/false, default: false)

Response (JSON):
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_code": "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA...",
    "qr_string": "https://app.rexus.id/warranty/REX24A7M9K2P8Q1N5",
    "size": 256,
    "error_level": "M",
    "format": "base64",
    "width": 256,
    "height": 256,
    "disable_border": false
  }
}

Response (PNG):
Content-Type: image/png
[Binary PNG data]
```

### Validate Barcode Format
```
POST /api/v1/admin/warranty/barcodes/validate-format

Request:
{
  "barcode": "REX24A7M9K2P8Q1N5"
}

Response:
{
  "success": true,
  "message": "Barcode format is valid",
  "data": {
    "is_valid": true,
    "barcode": "REX24A7M9K2P8Q1N5",
    "format": "REX[YY][RANDOM_12]",
    "year": "24",
    "random_part": "A7M9K2P8Q1N5"
  }
}
```

---

## 💻 Implementation Examples

### 1. Generate Barcode Number
```go
func (wb *WarrantyBarcode) GenerateBarcodeNumber() error {
    // Get current year (last 2 digits)
    currentYear := time.Now().Year() % 100
    yearPrefix := fmt.Sprintf("REX%02d", currentYear)

    // Generate cryptographically secure random string
    randomPart, err := generateSecureRandomString(BarcodeRandomLength)
    if err != nil {
        return fmt.Errorf("failed to generate secure random string: %w", err)
    }

    wb.BarcodeNumber = yearPrefix + randomPart
    wb.QRCodeData = fmt.Sprintf("https://warranty.smartseller.com/claim/%s", wb.BarcodeNumber)

    return nil
}

func generateSecureRandomString(length int) (string, error) {
    randomBytes := make([]byte, length)
    _, err := rand.Read(randomBytes) // crypto/rand, not math/rand
    if err != nil {
        return "", err
    }

    result := make([]byte, length)
    for i := 0; i < length; i++ {
        result[i] = BarcodeCharacterSet[randomBytes[i]%byte(len(BarcodeCharacterSet))]
    }

    return string(result), nil
}
```

### 2. Validate Barcode Format
```go
func (wb *WarrantyBarcode) ValidateBarcodeFormat() error {
    if wb.BarcodeNumber == "" {
        return fmt.Errorf("barcode number is required")
    }

    // Validate format: REX[YY][RANDOM_12]
    pattern := regexp.MustCompile(`^REX\d{2}[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$`)
    if !pattern.MatchString(wb.BarcodeNumber) {
        return fmt.Errorf("invalid barcode format: expected REX[YY][RANDOM_12], got %s", wb.BarcodeNumber)
    }

    return nil
}
```

### 3. Generate QR Code
```go
// Basic QR generation
func (s *QRGeneratorService) GenerateWarrantyQRCode(barcodeNumber string, options *QRGenerationOptions) (*QRGenerationResult, error) {
    // Validate barcode number
    if err := s.stringBuilderService.ValidateBarcodeNumber(barcodeNumber); err != nil {
        return nil, fmt.Errorf("invalid barcode number: %w", err)
    }
    
    // Set default options if not provided
    if options == nil {
        options = s.getDefaultOptions()
    }
    
    // Generate QR string
    qrString, err := s.stringBuilderService.BuildWarrantyQRString(barcodeNumber, options.StringOptions)
    if err != nil {
        return nil, fmt.Errorf("failed to build QR string: %w", err)
    }
    
    // Generate QR code
    return s.generateQRCode(qrString, options)
}

// Custom QR string generation
func (s *QRStringBuilderService) BuildWarrantyQRString(barcodeNumber string, options *QRStringOptions) (string, error) {
    if barcodeNumber == "" {
        return "", fmt.Errorf("barcode number cannot be empty")
    }

    // Use default config values or override with options
    domain := s.config.QRConfig.Domain
    basePath := s.config.QRConfig.BasePath
    protocol := s.config.QRConfig.Protocol

    if options != nil {
        if options.Domain != "" {
            domain = options.Domain
        }
        if options.BasePath != "" {
            basePath = options.BasePath
        }
        if options.Protocol != "" {
            protocol = options.Protocol
        }
    }

    // Build the URL
    baseURL := fmt.Sprintf("%s://%s%s/%s", protocol, domain, basePath, barcodeNumber)
    
    // Add additional path segments and query parameters if provided
    // ... (implementation details)
    
    return baseURL, nil
}
```

### 4. Frontend Integration
```javascript
// Generate QR code for barcode
async function generateQRCode(barcodeId, options = {}) {
    const params = new URLSearchParams({
        size: options.size || 256,
        error_level: options.errorLevel || 'M',
        format: options.format || 'base64',
        disable_border: options.disableBorder || false
    });

    const response = await fetch(
        `/api/v1/admin/warranty/barcodes/${barcodeId}/qr?${params}`,
        {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to generate QR code');
    }

    const data = await response.json();
    return data.data;
}

// Display QR code in HTML
function displayQRCode(qrData) {
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${qrData.qr_code}`;
    img.alt = `QR Code for ${qrData.qr_string}`;
    img.style.width = `${qrData.size}px`;
    img.style.height = `${qrData.size}px`;
    
    document.getElementById('qr-container').appendChild(img);
}

// Usage example
generateQRCode('550e8400-e29b-41d4-a716-446655440000', {
    size: 512,
    errorLevel: 'H',
    format: 'base64'
}).then(qrData => {
    displayQRCode(qrData);
}).catch(error => {
    console.error('QR generation failed:', error);
});
```

---

## 🔧 Configuration

### Environment Variables
```bash
# QR Code Configuration
QR_DOMAIN=app.rexus.id
QR_BASE_PATH=/warranty
QR_PROTOCOL=https
QR_ENABLE_HTTPS=true
QR_SIZE=256
QR_ERROR_LEVEL=M
QR_BORDER_WIDTH=4
```

### Error Correction Levels
```
L (Low)     - ~7%  recovery capability
M (Medium)  - ~15% recovery capability (default)
Q (Quartile)- ~25% recovery capability
H (High)    - ~30% recovery capability
```

### Size Guidelines
```
Minimum: 64px   - For small labels/stickers
Default: 256px  - Standard size for most uses
Medium:  512px  - High-resolution printing
Maximum: 1024px - Large format printing
```

---

## ⚠️ Security Considerations

### 1. Cryptographic Security
- **ALWAYS** use `crypto/rand`, never `math/rand`
- Validate entropy requirements (60 bits minimum)
- Implement collision detection and retry logic

### 2. Input Validation
```go
// Always validate barcode format
func ValidateBarcodeInput(barcode string) error {
    if len(barcode) != 17 {
        return fmt.Errorf("invalid barcode length: expected 17, got %d", len(barcode))
    }
    
    if !strings.HasPrefix(barcode, "REX") {
        return fmt.Errorf("invalid barcode prefix: expected REX")
    }
    
    pattern := regexp.MustCompile(`^REX\d{2}[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$`)
    if !pattern.MatchString(barcode) {
        return fmt.Errorf("invalid barcode format")
    }
    
    return nil
}
```

### 3. Rate Limiting
- Implement rate limiting for QR generation endpoints
- Cache QR codes to reduce computational load
- Set appropriate cache headers for browser caching

---

## 🧪 Testing

### Unit Tests
```go
func TestBarcodeGeneration(t *testing.T) {
    barcode := &WarrantyBarcode{}
    err := barcode.GenerateBarcodeNumber()
    
    assert.NoError(t, err)
    assert.Len(t, barcode.BarcodeNumber, 17)
    assert.True(t, strings.HasPrefix(barcode.BarcodeNumber, "REX"))
    
    // Validate format
    err = barcode.ValidateBarcodeFormat()
    assert.NoError(t, err)
}

func TestQRGeneration(t *testing.T) {
    service := NewQRGeneratorService(config, stringBuilder)
    
    result, err := service.GenerateWarrantyQRCode("REX24A7M9K2P8Q1N5", nil)
    
    assert.NoError(t, err)
    assert.NotEmpty(t, result.QRString)
    assert.NotEmpty(t, result.Base64Data)
    assert.Equal(t, 256, result.Size)
}
```

### Integration Tests
```bash
# Test QR generation endpoint
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:8090/api/v1/admin/warranty/barcodes/$BARCODE_ID/qr?size=512&error_level=H"

# Test barcode validation
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"barcode":"REX24A7M9K2P8Q1N5"}' \
     "http://localhost:8090/api/v1/admin/warranty/barcodes/validate-format"
```

---

## 📚 Related Documentation

- <mcfile name="SECURE_BARCODE_TECHNICAL_SPECIFICATION.md" path="/home/aswin/Works/kirimku/smartseller-backend/docs/SECURE_BARCODE_TECHNICAL_SPECIFICATION.md"></mcfile> - Detailed security specifications
- <mcfile name="WARRANTY_API_SPECIFICATION.md" path="/home/aswin/Works/kirimku/smartseller-backend/docs/WARRANTY_API_SPECIFICATION.md"></mcfile> - Complete API documentation
- <mcfile name="warranty-admin-endpoints.yaml" path="/home/aswin/Works/kirimku/smartseller-backend/api/openapi/warranty-admin-endpoints.yaml"></mcfile> - OpenAPI specifications
- <mcfile name="warranty_barcode.go" path="/home/aswin/Works/kirimku/smartseller-backend/internal/domain/entity/warranty_barcode.go"></mcfile> - Entity implementation
- <mcfile name="qr_generator_service.go" path="/home/aswin/Works/kirimku/smartseller-backend/internal/application/service/qr_generator_service.go"></mcfile> - QR generation service

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01 | Initial REX format implementation |
| 1.1 | 2024-02 | Added QR generation service |
| 1.2 | 2024-03 | Enhanced security validation |
| 1.3 | 2024-04 | Added comprehensive testing |

---

*This guide is maintained by the SmartSeller development team. For questions or updates, please refer to the technical documentation or contact the development team.*