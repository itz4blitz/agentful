import React from 'react'

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
  animate?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  size = 32,
  className = '',
  showText = true,
  animate = true,
}) => {
  const iconSize = size
  const totalWidth = showText ? size * 5.5 : size

  return (
    <div
      className={`agentful-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.625rem',
        userSelect: 'none',
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? 'agentful-logo-icon' : ''}
        style={{
          display: 'block',
        }}
      >
        {/* Define gradients */}
        <defs>
          {/* Primary gradient - Emerald to Cyan */}
          <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Secondary gradient - Cyan to Purple */}
          <linearGradient id="gradient-secondary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Radial gradient for center node */}
          <radialGradient id="gradient-radial">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* Connection lines - representing agent collaboration */}
        <g className="connections" opacity="0.6">
          {/* Center to top-right */}
          <line
            x1="20"
            y1="20"
            x2="31"
            y2="12"
            stroke="url(#gradient-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Center to right */}
          <line
            x1="20"
            y1="20"
            x2="33"
            y2="20"
            stroke="url(#gradient-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Center to bottom-right */}
          <line
            x1="20"
            y1="20"
            x2="31"
            y2="28"
            stroke="url(#gradient-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Center to top-left */}
          <line
            x1="20"
            y1="20"
            x2="9"
            y2="12"
            stroke="url(#gradient-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Center to left */}
          <line
            x1="20"
            y1="20"
            x2="7"
            y2="20"
            stroke="url(#gradient-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Center to bottom-left */}
          <line
            x1="20"
            y1="20"
            x2="9"
            y2="28"
            stroke="url(#gradient-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Agent nodes - hexagonal pattern */}
        <g className="nodes">
          {/* Center node (orchestrator) - larger */}
          <circle
            cx="20"
            cy="20"
            r="4.5"
            fill="url(#gradient-radial)"
            stroke="url(#gradient-primary)"
            strokeWidth="2"
            filter="url(#glow)"
            className="center-node"
          />

          {/* Outer nodes (agents) */}
          {/* Top-right */}
          <circle
            cx="31"
            cy="12"
            r="3"
            fill="#0f172a"
            stroke="url(#gradient-primary)"
            strokeWidth="2"
            className="outer-node"
          />
          {/* Right */}
          <circle
            cx="33"
            cy="20"
            r="3"
            fill="#0f172a"
            stroke="url(#gradient-primary)"
            strokeWidth="2"
            className="outer-node"
          />
          {/* Bottom-right */}
          <circle
            cx="31"
            cy="28"
            r="3"
            fill="#0f172a"
            stroke="url(#gradient-primary)"
            strokeWidth="2"
            className="outer-node"
          />
          {/* Top-left */}
          <circle
            cx="9"
            cy="12"
            r="3"
            fill="#0f172a"
            stroke="url(#gradient-secondary)"
            strokeWidth="2"
            className="outer-node"
          />
          {/* Left */}
          <circle
            cx="7"
            cy="20"
            r="3"
            fill="#0f172a"
            stroke="url(#gradient-secondary)"
            strokeWidth="2"
            className="outer-node"
          />
          {/* Bottom-left */}
          <circle
            cx="9"
            cy="28"
            r="3"
            fill="#0f172a"
            stroke="url(#gradient-secondary)"
            strokeWidth="2"
            className="outer-node"
          />
        </g>

        {/* Inner sparkle details */}
        <g className="sparkles" opacity="0.8">
          {/* Center sparkle */}
          <circle cx="20" cy="20" r="1.5" fill="#ffffff" opacity="0.9" />
          {/* Small accent dots */}
          <circle cx="31" cy="12" r="0.8" fill="#10b981" />
          <circle cx="33" cy="20" r="0.8" fill="#06b6d4" />
          <circle cx="31" cy="28" r="0.8" fill="#10b981" />
          <circle cx="9" cy="12" r="0.8" fill="#8b5cf6" />
          <circle cx="7" cy="20" r="0.8" fill="#06b6d4" />
          <circle cx="9" cy="28" r="0.8" fill="#8b5cf6" />
        </g>
      </svg>

      {showText && (
        <span
          className="agentful-logo-text"
          style={{
            fontSize: `${size * 0.625}px`,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          agentful
        </span>
      )}

      {animate && (
        <style>{`
          @keyframes pulse-glow {
            0%, 100% {
              filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
            }
            50% {
              filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.8));
            }
          }

          @keyframes rotate-nodes {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          @keyframes pulse-node {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.1);
            }
          }

          .agentful-logo-icon {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .agentful-logo:hover .agentful-logo-icon {
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
          }

          .agentful-logo:hover .center-node {
            animation: pulse-node 2s ease-in-out infinite;
          }

          .agentful-logo:hover .outer-node {
            animation: pulse-node 2s ease-in-out infinite;
            animation-delay: 0.1s;
          }

          .agentful-logo:hover .connections {
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }

          .agentful-logo:hover .sparkles {
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
          }

          /* Smooth text gradient animation on hover */
          .agentful-logo:hover .agentful-logo-text {
            background-size: 200% 200%;
            animation: gradient-shift 3s ease infinite;
          }

          @keyframes gradient-shift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      )}
    </div>
  )
}

// Icon-only variant for compact spaces
export const LogoIcon: React.FC<Omit<LogoProps, 'showText'>> = (props) => {
  return <Logo {...props} showText={false} />
}

// Large hero variant with enhanced details
export const LogoHero: React.FC<Omit<LogoProps, 'size'>> = (props) => {
  return <Logo {...props} size={120} />
}
