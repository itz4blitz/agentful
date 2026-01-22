import React from 'react'

interface FeatureSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

const skills = [
  {
    id: 'product-tracking',
    name: 'Product Tracking',
    description: 'Track feature completion, blocking decisions, and progress.',
    icon: '📊',
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Quality gates for type checking, tests, coverage, security.',
    icon: '✅',
  },
  {
    id: 'conversation',
    name: 'Conversation',
    description: 'Natural language interface for ad-hoc questions and tasks.',
    icon: '💬',
  },
  {
    id: 'product-planning',
    name: 'Product Planning',
    description: 'Guided product specification creation and analysis.',
    icon: '📝',
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Test generation patterns and execution strategies.',
    icon: '🧪',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    description: 'Deployment workflows and CI/CD configuration.',
    icon: '🚀',
  },
]

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({ selected, onChange }) => {
  const toggleSkill = (skillId: string) => {
    if (selected.includes(skillId)) {
      onChange(selected.filter(id => id !== skillId))
    } else {
      onChange([...selected, skillId])
    }
  }

  return (
    <div>
      <h4 style={{
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: 'var(--vocs-color_text)'
      }}>
        Skills
      </h4>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--vocs-color_textAccent)',
        marginBottom: '1rem'
      }}>
        Select the skills (portable expertise modules) to include.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {skills.map((skill) => {
          const isSelected = selected.includes(skill.id)

          return (
            <button
              key={skill.id}
              onClick={() => toggleSkill(skill.id)}
              style={{
                padding: '0.875rem',
                border: `2px solid ${isSelected ? '#10b981' : 'var(--vocs-color_border)'}`,
                borderRadius: '0.5rem',
                background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <div style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.375rem',
                  background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--vocs-color_backgroundAccent)',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {skill.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: isSelected ? '#10b981' : 'var(--vocs-color_text)',
                    marginBottom: '0.25rem'
                  }}>
                    {skill.name}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: 'var(--vocs-color_textAccent)',
                    lineHeight: '1.4'
                  }}>
                    {skill.description}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
