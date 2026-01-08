# DevSuite 🚀

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.1+-blue.svg)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![API](https://img.shields.io/badge/API-REST-orange.svg)]()

> **Developer productivity tools as a service** - A production-ready REST API suite providing essential utilities for modern development workflows.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Architecture](#architecture)
- [Security](#security)
- [Contributing](#contributing)

## 🔍 Overview

DevSuite is a comprehensive collection of developer productivity tools exposed through a clean, RESTful API. Built with Node.js, Express 5, and Supabase, it provides battle-tested utilities that developers need daily, all accessible through simple HTTP requests.

### Why DevSuite?

- **🎯 All-in-One**: Six major tool categories in a single API
- **⚡ High Performance**: Optimized with caching, connection pooling, and efficient algorithms
- **🔒 Production-Ready**: Rate limiting, input validation, security headers, and comprehensive error handling
- **🌍 Global Coverage**: Timezone operations with IANA database, GeoNames, and MaxMind integration
- **📊 Analytics**: Built-in URL analytics and request latency monitoring
- **🛡️ Robust**: Graceful error handling with detailed error responses

## ✨ Features

### 🔗 URL Shortener
Production-grade URL shortening service with analytics and expiration control.

- **Base62 Encoding**: Collision-resistant short IDs using database auto-increment
- **Click Analytics**: Track clicks, last accessed time, and creation timestamps
- **Expiration Control**: Set custom TTL using human-readable formats (7d, 24h, 30m)
- **Supabase Integration**: Leverages PostgreSQL stored procedures for atomic click increments
- **Redirect Service**: Fast 302 redirects with automatic click tracking

### 📝 Text Transformation
Comprehensive text processing utilities for encoding, formatting, and conversion.

- **Base64 Encoding/Decoding**: Bidirectional Base64 transformation
- **URL Encoding/Decoding**: Percent-encoding for URL-safe strings
- **Slugify**: Convert text to URL-friendly slugs with customizable separators (hyphen, underscore)
- **Case Conversion**: Support for camelCase, snake_case, kebab-case, PascalCase, CONSTANT_CASE, and more
- **Morse Code**: Bidirectional Morse code translation with international support

### 🌍 Timezone & Time Operations
Enterprise-grade timezone conversion and time retrieval with multiple data sources.

- **Multi-Source Time Lookup**: Get current time via IP (MaxMind), coordinates (geo-tz), or location name (GeoNames)
- **Intelligent Timezone Conversion**: Handles ISO 8601 with explicit offsets, IANA timezone IDs, and ambiguous inputs
- **Smart Offset Handling**: Automatically corrects URL-decoded `+` signs in timezone offsets
- **Custom Formatting**: User-defined time format patterns using Luxon tokens
- **Comprehensive Metadata**: Returns timezone abbreviations, DST status, UTC offsets, and warnings
- **Robust Error Handling**: Graceful degradation with detailed error messages and audit trails
- **Private IP Detection**: Prevents geolocation of private/reserved IP addresses
- **Coordinate Validation**: Validates lat/lon ranges and handles international waters

### ⏰ Cron Expression Tools
Parse, validate, and preview cron expressions with human-readable translations.

- **Expression Translation**: Convert cron syntax to natural language using cronstrue
- **Execution Preview**: Calculate next N execution times using cron-parser
- **Comprehensive Validation**: Validates 5-field and 6-field cron expressions
- **Human-Readable Output**: "At 09:00 AM, only on Monday" instead of "0 9 * * 1"

### 🔍 HTTP Analysis & Monitoring
Deep inspection of HTTP headers, security policies, and endpoint health.

- **Header Analysis**: Analyze cache-control, security headers, and CORS policies
- **Security Auditing**: Check for HSTS, CSP, X-Frame-Options, and other security headers
- **Cache Policy Inspection**: Detailed breakdown of cache directives with human-readable summaries
- **URL Health Checks**: Monitor endpoint availability, latency, HTTP status, and SSL certificate validity
- **SSL Certificate Analysis**: Extract issuer, expiration date, and validation status
- **IP Resolution**: Capture resolved IP addresses for monitored endpoints
- **SSRF Protection**: Validates URLs and blocks requests to private IP ranges

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (ES Modules support required)
- **Supabase Account** (for PostgreSQL database)
- **GeoNames Account** (optional, for location-based timezone lookup)
- **MaxMind Account** (optional, for IP-based geolocation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devsuite.git
   cd devsuite/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```bash
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Supabase Configuration (Required)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key

   # GeoNames API (Optional - for city/country timezone lookup)
   GEONAMES_USERNAME=your-username

   # MaxMind GeoIP2 (Optional - for IP-based geolocation)
   MAXMIND_ACCOUNT_ID=your-account-id
   MAXMIND_LICENSE_KEY=your-license-key
   ```

4. **Set up Supabase database**

   Run the following SQL in your Supabase SQL editor:
   ```sql
   -- Create URLs table
   CREATE TABLE urls (
     id BIGSERIAL PRIMARY KEY,
     short_id VARCHAR(20) UNIQUE NOT NULL,
     original_url TEXT NOT NULL,
     clicks INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW(),
     last_accessed TIMESTAMP,
     expires_at TIMESTAMP
   );

   -- Create stored procedure for atomic click increment
   CREATE OR REPLACE FUNCTION increment_clicks(short_id_param VARCHAR)
   RETURNS VOID AS $$
   BEGIN
     UPDATE urls
     SET clicks = clicks + 1,
         last_accessed = NOW()
     WHERE short_id = short_id_param;
   END;
   $$ LANGUAGE plpgsql;

   -- Create index for faster lookups
   CREATE INDEX idx_short_id ON urls(short_id);
   CREATE INDEX idx_expires_at ON urls(expires_at);
   ```

5. **Start the server**
   ```bash
   npm run dev  # Development mode with nodemon
   npm start    # Production mode
   ```

The API will be available at `http://localhost:3000`

**Health check**: `curl http://localhost:3000/health`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
No authentication required. Rate limiting: **1000 requests per 15 minutes per IP**.

### Response Format
All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response payload
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3000` |
| `NODE_ENV` | Environment (development/production) | No | `development` |
| `SUPABASE_URL` | Supabase project URL | **Yes** | - |
| `SUPABASE_KEY` | Supabase anon/public key | **Yes** | - |
| `GEONAMES_USERNAME` | GeoNames API username | No | `demo` |
| `MAXMIND_ACCOUNT_ID` | MaxMind account ID | No | - |
| `MAXMIND_LICENSE_KEY` | MaxMind license key | No | - |

### Database Configuration

DevSuite uses **Supabase** (PostgreSQL) for data persistence. The URL shortener requires the `urls` table and `increment_clicks` stored procedure (see Quick Start section).

## 📖 Usage Examples

### URL Shortener

**Shorten a URL**
```bash
curl -X POST http://localhost:3000/api/v1/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://github.com/yourusername/devsuite",
    "expiresIn": "7d"
  }'
```

**Access shortened URL**
```bash
curl -L http://localhost:3000/abc123
```

**Get analytics**
```bash
curl http://localhost:3000/api/v1/analytics/abc123
```

### Text Transformation

**Base64 Encode**
```bash
curl -X POST "http://localhost:3000/api/v1/text/base64?op=encode" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello DevSuite!"}'
```

**Convert to slug**
```bash
curl -X POST "http://localhost:3000/api/v1/text/slugify?separator=hyphen" \
  -H "Content-Type: application/json" \
  -d '{"input": "The Amazing DevSuite 2024"}'
```

**Case conversion**
```bash
curl -X POST "http://localhost:3000/api/v1/text/case?type=camel" \
  -H "Content-Type: application/json" \
  -d '{"input": "convert this to camel case"}'
```

### Timezone Operations

**Convert timezone**
```bash
curl -X POST http://localhost:3000/api/v1/timezone/convert \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2024-01-15T10:30:00",
    "from": "America/New_York", 
    "to": "Asia/Tokyo"
  }'
```

**Get current time**
```bash
curl "http://localhost:3000/api/v1/timezone/current?location=London"
```

### Cron Generator

**Generate cron from English**
```bash
curl -X POST http://localhost:3000/api/v1/cron/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "every Monday at 9 AM"}'
```

**Validate cron expression**
```bash
curl -X POST http://localhost:3000/api/v1/cron/validate \
  -H "Content-Type: application/json" \
  -d '{"expression": "0 9 * * 1"}'
```

### Health Check

**Monitor a service**
```bash
curl -X POST http://localhost:3000/api/v1/health/monitor \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.github.com"}'
```

**Check API health**
```bash
curl http://localhost:3000/health
```

## 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t devsuite .

# Run with docker-compose
docker-compose up -d
```

The `docker-compose.yml` includes PostgreSQL setup and environment configuration.

## 🏗️ Architecture

DevSuite follows a clean, layered architecture:

```
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic layer  
│   ├── models/          # Data access layer
│   ├── routes/          # API route definitions
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── scripts/             # Setup and deployment scripts
├── docs/                # API documentation
└── tests/               # Test suites
```

## 🔒 Security

- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **Input Validation**: Comprehensive input sanitization and validation
- **SQL Injection Protection**: Parameterized queries
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing

## 📊 Performance

- **Connection Pooling**: PostgreSQL connection pooling for optimal performance
- **Caching**: In-memory caching for frequently accessed data
- **Optimized Queries**: Indexed database queries for fast lookups
- **Lightweight**: Minimal overhead with efficient algorithms

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

### Code Style

- Follow existing code style and conventions
- Add JSDoc comments for new functions
- Include tests for new features
- Update documentation as needed

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## 🛠️ Roadmap

- [ ] **Authentication & Authorization**: JWT-based authentication system
- [ ] **API Rate Limiting**: Per-user rate limiting with different tiers
- [ ] **Webhook Support**: Real-time notifications for URL clicks and health checks
- [ ] **Data Export**: Export analytics data in various formats (CSV, JSON, PDF)
- [ ] **Custom Domains**: Support for custom short domains
- [ ] **Bulk Operations**: Batch processing for multiple URLs and text transformations
- [ ] **GraphQL API**: Alternative GraphQL interface
- [ ] **Real-time Dashboard**: Web-based analytics dashboard
- [ ] **Monitoring Alerts**: Email/SMS alerts for health check failures
- [ ] **Advanced Cron**: Support for more complex scheduling patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Powerful, open-source relational database
- **Joi** - Object schema validation
- **Helmet** - Security middleware for Express

## 📞 Support

- **Documentation**: [API Docs](https://devsuite-docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/devsuite/issues)
- **Discord**: [Community Discord](https://discord.gg/devsuite)
- **Email**: support@devsuite.com

---

<div align="center">

**[Website](https://devsuite.example.com)** • 
**[Documentation](https://docs.devsuite.example.com)** • 
**[API Reference](https://api.devsuite.example.com)** • 
**[Discord](https://discord.gg/devsuite)**

Made with ❤️ by developers, for developers.

</div>
