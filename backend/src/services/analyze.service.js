import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';
import { validateAndCheckUrl } from '../utils/urlUtils.js';

class AnalyzeService {
  static analyzeCache(headers) {
    const cacheControl = headers['cache-control'] || '';
    const directives = {
      public: false,
      private: false,
      'no-cache': false,
      'no-store': false,
      immutable: false,
      'max-age': null,
      's-maxage': null
    };

    let summary = 'No cache-control header found.';

    if (cacheControl) {
      const parts = cacheControl.toLowerCase().split(',').map(p => p.trim());
      
      parts.forEach(part => {
        if (part === 'public') directives.public = true;
        if (part === 'private') directives.private = true;
        if (part === 'no-cache') directives['no-cache'] = true;
        if (part === 'no-store') directives['no-store'] = true;
        if (part === 'immutable') directives.immutable = true;
        
        const maxAgeMatch = part.match(/max-age=(\d+)/);
        if (maxAgeMatch) directives['max-age'] = parseInt(maxAgeMatch[1]);
        
        const sMaxAgeMatch = part.match(/s-maxage=(\d+)/);
        if (sMaxAgeMatch) directives['s-maxage'] = parseInt(sMaxAgeMatch[1]);
      });

      // Generate summary based on directives
      if (directives['no-store']) {
        summary = 'Error: This resource cannot be cached by anything. This is bad for performance.';
      } else if (directives['no-cache']) {
        summary = 'This resource can be cached, but must be re-validated with the server (ETag) on every request.';
      } else if (directives.immutable) {
        summary = 'This resource is immutable and can be cached indefinitely.';
      } else if (directives['max-age'] !== null || directives['s-maxage'] !== null) {
        const maxAge = directives['max-age'];
        const sMaxAge = directives['s-maxage'];
        const visibility = directives.public ? 'browsers and shared CDNs' : 
                          directives.private ? 'browsers only (not shared caches)' : 'caches';
        
        if (sMaxAge !== null) {
          summary = `This resource can be cached by ${visibility} for ${maxAge || 0} seconds (browsers) and ${sMaxAge} seconds (CDNs).`;
        } else if (maxAge !== null) {
          summary = `This resource can be cached by ${visibility} for ${maxAge} seconds.`;
        } else {
          summary = 'Cache-control header present but no explicit duration set.';
        }
      } else {
        summary = 'Cache-control header present but no specific caching directive found.';
      }
    }

    return { summary, directives };
  }

  static analyzeSecurity(headers) {
    const summaryPoints = [];
    const directives = {};

    // HSTS
    if (headers['strict-transport-security']) {
      directives['strict-transport-security'] = headers['strict-transport-security'];
      summaryPoints.push('Enforces HTTPS (HSTS)');
    } else {
      summaryPoints.push('Warning: HSTS header missing (vulnerable to downgrade attacks)');
    }

    // X-Frame-Options
    if (headers['x-frame-options']) {
      directives['x-frame-options'] = headers['x-frame-options'];
      const value = headers['x-frame-options'].toLowerCase();
      if (value === 'deny') {
        summaryPoints.push('Blocks clickjacking (X-Frame-Options: DENY)');
      } else if (value === 'sameorigin') {
        summaryPoints.push('Allows framing from same origin only');
      }
    } else {
      summaryPoints.push('Warning: X-Frame-Options missing (vulnerable to clickjacking)');
    }

    // X-Content-Type-Options
    if (headers['x-content-type-options']) {
      directives['x-content-type-options'] = headers['x-content-type-options'];
      summaryPoints.push('Prevents MIME-sniffing');
    } else {
      summaryPoints.push('Warning: X-Content-Type-Options missing');
    }

    // Content-Security-Policy
    if (headers['content-security-policy']) {
      directives['content-security-policy'] = headers['content-security-policy'];
      summaryPoints.push('Content Security Policy (CSP) enabled');
    }

    // X-XSS-Protection
    if (headers['x-xss-protection']) {
      directives['x-xss-protection'] = headers['x-xss-protection'];
    }

    const summary = summaryPoints.join('. ') + '.';
    return { summary, directives };
  }

  static analyzeCORS(headers) {
    const directives = {};
    let summary = 'No CORS headers found.';

    if (headers['access-control-allow-origin']) {
      directives['access-control-allow-origin'] = headers['access-control-allow-origin'];
      
      if (headers['access-control-allow-origin'] === '*') {
        summary = 'Warning: This resource is public and can be requested by *any* domain.';
      } else {
        summary = `CORS enabled for specific origin: ${headers['access-control-allow-origin']}.`;
      }
    }

    if (headers['access-control-allow-methods']) {
      directives['access-control-allow-methods'] = headers['access-control-allow-methods'];
    }

    if (headers['access-control-allow-headers']) {
      directives['access-control-allow-headers'] = headers['access-control-allow-headers'];
    }

    if (headers['access-control-allow-credentials']) {
      directives['access-control-allow-credentials'] = headers['access-control-allow-credentials'];
      if (summary.includes('Warning') && directives['access-control-allow-credentials'] === 'true') {
        summary = 'Critical: CORS allows credentials from any origin (security risk).';
      }
    }

    return { summary, directives };
  }

  static async analyzeHeaders({ url }) {
    // Validate URL and check for private IPs
    await validateAndCheckUrl(url);

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'DevSuite-Analyzer/1.0'
        },
        timeout: 10000
      };

      const request = protocol.request(url, options, (response) => {
        // Convert headers to lowercase keys
        const rawHeaders = {};
        Object.keys(response.headers).forEach(key => {
          rawHeaders[key.toLowerCase()] = response.headers[key];
        });

        const result = {
          url,
          checkedAt: new Date().toISOString(),
          httpStatus: response.statusCode,
          rawHeaders,
          analysis: {
            cache: this.analyzeCache(rawHeaders),
            security: this.analyzeSecurity(rawHeaders),
            cors: this.analyzeCORS(rawHeaders)
          }
        };

        // Consume response data to free up memory
        response.resume();
        resolve(result);
      });

      request.on('error', (error) => {
        reject({
          statusCode: 503,
          message: `Network error: ${error.message}`,
          code: error.code || 'NETWORK_ERROR'
        });
      });

      request.on('timeout', () => {
        request.destroy();
        reject({
          statusCode: 504,
          message: 'Request timeout',
          code: 'ETIMEDOUT'
        });
      });

      request.end();
    });
  }

  static async analyzeUrl({ url, timeout = 5000 }) {
    // Validate URL and check for private IPs
    await validateAndCheckUrl(url);

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const startTime = performance.now();

      let ipAddress = null;
      let sslInfo = {
        isValid: null,
        issuer: null,
        expiresOn: null,
        error: null
      };

      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'DevSuite-Analyzer/1.0'
        },
        timeout
      };

      const request = protocol.request(url, options, (response) => {
        const latencyMs = Math.round(performance.now() - startTime);
        const httpStatus = response.statusCode;

        // Determine status
        let status;
        if (httpStatus >= 200 && httpStatus < 400) {
          status = 'UP';
        } else if (httpStatus >= 400) {
          status = 'UNHEALTHY';
        } else {
          status = 'UP'; // 1xx codes
        }

        const result = {
          url,
          status,
          httpStatus,
          ipAddress,
          latencyMs,
          ssl: sslInfo,
          error: null
        };

        // Consume response data
        response.resume();
        resolve(result);
      });

      // Capture socket information
      request.on('socket', (socket) => {
        socket.on('lookup', (err, address) => {
          if (!err && address) {
            ipAddress = address;
          }
        });

        socket.on('connect', () => {
          if (!ipAddress && socket.remoteAddress) {
            ipAddress = socket.remoteAddress;
          }
        });

        // SSL certificate handling for HTTPS
        if (parsedUrl.protocol === 'https:') {
          socket.on('secureConnect', () => {
            try {
              const cert = socket.getPeerCertificate(true);
              
              if (cert && Object.keys(cert).length > 0) {
                sslInfo.isValid = socket.authorized;
                sslInfo.issuer = cert.issuer?.O || cert.issuer?.CN || 'Unknown';
                sslInfo.expiresOn = cert.valid_to ? new Date(cert.valid_to).toISOString() : null;
                
                if (!socket.authorized && socket.authorizationError) {
                  sslInfo.error = socket.authorizationError;
                  sslInfo.isValid = false;
                }
              } else {
                sslInfo.error = 'No certificate found';
                sslInfo.isValid = false;
              }
            } catch (error) {
              sslInfo.error = error.message;
              sslInfo.isValid = false;
            }
          });
        }
      });

      // Error handling
      request.on('error', (error) => {
        const latencyMs = Math.round(performance.now() - startTime);
        
        resolve({
          url,
          status: 'DOWN',
          httpStatus: null,
          ipAddress: ipAddress || null,
          latencyMs,
          ssl: parsedUrl.protocol === 'https:' ? sslInfo : null,
          error: `Network error: ${error.message} (${error.code || 'UNKNOWN'})`
        });
      });

      request.on('timeout', () => {
        request.destroy();
        const latencyMs = Math.round(performance.now() - startTime);
        
        resolve({
          url,
          status: 'DOWN',
          httpStatus: null,
          ipAddress: ipAddress || null,
          latencyMs,
          ssl: parsedUrl.protocol === 'https:' ? sslInfo : null,
          error: `Request timeout after ${timeout}ms`
        });
      });

      request.end();
    });
  }
}

export default AnalyzeService;