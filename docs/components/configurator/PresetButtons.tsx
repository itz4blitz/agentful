import React from 'react'

interface PresetButtonsProps {
  onSelectPreset: (preset: 'minimal' | 'fullstack' | 'enterprise') => void
}

const presets = [
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Basic setup with core agents only',
    icon: '⚡',
    agents: 3,
    features: 'Essential agents, health checks',
  },
  {
    id: 'fullstack' as const,
    name: 'Fullstack',
    description: 'Complete setup for web applications',
    icon: '🚀',
    agents: 5,
    features: 'All core agents, tracking, validation',
    recommended: true,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    description: 'Full suite with all quality gates',
    icon: '🏢',
    agents: 7,
    features: 'All agents, full validation, security',
  },
]

export const PresetButtons: React.FC<PresetButtonsProps> = ({ onSelectPreset }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelectPreset(preset.id)}
          style={{
            padding: '1.25rem',
            border: `2px solid ${preset.recommended ? '#10b981' : 'var(--vocs-color_border)'}`,
            borderRadius: '0.5rem',
            background: preset.recommended ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10b981'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = preset.recommended ? '#10b981' : 'var(--vocs-color_border)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {preset.recommended && (
            <div style={{
              position: 'absolute',
              top: '-0.5rem',
              right: '1rem',
              padding: '0.25rem 0.75rem',
              background: '#10b981',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '0.25rem',
            }}>
              Recommended
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>{preset.icon}</span>
            <div>
              <div style={{
                fontWeight: '600',
                fontSize: '1.125rem',
                marginBottom: '0.25rem',
                color: preset.recommended ? '#10b981' : 'var(--vocs-color_text)',
              }}>
                {preset.name}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--vocs-color_textAccent)',
                lineHeight: '1.4',
              }}>
                {preset.description}
              </div>
            </div>
          </div>

          <div style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--vocs-color_border)',
          }}>
            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--vocs-color_textAccent)',
              marginBottom: '0.25rem',
            }}>
              <strong>{preset.agents}</strong> agents
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--vocs-color_textAccent)',
            }}>
              {preset.features}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
