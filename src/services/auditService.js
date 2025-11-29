import pool from '../config/database.js';
import { getIpGeolocation } from './ipGeolocationService.js';

/**
 * Helper to extract IP from request object
 */
function getIpFromRequest(req) {
  if (!req) return null;
  return req.clientIp || 
         req.ip || 
         req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers?.['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         null;
}

/**
 * Audit log function
 * @param {number} userId - User ID
 * @param {string} action - Action name
 * @param {object} meta - Metadata object
 * @param {string|null} ip - IP address (optional, can be extracted from req)
 * @param {string|null} country - Country (optional, will be fetched if IP provided)
 * @param {string|null} city - City (optional, will be fetched if IP provided)
 * @param {object|null} req - Express request object (optional, used to extract IP if not provided)
 */
export async function auditLog(userId, action, meta = {}, ip = null, country = null, city = null, req = null) {
  try {
    // Extract IP from request if not provided
    if (!ip && req) {
      ip = getIpFromRequest(req);
    }

    // If IP is provided but country/city are not, try to get them from geolocation service
    if (ip && (!country || !city)) {
      try {
        const geoData = await getIpGeolocation(ip);
        // Only override if we got valid data
        if (geoData.country) country = geoData.country;
        if (geoData.city) city = geoData.city;
      } catch (geoError) {
        // Silently fail - geolocation is optional
        console.warn('Geolocation lookup failed:', geoError.message);
      }
    }

    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, meta, ip, country, city) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, JSON.stringify(meta), ip, country, city]
    );
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the app
  }
}

