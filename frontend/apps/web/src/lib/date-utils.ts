/**
 * Date utility functions for formatting timestamps and dates
 */

/**
 * Format a Unix timestamp to a human-readable date string
 * @param timestamp - Unix timestamp in seconds
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatUnixTimestamp(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
): string {
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting Unix timestamp:', error);
    return 'Invalid date';
  }
}

/**
 * Format an ISO timestamp to a human-readable date string
 * @param timestamp - ISO 8601 timestamp string
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatISOTimestamp(
  timestamp: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting ISO timestamp:', error);
    return 'Invalid date';
  }
}

/**
 * Format a timestamp to a relative time string (e.g., "5 minutes ago")
 * @param timestamp - Unix timestamp in seconds or ISO string
 * @param now - Current timestamp for comparison (defaults to Date.now())
 * @returns Relative time string
 */
export function formatTimeAgo(
  timestamp: number | string,
  now: number = Date.now()
): string {
  try {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      // Assume Unix timestamp in seconds
      date = new Date(timestamp * 1000);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const diffMs = now - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
      return diffSeconds <= 1 ? 'just now' : `${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'Invalid date';
  }
}

/**
 * Get the current timestamp as a Unix timestamp in seconds
 * @returns Current Unix timestamp in seconds
 */
export function getCurrentUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get the current timestamp as an ISO string
 * @returns Current ISO timestamp string
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if a timestamp is valid
 * @param timestamp - Unix timestamp in seconds or ISO string
 * @returns True if timestamp is valid
 */
export function isValidTimestamp(timestamp: number | string): boolean {
  try {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp * 1000);
    }
    
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Convert between Unix timestamp and ISO string
 */
export const timestampConverters = {
  /**
   * Convert Unix timestamp to ISO string
   * @param unixTimestamp - Unix timestamp in seconds
   * @returns ISO string
   */
  unixToISO: (unixTimestamp: number): string => {
    return new Date(unixTimestamp * 1000).toISOString();
  },

  /**
   * Convert ISO string to Unix timestamp
   * @param isoString - ISO 8601 timestamp string
   * @returns Unix timestamp in seconds
   */
  isoToUnix: (isoString: string): number => {
    return Math.floor(new Date(isoString).getTime() / 1000);
  }
};