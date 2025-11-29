/**
 * IP Geolocation Service
 * Uses ip-api.com (free tier: 45 requests/minute)
 * Alternative: ipapi.co, ipgeolocation.io
 */

const IP_API_URL = 'https://ip-api.com/json';

// Cache to avoid too many API calls for the same IP
const ipCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getIpGeolocation(ip) {
  // Skip localhost and private IPs
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: null, city: null };
  }

  // Check cache first
  const cached = ipCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { country: cached.country, city: cached.city };
  }

  try {
    const response = await fetch(`${IP_API_URL}/${ip}?fields=status,message,country,city`);
    
    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.warn(`IP geolocation failed for ${ip}:`, data.message);
      return { country: null, city: null };
    }

    const result = {
      country: data.country || null,
      city: data.city || null
    };

    // Cache the result
    ipCache.set(ip, {
      ...result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error(`Error fetching IP geolocation for ${ip}:`, error.message);
    // Return null values on error - don't block the request
    return { country: null, city: null };
  }
}

// Clean cache periodically (optional)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipCache.entries()) {
      if (now - data.timestamp > CACHE_TTL) {
        ipCache.delete(ip);
      }
    }
  }, 60 * 60 * 1000); // Clean every hour
}

