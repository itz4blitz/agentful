import React from 'react'
import { skills } from './config'

interface FeatureSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

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
        Skills <span style={{ color: 'var(--vocs-color_textAccent)', fontWeight: '400' }}>({selected.length}/{skills.length})</span>
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
                border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                  fontSize: '1.25rem',
                  flexShrink: 0,
                }}>
                  {skill.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: isSelected ? '#10b981' : '#cbd5e1',
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
