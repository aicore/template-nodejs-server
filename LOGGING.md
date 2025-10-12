# Logging Guide

Complete guide to logging in this Node.js service, covering development, production, and troubleshooting.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration](#configuration)
3. [Development Setup](#development-setup)
4. [Production Setup](#production-setup)
5. [Log Format Reference](#log-format-reference)
6. [Kibana Queries](#kibana-queries)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Architecture Overview

The logging system uses a **stage-based approach** that automatically adapts to your environment:

### Development Mode (`stage: "dev"`)
```
┌──────────────┐
│ Application  │
│ (Pino)       │
└──────┬───────┘
       │
       │ Pretty Console Output
       ▼
┌──────────────┐
│  Developer   │
│  Terminal    │
└──────────────┘
```

- Human-readable, colorized logs
- Perfect for local debugging
- No external infrastructure needed

### Production Mode (`stage: "prod"`)
```
┌──────────────┐
│ Application  │
│ (Pino ECS)   │
└──────┬───────┘
       │
       │ ECS JSON Logs
       ▼
┌──────────────┐
│   journald   │
│  (systemd)   │
└──────┬───────┘
       │
       │ Structured Logs
       ▼
┌──────────────┐
│   Filebeat   │
│  (Shipper)   │
└──────┬───────┘
       │
       │ HTTP/HTTPS
       ▼
┌──────────────┐
│Elasticsearch │
│   (Storage)  │
└──────┬───────┘
       │
       │ REST API
       ▼
┌──────────────┐
│    Kibana    │
│   (Search)   │
└──────────────┘
```

- Structured ECS JSON logs
- Searchable in Elasticsearch
- Visualized in Kibana
- Retained for 6 months

---

## Configuration

### Basic Configuration

The logging system is controlled by the `stage` field in `app.json`:

```json
{
  "stage": "dev",
  "authKey": "your-auth-key",
  "allowPublicAccess": false,
  "port": 5000
}
```

### Production Configuration

For production, add Elasticsearch credentials:

```json
{
  "stage": "prod",
  "authKey": "your-auth-key",
  "allowPublicAccess": true,
  "port": 5000,
  "log": {
    "elasticsearch_host": "https://logs.yourcompany.com",
    "elasticsearch_api_key": "YOUR_ELASTICSEARCH_API_KEY"
  }
}
```

### Stage Values

The `stage` field supports both short and long names:

| Configuration | Result | NODE_ENV |
|---------------|--------|----------|
| `"dev"` | Development mode | `"development"` |
| `"development"` | Development mode | `"development"` |
| `"prod"` | Production mode | `"production"` |
| `"production"` | Production mode | `"production"` |

**Note:** The `getStage()` function automatically sets `NODE_ENV` based on the stage, following Node.js best practices.

---

## Development Setup

### Installation

Install the required development dependency:

```bash
npm install --save-dev pino-pretty
```

### Configuration

Set `stage` to `"dev"` or `"development"` in `app.json`:

```json
{
  "stage": "dev"
}
```

### Running

Start the development server:

```bash
npm run serve:dev
```

### Output Example

You'll see beautiful, human-readable logs:

```
[14:23:45 INFO] Server started on port 5000
[14:23:47 INFO] Incoming request
    url: "/hello?name=world"
    method: "GET"
    reqId: "req-1"
    ip: ["192.168.1.100"]
[14:23:47 INFO] Request completed
    url: "/hello?name=world"
    method: "GET"
    statusCode: 200
    duration: "142ms"
    reqId: "req-1"
```

### Development Features

- **Colorized output**: Levels have distinct colors (info=green, warn=yellow, error=red)
- **Readable timestamps**: Human-friendly format (HH:MM:ss)
- **Structured data**: Nested objects displayed cleanly
- **No PID/hostname**: Clutter removed for local development

---

## Production Setup

### Prerequisites

1. Elasticsearch cluster with API key authentication
2. Kibana for log visualization (recommended)
3. Server with systemd and journald

### Deployment

The production setup is handled automatically by the deployment scripts. The script:

1. Installs and configures Filebeat
2. Creates service-specific input configuration
3. Configures ndjson parser for JSON logs
4. Sets up Elasticsearch output with authentication
5. Creates systemd service for Filebeat

### Configuration Files

After deployment, Filebeat is configured at:

**Input Configuration:**
`/etc/filebeat/inputs.d/<serviceName>.yml`

```yaml
- type: journald
  id: myService
  seek: tail
  include_matches:
    match:
      - "_SYSTEMD_UNIT=myService.service"

  # Parse JSON logs from journald message field
  parsers:
    - ndjson:
        target: ""
        overwrite_keys: true
        expand_keys: true
        add_error_key: true

  # Add data stream fields for routing
  fields_under_root: true
  fields:
    data_stream:
      type: logs
      dataset: myService
      namespace: production

  processors:
    - add_fields:
        target: '@metadata'
        fields:
          raw_index: logs-myService-production
```

**Main Configuration:**
`/etc/filebeat/filebeat.yml`

```yaml
filebeat.config.inputs:
  enabled: true
  path: /etc/filebeat/inputs.d/*.yml

output.elasticsearch:
  hosts: ["https://logs.yourcompany.com"]
  api_key: "YOUR_ELASTICSEARCH_API_KEY"
```

### Verification

Check that logs are flowing:

```bash
# 1. Verify application is logging to journald
sudo journalctl -f -u myService.service

# 2. Check Filebeat service status
sudo systemctl status filebeat

# 3. Test Elasticsearch connection
sudo filebeat test output

# 4. View Filebeat logs
sudo journalctl -u filebeat -n 50
```

---

## Log Format Reference

### ECS Field Mapping

The application uses [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html) for structured logging:

| ECS Field | Description | Example |
|-----------|-------------|---------|
| `@timestamp` | Log timestamp (ISO 8601) | `2025-10-12T14:23:47.123Z` |
| `log.level` | Log level | `info`, `warn`, `error` |
| `message` | Log message | `Request completed` |
| `trace.id` | Request correlation ID | `req-12345` |
| `http.request.method` | HTTP method | `GET`, `POST` |
| `url.full` | Full request URL | `/hello?name=world` |
| `http.response.status_code` | HTTP status code | `200`, `404`, `500` |
| `event.duration` | Request duration (nanoseconds) | `142000000` (142ms) |
| `client.ip` | Client IP address | `192.168.1.100` |
| `error.message` | Error message | `Invalid parameter` |
| `error.stack_trace` | Stack trace | `Error: ...\n at ...` |

### Log Levels

| Level | Usage | Color (dev) |
|-------|-------|-------------|
| `info` | Normal operations, request/response logs | Green |
| `warn` | Warning conditions, unauthorized access | Yellow |
| `error` | Error conditions, exceptions | Red |

### Example Production Log

```json
{
  "@timestamp": "2025-10-12T14:23:47.123Z",
  "log.level": "info",
  "message": "Request completed",
  "trace.id": "req-abc123",
  "http.request.method": "GET",
  "url.full": "/hello?name=world",
  "http.response.status_code": 200,
  "event.duration": 142000000,
  "client.ip": "192.168.1.100",
  "data_stream": {
    "type": "logs",
    "dataset": "myService",
    "namespace": "production"
  }
}
```

---

## Kibana Queries

### Basic Searches

**All logs for your service:**
```
data_stream.dataset: "myService"
```

**Specific stage (production):**
```
data_stream.dataset: "myService" AND data_stream.namespace: "production"
```

**Specific stage (development):**
```
data_stream.dataset: "myService" AND data_stream.namespace: "development"
```

### Filter by Log Level

**Errors only:**
```
data_stream.dataset: "myService" AND log.level: "error"
```

**Warnings and errors:**
```
data_stream.dataset: "myService" AND (log.level: "warn" OR log.level: "error")
```

### Search by Request

**Specific request ID:**
```
trace.id: "req-12345"
```

**Follow a request through the system:**
```
trace.id: "req-12345"
```
(Sort by `@timestamp` to see the request flow)

### Search by HTTP

**Specific HTTP method:**
```
http.request.method: "POST"
```

**HTTP errors (4xx and 5xx):**
```
http.response.status_code >= 400
```

**Specific status code:**
```
http.response.status_code: 500
```

**Search URLs:**
```
url.full: "/hello"
```

### Performance Analysis

**Slow requests (>1 second):**
```
event.duration > 1000000000
```

**Very slow requests (>5 seconds):**
```
event.duration > 5000000000
```

**Average response time:**
```
Visualize → Metrics → Average of event.duration
```

### Search by IP

**Requests from specific IP:**
```
client.ip: "192.168.1.100"
```

**Unauthorized access attempts:**
```
log.level: "warn" AND message: "Unauthorized access attempt"
```

### Time-Based Searches

Use the Kibana time picker for:
- Last 15 minutes
- Last hour
- Last 24 hours
- Custom time range

### Advanced Queries

**Errors with stack traces:**
```
log.level: "error" AND _exists_: error.stack_trace
```

**High-volume endpoints:**
```
data_stream.dataset: "myService"
```
(Use Visualize → Aggregation → Terms on `url.full`)

**Error rate over time:**
```
log.level: "error"
```
(Use Visualize → Line Chart → Date Histogram)

---

## Troubleshooting

### Problem: Logs not appearing in Elasticsearch

**Symptoms:**
- No logs visible in Kibana
- Recent logs missing

**Solutions:**

1. **Check if logs are being generated:**
   ```bash
   sudo journalctl -f -u myService.service
   ```
   You should see JSON logs like:
   ```json
   {"@timestamp":"2025-10-12T14:23:47.123Z","log.level":"info","message":"Server started on port 5000"}
   ```

2. **Check Filebeat service status:**
   ```bash
   sudo systemctl status filebeat
   ```
   Should show "active (running)"

3. **Test Elasticsearch connection:**
   ```bash
   sudo filebeat test output
   ```
   Should show:
   ```
   elasticsearch: https://logs.yourcompany.com...
     parse url... OK
     connection... OK
   ```

4. **View Filebeat logs:**
   ```bash
   sudo journalctl -u filebeat -n 50
   ```
   Look for errors like:
   - Connection refused
   - Authentication failed
   - Invalid API key

5. **Check Filebeat configuration:**
   ```bash
   sudo filebeat test config
   ```
   Should show "Config OK"

6. **Verify Elasticsearch credentials:**
   Check `/etc/filebeat/filebeat.yml` has correct:
   - `hosts`: Elasticsearch URL
   - `api_key`: Valid API key

7. **Restart Filebeat:**
   ```bash
   sudo systemctl restart filebeat
   ```

### Problem: Development logs still showing as JSON

**Symptoms:**
- Logs appear as JSON instead of pretty-printed
- Colors missing in terminal

**Solutions:**

1. **Verify stage configuration:**
   ```bash
   cat src/app.json | grep stage
   ```
   Should show: `"stage": "dev"` or `"stage": "development"`

2. **Check pino-pretty is installed:**
   ```bash
   npm list pino-pretty
   ```
   If missing:
   ```bash
   npm install --save-dev pino-pretty
   ```

3. **Restart the service:**
   ```bash
   npm run serve:dev
   ```

4. **Check NODE_ENV:**
   The app should set this automatically, but verify:
   ```bash
   # In your code, add temporary logging
   console.log('NODE_ENV:', process.env.NODE_ENV);
   ```
   Should show: `NODE_ENV: development`

### Problem: Logs have 5-15 second delay in Elasticsearch

**Symptoms:**
- Logs appear in Elasticsearch but with delay
- Real-time monitoring seems slow

**Solutions:**

**This is normal!** Filebeat batches logs for efficiency. This is not a problem, it's expected behavior.

For real-time debugging, use journald instead:
```bash
sudo journalctl -f -u myService.service
```

If you need faster log shipping, adjust Filebeat configuration:
```yaml
# /etc/filebeat/filebeat.yml
queue.mem:
  events: 256
  flush.min_events: 64
  flush.timeout: 1s
```

Then restart:
```bash
sudo systemctl restart filebeat
```

### Problem: Missing log fields in Elasticsearch

**Symptoms:**
- Logs appear but fields are not structured
- All data in `message` field as JSON string

**Solutions:**

1. **Check ndjson parser is configured:**
   ```bash
   cat /etc/filebeat/inputs.d/myService.yml | grep -A5 "parsers:"
   ```
   Should show:
   ```yaml
   parsers:
     - ndjson:
         target: ""
         overwrite_keys: true
         expand_keys: true
         add_error_key: true
   ```

2. **Verify expand_keys is true:**
   This is critical for ECS format. Without it, you get:
   ```json
   {"log.level": "info"}  // Wrong: dotted string key
   ```
   With it, you get:
   ```json
   {"log": {"level": "info"}}  // Correct: nested object
   ```

3. **Restart Filebeat after config changes:**
   ```bash
   sudo systemctl restart filebeat
   ```

---

## Best Practices

### 1. Use Correlation IDs

Always include the request ID (`reqId`) in logs for request tracing:

```javascript
request.log.info({
  reqId: request.id,
  msg: 'Processing request',
  // other fields...
});
```

This allows you to track a request through the entire system:
```
trace.id: "req-12345"
```

### 2. Log at Appropriate Levels

- **info**: Normal operations, request/response logs
- **warn**: Unusual conditions, unauthorized access, deprecated features
- **error**: Errors, exceptions, failures

**Don't:**
```javascript
logger.info('ERROR: Something failed');  // ❌ Wrong level
```

**Do:**
```javascript
logger.error({ error: err }, 'Something failed');  // ✅ Correct
```

### 3. Include Context in Logs

Always include relevant context:

```javascript
// ❌ Bad: No context
logger.error('Request failed');

// ✅ Good: Rich context
logger.error({
  error: err,
  url: request.url,
  userId: user.id
}, 'Request failed');
```

### 4. Structured Logging Over String Concatenation

**Don't:**
```javascript
logger.info(`User ${userId} performed action`);  // ❌ Unstructured
```

**Do:**
```javascript
logger.info({
  userId: userId,
  action: action,
  msg: 'User performed action'
});  // ✅ Structured
```

Structured logs are searchable in Elasticsearch:
```
userId: "user-123" AND action: "login"
```

### 5. Sensitive Data Handling

**Never log sensitive data:**

```javascript
// ❌ NEVER do this
logger.info({ password: password });
logger.info({ apiKey: apiKey });
logger.info({ creditCard: cardNumber });

// ✅ Safe: Omit or redact
logger.info({ userId: userId });  // ID is fine
logger.info({ apiKey: 'REDACTED' });  // Redacted
```

### 6. Performance Considerations

- **Don't log in tight loops**: Use sampling or aggregation
- **Don't log large objects**: Log IDs and metadata instead
- **Use appropriate log levels**: Reduce info logs in production

### 7. Testing

Test logging configuration in both modes:

```bash
# Test development mode
cd src
echo '{"stage":"dev","port":5000,"authKey":"test"}' > app.json
npm run serve:dev
# Verify pretty logs appear

# Test production mode
echo '{"stage":"prod","port":5000,"authKey":"test"}' > app.json
npm run serve
# Verify JSON logs appear
```

### 8. Monitoring

Set up Kibana alerts for:

- **Error rate spike**: Alert when error count exceeds threshold
- **No logs received**: Alert when no logs in 5 minutes (service down)
- **Slow requests**: Alert when p99 duration exceeds threshold
- **Unauthorized access**: Alert on multiple failed auth attempts

### 9. Log Retention

Balance between cost and compliance:

- **Development**: 7-30 days (troubleshooting)
- **Production**: 90-180 days (compliance, audit trail)
- **Long-term archive**: S3/Glacier for multi-year retention

### 10. Documentation

Document your logging:

- **What fields mean**: Explain custom fields
- **Log levels**: When to use each level
- **Common queries**: Share useful Kibana queries
- **Troubleshooting**: Document common issues

---

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html)
- [Filebeat Documentation](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)
- [Kibana Query Language (KQL)](https://www.elastic.co/guide/en/kibana/current/kuery-query.html)
- [Elasticsearch Index Lifecycle Management](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)

---

## Support

For logging issues:

1. Check this troubleshooting guide
2. Review deployment-scripts documentation
3. Check Filebeat and Elasticsearch logs
4. Review Pino and ECS documentation

For application issues:
- See main [README.md](./README.md)
- Check [CONTRIBUTING.md](./CONTRIBUTING.md)
