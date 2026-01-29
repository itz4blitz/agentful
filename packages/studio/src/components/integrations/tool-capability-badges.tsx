/**
 * Tool Capability Badges
 * Displays feature support badges for coding tools (MCP, Skills, Agents, Hooks)
 */

import { Server, Sparkles, Bot, Anchor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ToolCapabilityBadgesProps {
  supports: {
    mcp: boolean;
    skills: boolean;
    agents: boolean;
    hooks: boolean;
  };
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export function ToolCapabilityBadges({
  supports,
  size = 'sm',
  showLabels,
}: ToolCapabilityBadgesProps) {
  // Default showLabels based on size
  const shouldShowLabels = showLabels ?? (size === 'md');

  const badgeSizeClass = size === 'sm' ? 'h-5 w-5 p-0' : 'h-6 px-2 py-0.5';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const gapClass = size === 'sm' ? 'gap-1' : 'gap-1.5';

  const badges = [
    {
      key: 'mcp',
      supported: supports.mcp,
      icon: Server,
      label: 'MCP',
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    },
    {
      key: 'skills',
      supported: supports.skills,
      icon: Sparkles,
      label: 'Skills',
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
    },
    {
      key: 'agents',
      supported: supports.agents,
      icon: Bot,
      label: 'Agents',
      color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20',
    },
    {
      key: 'hooks',
      supported: supports.hooks,
      icon: Anchor,
      label: 'Hooks',
      color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
    },
  ];

  const supportedBadges = badges.filter(b => b.supported);

  if (supportedBadges.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center', gapClass)}>
      {supportedBadges.map(({ key, icon: Icon, label, color }) => (
        <Badge
          key={key}
          variant="outline"
          className={cn(
            badgeSizeClass,
            color,
            shouldShowLabels ? 'gap-1' : '',
            'border shrink-0'
          )}
          title={label}
        >
          <Icon className={cn(iconSize, shouldShowLabels ? '' : 'm-0')} />
          {shouldShowLabels && (
            <span className={cn(textSize, 'font-medium')}>{label}</span>
          )}
        </Badge>
      ))}
    </div>
  );
}
