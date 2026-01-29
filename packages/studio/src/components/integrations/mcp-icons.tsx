/**
 * MCP Server Icons
 * Using dashboard-icons from https://github.com/homarr-labs/dashboard-icons
 * CDN: https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/
 */

import { 
  FolderOpen, Database, Globe, 
  Search, Map, Bug, MessageSquare, FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

// CDN Base URL
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg';

interface MCPIconProps {
  className?: string;
  size?: number;
}

function DashboardIcon({ 
  url, 
  alt, 
  size = 20, 
  className 
}: { 
  url: string; 
  alt: string; 
  size?: number; 
  className?: string;
}) {
  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      className={cn("inline-block object-contain", className)}
      onError={(e) => {
        // Hide image on error, parent will show fallback
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

// Filesystem icon
export function FilesystemIcon({ className, size = 20 }: MCPIconProps) {
  return <FolderOpen className={cn("text-blue-500", className)} style={{ width: size, height: size }} />;
}

// GitHub icon - using dashboard-icons
export function GitHubIcon({ className, size = 20 }: MCPIconProps) {
  return <DashboardIcon url={`${CDN_BASE}/github.svg`} alt="GitHub" size={size} className={className} />;
}

// PostgreSQL icon
export function PostgresIcon({ className, size = 20 }: MCPIconProps) {
  return <Database className={cn("text-blue-600", className)} style={{ width: size, height: size }} />;
}

// SQLite icon
export function SQLiteIcon({ className, size = 20 }: MCPIconProps) {
  return <Database className={cn("text-green-600", className)} style={{ width: size, height: size }} />;
}

// Puppeteer icon (browser/theater)
export function PuppeteerIcon({ className, size = 20 }: MCPIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 4V2M16 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 20L8 22M17 20L16 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Fetch icon
export function FetchIcon({ className, size = 20 }: MCPIconProps) {
  return <Globe className={cn("text-cyan-500", className)} style={{ width: size, height: size }} />;
}

// Brave Search icon - using dashboard-icons
export function BraveSearchIcon({ className, size = 20 }: MCPIconProps) {
  return <DashboardIcon url={`${CDN_BASE}/brave.svg`} alt="Brave" size={size} className={className} />;
}

// Google Maps icon - using dashboard-icons
export function GoogleMapsIcon({ className, size = 20 }: MCPIconProps) {
  return <DashboardIcon url={`${CDN_BASE}/google-maps.svg`} alt="Google Maps" size={size} className={className} />;
}

// Sentry icon
export function SentryIcon({ className, size = 20 }: MCPIconProps) {
  return <Bug className={cn("text-red-500", className)} style={{ width: size, height: size }} />;
}

// Slack icon
export function SlackIcon({ className, size = 20 }: MCPIconProps) {
  return <MessageSquare className={cn("text-purple-500", className)} style={{ width: size, height: size }} />;
}

// Generic MCP icon
export function GenericMCPIcon({ className, size = 20 }: MCPIconProps) {
  return <FileCode className={cn("text-gray-500", className)} style={{ width: size, height: size }} />;
}

// Get icon component by MCP server ID
export function getMCPIconComponent(serverId: string, size?: number) {
  switch (serverId) {
    case 'filesystem':
      return <FilesystemIcon size={size} />;
    case 'github':
      return <GitHubIcon size={size} />;
    case 'postgres':
      return <PostgresIcon size={size} />;
    case 'sqlite':
      return <SQLiteIcon size={size} />;
    case 'puppeteer':
      return <PuppeteerIcon size={size} className="text-pink-500" />;
    case 'fetch':
      return <FetchIcon size={size} />;
    case 'brave-search':
      return <BraveSearchIcon size={size} />;
    case 'google-maps':
      return <GoogleMapsIcon size={size} />;
    case 'sentry':
      return <SentryIcon size={size} />;
    case 'slack':
      return <SlackIcon size={size} />;
    default:
      return <GenericMCPIcon size={size} />;
  }
}

// Get color class for MCP server
export function getMCPColorClass(serverId: string): string {
  switch (serverId) {
    case 'filesystem':
      return 'text-blue-500 bg-blue-500/10';
    case 'github':
      return 'text-gray-900 dark:text-white bg-gray-500/10';
    case 'postgres':
      return 'text-blue-600 bg-blue-600/10';
    case 'sqlite':
      return 'text-green-600 bg-green-600/10';
    case 'puppeteer':
      return 'text-pink-500 bg-pink-500/10';
    case 'fetch':
      return 'text-cyan-500 bg-cyan-500/10';
    case 'brave-search':
      return 'text-orange-500 bg-orange-500/10';
    case 'google-maps':
      return 'text-green-500 bg-green-500/10';
    case 'sentry':
      return 'text-red-500 bg-red-500/10';
    case 'slack':
      return 'text-purple-500 bg-purple-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}
