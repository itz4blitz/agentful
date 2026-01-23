import React from 'react'

interface ProjectTypeSelectorProps {
  value: 'new' | 'existing' | 'monorepo'
  onChange: (value: 'new' | 'existing' | 'monorepo') => void
}

const projectTypes = [
  {
    value: 'new' as const,
    label: 'New Project',
    description: 'Starting from scratch with no existing code',
    icon: '✨'
  },
  {
    value: 'existing' as const,
    label: 'Existing Project',
    description: 'Add agentful to an existing codebase',
    icon: '📦'
  },
  {
    value: 'monorepo' as const,
    label: 'Monorepo',
    description: 'Multi-package repository with shared configuration',
    icon: '🏢'
  }
]

export const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {projectTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          style={{
            padding: '1rem',
            border: `2px solid ${value === type.value ? '#10b981' : 'var(--vocs-color_border)'}`,
            borderRadius: '0.5rem',
            background: value === type.value ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
            <div>
              <div style={{
                fontWeight: '600',
                marginBottom: '0.25rem',
                color: value === type.value ? '#10b981' : 'var(--vocs-color_text)'
              }}>
                {type.label}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--vocs-color_textAccent)'
              }}>
                {type.description}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
