/**
 * CLI Tool Icons
 * Using dashboard-icons from https://github.com/homarr-labs/dashboard-icons
 * CDN: https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/
 */

import { cn } from '@/lib/utils';

interface ToolIconProps {
  className?: string;
  size?: number;
  theme?: 'light' | 'dark';
}

// CDN Base URL
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg';

// Icon URL mapping for each tool
const TOOL_ICON_URLS: Record<string, { default: string; light?: string; dark?: string }> = {
  claude: {
    default: `${CDN_BASE}/claude-ai.svg`,
    light: `${CDN_BASE}/claude-ai-light.svg`,
    dark: `${CDN_BASE}/claude-ai-dark.svg`,
  },
  gemini: {
    default: `${CDN_BASE}/google-gemini.svg`,
  },
  codex: {
    default: `${CDN_BASE}/codex.svg`,
    light: `${CDN_BASE}/codex-light.svg`,
  },
  aider: {
    default: `${CDN_BASE}/code.svg`, // Fallback to generic code icon
  },
  kiro: {
    default: `${CDN_BASE}/code.svg`, // Fallback to generic code icon
  },
  cursor: {
    default: `${CDN_BASE}/github-copilot.svg`, // Similar AI assistant icon
  },
  roo: {
    default: `${CDN_BASE}/vscode.svg`, // VS Code extension
  },
  cline: {
    default: `${CDN_BASE}/vscode.svg`, // VS Code extension
  },
  kilo: {
    default: `${CDN_BASE}/vscode.svg`, // VS Code extension
  },
};

// Generic tool fallback
const GENERIC_ICON = `${CDN_BASE}/terminal.svg`;

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
        // Fallback to generic icon if load fails
        const target = e.target as HTMLImageElement;
        if (!target.src.includes('/terminal.svg')) {
          target.src = GENERIC_ICON;
        }
      }}
    />
  );
}

export function ClaudeIcon({ className, size = 20, theme = 'light' }: ToolIconProps) {
  const urls = TOOL_ICON_URLS.claude;
  const url = theme === 'dark' && urls.dark ? urls.dark : 
              theme === 'light' && urls.light ? urls.light : 
              urls.default;
  return <DashboardIcon url={url} alt="Claude Code" size={size} className={className} />;
}

export function GeminiIcon({ className, size = 20 }: ToolIconProps) {
  return <DashboardIcon url={TOOL_ICON_URLS.gemini.default} alt="Gemini CLI" size={size} className={className} />;
}

export function CodexIcon({ className, size = 20, theme = 'light' }: ToolIconProps) {
  const urls = TOOL_ICON_URLS.codex;
  const url = theme === 'light' && urls.light ? urls.light : urls.default;
  return <DashboardIcon url={url} alt="Codex CLI" size={size} className={className} />;
}

export function AiderIcon({ className, size = 20 }: ToolIconProps) {
  // Custom Aider icon (Aider doesn't have a dashboard-icon yet)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#4F46E5" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {'</>'}
      </text>
    </svg>
  );
}

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
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        R
      </text>
    </svg>
  );
}

export function ClineIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#6366F1" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        C
      </text>
    </svg>
  );
}

export function KiloIcon({ className, size = 20 }: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#EC4899" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        K
      </text>
    </svg>
  );
}

export function GenericToolIcon({ className, size = 20 }: ToolIconProps) {
  return <DashboardIcon url={GENERIC_ICON} alt="Tool" size={size} className={className} />;
}

// Get icon component by tool ID
export function getToolIconComponent(toolId: string, size?: number, theme: 'light' | 'dark' = 'light') {
  switch (toolId) {
    case 'claude':
      return <ClaudeIcon size={size} theme={theme} />;
    case 'gemini':
      return <GeminiIcon size={size} />;
    case 'codex':
      return <CodexIcon size={size} theme={theme} />;
    case 'aider':
      return <AiderIcon size={size} />;
    case 'kiro':
      return <KiroIcon size={size} />;
    case 'cursor':
      return <CursorIcon size={size} />;
    case 'roo':
      return <RooIcon size={size} />;
    case 'cline':
      return <ClineIcon size={size} />;
    case 'kilo':
      return <KiloIcon size={size} />;
    default:
      return <GenericToolIcon size={size} />;
  }
}

// Get icon URL for external use
export function getToolIconUrl(toolId: string, theme: 'light' | 'dark' = 'light'): string {
  const urls = TOOL_ICON_URLS[toolId];
  if (!urls) return GENERIC_ICON;
  
  return theme === 'dark' && urls.dark ? urls.dark :
         theme === 'light' && urls.light ? urls.light :
         urls.default;
}

// Export icon mapping for tool selector
export { TOOL_ICON_URLS };
