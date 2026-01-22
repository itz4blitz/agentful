import React, { useState, useMemo } from 'react'

// Type definitions
export type GateId = 'types' | 'lint' | 'tests' | 'coverage' | 'security' | 'deadcode'
export type GateStatus = 'pass' | 'fail'

export interface QualityGateMetric {
  value: number
  unit: string
  total?: number
}

export interface QualityGate {
  id: GateId
  name: string
  icon: string
  color: string
  status: GateStatus
  metric: QualityGateMetric
  description: string
  details?: string
  lastChecked?: Date
}

export interface QualityGateDashboardProps {
  gates?: QualityGate[]
  showOverallScore?: boolean
  interactive?: boolean
  compact?: boolean
}

// Sample data for demonstration
const sampleGates: QualityGate[] = [
  {
    id: 'types',
    name: 'Type Checking',
    icon: '📘',
    color: '#3b82f6',
    status: 'pass',
    metric: { value: 0, unit: 'errors' },
    description: 'No type errors in codebase',
    details: 'TypeScript compilation completed successfully with zero type errors.',
    lastChecked: new Date(),
  },
  {
    id: 'lint',
    name: 'Linting',
    icon: '✨',
    color: '#8b5cf6',
    status: 'pass',
    metric: { value: 0, unit: 'violations' },
    description: 'Code follows style guide',
    details: 'ESLint checked all files with no violations found.',
    lastChecked: new Date(),
  },
  {
    id: 'tests',
    name: 'Tests',
    icon: '🧪',
    color: '#f59e0b',
    status: 'pass',
    metric: { value: 24, total: 24, unit: 'passing' },
    description: 'All tests passing',
    details: 'Test suite completed with 24 out of 24 tests passing.',
    lastChecked: new Date(),
  },
  {
    id: 'coverage',
    name: 'Coverage',
    icon: '📊',
    color: '#14b8a6',
    status: 'pass',
    metric: { value: 87, unit: '%' },
    description: 'Minimum 80% coverage required',
    details: 'Code coverage is at 87%, exceeding the minimum requirement of 80%.',
    lastChecked: new Date(),
  },
  {
    id: 'security',
    name: 'Security',
    icon: '🔒',
    color: '#ef4444',
    status: 'pass',
    metric: { value: 0, unit: 'vulnerabilities' },
    description: 'No known vulnerabilities',
    details: 'Security audit found no vulnerabilities in dependencies.',
    lastChecked: new Date(),
  },
  {
    id: 'deadcode',
    name: 'Dead Code',
    icon: '🗑️',
    color: '#6b7280',
    status: 'pass',
    metric: { value: 0, unit: 'unused exports' },
    description: 'No unused code detected',
    details: 'Static analysis found no unused exports, files, or dependencies.',
    lastChecked: new Date(),
  },
]

// Circular progress component for coverage
interface CircularProgressProps {
  value: number
  color: string
  size?: number
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, color, size = 120 }) => {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
      role="img"
      aria-label={`${value}% coverage`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="8"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="600"
        fill={color}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {value}%
      </text>
    </svg>
  )
}

// Status badge component
interface StatusBadgeProps {
  status: GateStatus
  animated?: boolean
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, animated = true }) => {
  const isPass = status === 'pass'

  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: isPass ? '#10b981' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '18px',
        boxShadow: isPass
          ? '0 0 10px rgba(16, 185, 129, 0.4)'
          : '0 0 10px rgba(239, 68, 68, 0.4)',
        animation: animated ? (isPass ? 'statusAppear 0.3s ease-out' : 'statusShake 0.5s ease-out') : 'none',
      }}
      role="status"
      aria-label={isPass ? 'Passed' : 'Failed'}
    >
      {isPass ? '✓' : '✗'}
    </div>
  )
}

// Quality Gate Card component
interface QualityGateCardProps {
  gate: QualityGate
  compact: boolean
  interactive: boolean
  onExpand?: (gate: QualityGate) => void
}

const QualityGateCard: React.FC<QualityGateCardProps> = ({
  gate,
  compact,
  interactive,
  onExpand
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const isPass = gate.status === 'pass'
  const showCoverage = gate.id === 'coverage'

  const handleClick = () => {
    if (interactive) {
      setIsExpanded(!isExpanded)
      onExpand?.(gate)
    }
  }

  const formatMetric = () => {
    if (gate.metric.total !== undefined) {
      return `${gate.metric.value}/${gate.metric.total}`
    }
    return gate.metric.value.toString()
  }

  const formatLastChecked = () => {
    if (!gate.lastChecked) return ''
    const now = new Date()
    const diff = Math.floor((now.getTime() - gate.lastChecked.getTime()) / 1000)

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${gate.color}`,
        background: isPass
          ? `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(30, 41, 59, 0.8) 100%)`
          : `linear-gradient(135deg, rgba(59, 41, 30, 0.7) 0%, rgba(59, 41, 30, 0.8) 100%)`,
        backdropFilter: 'blur(10px)',
        padding: compact ? '16px' : '24px',
        boxShadow: isPass
          ? isHovered
            ? `0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 0 30px ${gate.color}40`
            : `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 20px ${gate.color}20`
          : `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 20px rgba(239, 68, 68, 0.2)`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: interactive ? 'pointer' : 'default',
        animation: !isPass ? 'failShake 0.5s ease-out' : 'fadeIn 0.3s ease-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="article"
      aria-label={`${gate.name} quality gate: ${gate.status}`}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: compact ? '12px' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: compact ? '32px' : '48px',
              lineHeight: 1,
              filter: `drop-shadow(0 0 8px ${gate.color}80)`,
            }}
            role="img"
            aria-label={`${gate.name} icon`}
          >
            {gate.icon}
          </div>
          <h3
            style={{
              fontSize: compact ? '1rem' : '1.25rem',
              fontWeight: '600',
              color: '#f1f5f9',
              margin: 0,
            }}
          >
            {gate.name}
          </h3>
        </div>
        <StatusBadge status={gate.status} />
      </div>

      {/* Metric Display */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: compact ? '80px' : '120px',
          marginBottom: compact ? '12px' : '16px',
        }}
      >
        {showCoverage ? (
          <CircularProgress
            value={gate.metric.value}
            color={gate.color}
            size={compact ? 100 : 120}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: compact ? '2rem' : '3rem',
                fontWeight: '700',
                color: gate.color,
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {formatMetric()}
            </div>
            <div
              style={{
                fontSize: compact ? '0.875rem' : '1rem',
                color: '#94a3b8',
                textTransform: 'lowercase',
              }}
            >
              {gate.metric.unit}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: compact ? '0.75rem' : '0.875rem',
          color: '#cbd5e1',
          lineHeight: '1.5',
          margin: 0,
          marginBottom: compact ? '8px' : '12px',
        }}
      >
        {gate.description}
      </p>

      {/* Expanded Details */}
      {isExpanded && gate.details && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            fontSize: '0.875rem',
            color: '#e2e8f0',
            lineHeight: '1.5',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {gate.details}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748b',
          marginTop: '8px',
        }}
      >
        <span>Last checked: {formatLastChecked()}</span>
        {interactive && (
          <span
            style={{
              color: gate.color,
              fontWeight: '500',
              opacity: isHovered ? 1 : 0.7,
              transition: 'opacity 0.2s',
            }}
          >
            {isExpanded ? 'Hide details' : 'View details'}
          </span>
        )}
      </div>
    </div>
  )
}

// Overall Score component
interface OverallScoreProps {
  gates: QualityGate[]
  compact: boolean
}

const OverallScore: React.FC<OverallScoreProps> = ({ gates, compact }) => {
  const score = useMemo(() => {
    const passing = gates.filter((g) => g.status === 'pass').length
    const total = gates.length
    return {
      passing,
      total,
      percentage: Math.round((passing / total) * 100),
    }
  }, [gates])

  const getScoreColor = () => {
    if (score.percentage === 100) return '#10b981'
    if (score.percentage >= 80) return '#f59e0b'
    return '#ef4444'
  }

  const color = getScoreColor()

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `2px solid ${color}`,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        padding: compact ? '20px' : '32px',
        boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 0 40px ${color}30`,
        marginBottom: compact ? '20px' : '32px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      role="region"
      aria-label="Overall quality score"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {/* Score Circle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <CircularProgress
            value={score.percentage}
            color={color}
            size={compact ? 120 : 150}
          />
          <div>
            <h2
              style={{
                fontSize: compact ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#f1f5f9',
                margin: 0,
                marginBottom: '8px',
              }}
            >
              Quality Gates
            </h2>
            <div
              style={{
                fontSize: compact ? '1rem' : '1.25rem',
                color: '#cbd5e1',
              }}
            >
              {score.passing}/{score.total} passing
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            minWidth: '200px',
          }}
        >
          {gates.map((gate) => (
            <div
              key={gate.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: '#cbd5e1',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: gate.status === 'pass' ? '#10b981' : '#ef4444',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{gate.name}</span>
              <span style={{ color: gate.color, fontWeight: '500' }}>
                {gate.status === 'pass' ? 'Pass' : 'Fail'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component
export const QualityGateDashboard: React.FC<QualityGateDashboardProps> = ({
  gates = sampleGates,
  showOverallScore = true,
  interactive = true,
  compact = false,
}) => {
  const handleGateExpand = (gate: QualityGate) => {
    // Could emit events or handle external state updates here
    // Event handling logic can be added here if needed
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: compact ? '16px' : '24px',
      }}
    >
      {/* Inject CSS animations */}
      <style>
        {`
          @keyframes passGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
            50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
          }

          @keyframes failShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes statusAppear {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes statusShake {
            0%, 100% { transform: rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
            20%, 40%, 60%, 80% { transform: rotate(10deg); }
          }
        `}
      </style>

      {/* Overall Score */}
      {showOverallScore && <OverallScore gates={gates} compact={compact} />}

      {/* Quality Gates Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: compact ? '16px' : '24px',
        }}
        role="list"
        aria-label="Quality gates"
      >
        {gates.map((gate) => (
          <QualityGateCard
            key={gate.id}
            gate={gate}
            compact={compact}
            interactive={interactive}
            onExpand={handleGateExpand}
          />
        ))}
      </div>
    </div>
  )
}

export default QualityGateDashboard
