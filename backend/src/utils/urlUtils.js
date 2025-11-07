import dns from 'dns/promises';
import { isPrivateIP } from './ipUtils.js';

export async function validateAndCheckUrl(urlString) {
  let parsedUrl;
  
  // Parse URL
  try {
    parsedUrl = new URL(urlString);
  } catch (error) {
    throw {
      statusCode: 400,
      message: `Invalid URL format: ${error.message}`,
      code: 'INVALID_URL_FORMAT'
    };
  }

  // Validate protocol
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw {
      statusCode: 400,
      message: 'URL must use HTTP or HTTPS protocol',
      code: 'INVALID_PROTOCOL'
    };
  }

  // Resolve hostname to IP addresses
  let ipAddresses;
  try {
    ipAddresses = await dns.resolve(parsedUrl.hostname);
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw {
        statusCode: 400,
        message: `Hostname could not be resolved: ${parsedUrl.hostname}`,
        code: 'DNS_RESOLUTION_FAILED'
      };
    }
    throw {
      statusCode: 400,
      message: `DNS lookup failed: ${error.message}`,
      code: 'DNS_ERROR'
    };
  }

  // Check if any resolved IP is private
  const privateIPs = ipAddresses.filter(ip => isPrivateIP(ip));
  if (privateIPs.length > 0) {
    throw {
      statusCode: 400,
      message: `URL resolves to private IP address(es): ${privateIPs.join(', ')}. Access to private IPs is not allowed.`,
      code: 'PRIVATE_IP_DETECTED'
    };
  }

  return {
    parsedUrl,
    hostname: parsedUrl.hostname,
    ipAddresses
  };
}