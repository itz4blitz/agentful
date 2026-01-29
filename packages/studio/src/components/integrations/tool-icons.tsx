/**
 * CLI Tool Icons
 * Custom SVG icons for each coding CLI tool
 */

import { cn } from '@/lib/utils';

interface ToolIconProps {
  className?: string;
  size?: number;
}

// Anthropic Claude - Purple gradient with "A" mark
export function ClaudeIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="url(#claude-gradient)" />
      <path
        d="M16 8L10 24H13L14.5 19.5H17.5L19 24H22L16 8ZM15.2 17L16 13.5L16.8 17H15.2Z"
        fill="white"
      />
      <defs>
        <linearGradient id="claude-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#D4A574" />
          <stop offset="1" stopColor="#C9A86C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Google Gemini - Blue gradient with sparkle
export function GeminiIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="url(#gemini-gradient)" />
      <path
        d="M16 6L17.5 12.5H24L18.5 16.5L20 23L16 19L12 23L13.5 16.5L8 12.5H14.5L16 6Z"
        fill="white"
      />
      <defs>
        <linearGradient id="gemini-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#34A853" />
          <stop offset="1" stopColor="#EA4335" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// OpenAI Codex - Green with code brackets
export function CodexIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#10A37F" />
      <path
        d="M11 11L7 16L11 21"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 11L25 16L21 21"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 22L18 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Kiro - Green circle with "K"
export function KiroIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#22C55E" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        K
      </text>
    </svg>
  );
}

// Cursor - White with cursor icon
export function CursorIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#1E1E1E" />
      <path
        d="M10 8L10 22L14 18L18 24L20 23L16 17L22 17L10 8Z"
        fill="white"
      />
    </svg>
  );
}

// Roo Code - Orange with kangaroo/roo silhouette
export function RooIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#F97316" />
      <path
        d="M16 8C12 8 10 11 10 14C10 17 12 19 14 20V24H18V20C20 19 22 17 22 14C22 11 20 8 16 8ZM16 17C14.5 17 13.5 16 13.5 14.5C13.5 13 14.5 12 16 12C17.5 12 18.5 13 18.5 14.5C18.5 16 17.5 17 16 17Z"
        fill="white"
      />
    </svg>
  );
}

// Generic tool icon
export function GenericToolIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#6B7280" />
      <path
        d="M14 10L14 14L10 14L10 18L14 18L14 22L18 22L18 18L22 18L22 14L18 14L18 10L14 10Z"
        fill="white"
      />
    </svg>
  );
}

// Get icon component by tool ID
export function getToolIconComponent(toolId: string, size?: number) {
  switch (toolId) {
    case 'claude':
      return <ClaudeIcon size={size} />;
    case 'gemini':
      return <GeminiIcon size={size} />;
    case 'codex':
      return <CodexIcon size={size} />;
    case 'kiro':
      return <KiroIcon size={size} />;
    case 'cursor':
      return <CursorIcon size={size} />;
    case 'roo':
      return <RooIcon size={size} />;
    default:
      return <GenericToolIcon size={size} />;
  }
}
