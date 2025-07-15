/**
 * Link detection utility for terminal output
 * Detects and makes clickable links in terminal text
 */

import React from 'react';

/**
 * URL detection patterns
 */
const URL_PATTERNS = {
  // Standard HTTP/HTTPS URLs
  standard: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  
  // Localhost URLs with port
  localhost: /https?:\/\/localhost(:\d{1,5})?(\/[^\s]*)?/g,
  
  // Local IP addresses
  localIP: /https?:\/\/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:\d{1,5})?(\/[^\s]*)?/g,
  
  // File URLs
  file: /file:\/\/[^\s]+/g,
  
  // URLs without protocol (www.)
  wwwUrls: /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
};

/**
 * Link types and their styling
 */
export interface LinkStyle {
  color?: string;
  textDecoration?: string;
  fontWeight?: string;
  cursor?: string;
  hover?: {
    color?: string;
    textDecoration?: string;
  };
}

export interface LinkDetectorConfig {
  enableStandardUrls?: boolean;
  enableLocalhost?: boolean;
  enableLocalIP?: boolean;
  enableFileUrls?: boolean;
  enableWwwUrls?: boolean;
  openInNewTab?: boolean;
  linkStyle?: LinkStyle;
  className?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LinkDetectorConfig = {
  enableStandardUrls: true,
  enableLocalhost: true,
  enableLocalIP: true,
  enableFileUrls: true,
  enableWwwUrls: true,
  openInNewTab: true,
  className: 'text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors cursor-pointer'
};

/**
 * Link component for rendering clickable links
 */
interface LinkProps {
  href: string;
  children: React.ReactNode;
  openInNewTab?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Link: React.FC<LinkProps> = ({ 
  href, 
  children, 
  openInNewTab = true, 
  className = '',
  style = {}
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Ensure protocol is present
    let url = href;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      url = `http://${url}`;
    }
    
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      title={`Open ${href}`}
    >
      {children}
    </a>
  );
};

/**
 * Detect and replace URLs in text with clickable links
 */
export function detectAndReplaceLinks(
  text: string,
  config: LinkDetectorConfig = {}
): React.ReactNode[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // If no patterns are enabled, return original text
  if (!mergedConfig.enableStandardUrls && 
      !mergedConfig.enableLocalhost && 
      !mergedConfig.enableLocalIP && 
      !mergedConfig.enableFileUrls && 
      !mergedConfig.enableWwwUrls) {
    return [text];
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const matches: Array<{ match: string; index: number; type: string }> = [];

  // Collect all matches
  if (mergedConfig.enableStandardUrls) {
    const standardMatches = Array.from(text.matchAll(URL_PATTERNS.standard));
    standardMatches.forEach(match => {
      if (match.index !== undefined) {
        matches.push({
          match: match[0],
          index: match.index,
          type: 'standard'
        });
      }
    });
  }

  if (mergedConfig.enableLocalhost) {
    const localhostMatches = Array.from(text.matchAll(URL_PATTERNS.localhost));
    localhostMatches.forEach(match => {
      if (match.index !== undefined) {
        matches.push({
          match: match[0],
          index: match.index,
          type: 'localhost'
        });
      }
    });
  }

  if (mergedConfig.enableLocalIP) {
    const localIPMatches = Array.from(text.matchAll(URL_PATTERNS.localIP));
    localIPMatches.forEach(match => {
      if (match.index !== undefined) {
        matches.push({
          match: match[0],
          index: match.index,
          type: 'localIP'
        });
      }
    });
  }

  if (mergedConfig.enableFileUrls) {
    const fileMatches = Array.from(text.matchAll(URL_PATTERNS.file));
    fileMatches.forEach(match => {
      if (match.index !== undefined) {
        matches.push({
          match: match[0],
          index: match.index,
          type: 'file'
        });
      }
    });
  }

  if (mergedConfig.enableWwwUrls) {
    const wwwMatches = Array.from(text.matchAll(URL_PATTERNS.wwwUrls));
    wwwMatches.forEach(match => {
      if (match.index !== undefined) {
        matches.push({
          match: match[0],
          index: match.index,
          type: 'www'
        });
      }
    });
  }

  // Sort matches by index to process them in order
  matches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep the first one)
  const filteredMatches = matches.filter((match, index) => {
    if (index === 0) return true;
    const prevMatch = matches[index - 1];
    return match.index >= prevMatch.index + prevMatch.match.length;
  });

  // Process matches and build result
  filteredMatches.forEach((match, index) => {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the link
    parts.push(
      <Link
        key={`link-${index}`}
        href={match.match}
        openInNewTab={mergedConfig.openInNewTab}
        className={mergedConfig.className}
        style={mergedConfig.linkStyle}
      >
        {match.match}
      </Link>
    );

    lastIndex = match.index + match.match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Process terminal output and make links clickable
 */
export function processTerminalOutput(
  output: string,
  config: LinkDetectorConfig = {}
): React.ReactNode {
  const lines = output.split('\n');
  
  return (
    <div className="whitespace-pre-wrap font-mono">
      {lines.map((line, lineIndex) => (
        <div key={lineIndex}>
          {detectAndReplaceLinks(line, config)}
        </div>
      ))}
    </div>
  );
}

/**
 * Check if a string contains any URLs
 */
export function containsLinks(text: string): boolean {
  return (
    URL_PATTERNS.standard.test(text) ||
    URL_PATTERNS.localhost.test(text) ||
    URL_PATTERNS.localIP.test(text) ||
    URL_PATTERNS.file.test(text) ||
    URL_PATTERNS.wwwUrls.test(text)
  );
}

/**
 * Extract all URLs from text
 */
export function extractUrls(text: string): string[] {
  const urls: string[] = [];
  
  // Reset regex lastIndex
  Object.values(URL_PATTERNS).forEach(pattern => {
    pattern.lastIndex = 0;
  });
  
  const standardMatches = Array.from(text.matchAll(URL_PATTERNS.standard));
  const localhostMatches = Array.from(text.matchAll(URL_PATTERNS.localhost));
  const localIPMatches = Array.from(text.matchAll(URL_PATTERNS.localIP));
  const fileMatches = Array.from(text.matchAll(URL_PATTERNS.file));
  const wwwMatches = Array.from(text.matchAll(URL_PATTERNS.wwwUrls));
  
  [...standardMatches, ...localhostMatches, ...localIPMatches, ...fileMatches, ...wwwMatches]
    .forEach(match => {
      if (match[0] && !urls.includes(match[0])) {
        urls.push(match[0]);
      }
    });
  
  return urls;
}

/**
 * Simple hook for using link detection in components
 */
export function useLinkDetection(config: LinkDetectorConfig = {}) {
  return {
    detectAndReplaceLinks: (text: string) => detectAndReplaceLinks(text, config),
    processTerminalOutput: (output: string) => processTerminalOutput(output, config),
    containsLinks,
    extractUrls
  };
}

export default {
  detectAndReplaceLinks,
  processTerminalOutput,
  containsLinks,
  extractUrls,
  useLinkDetection
};