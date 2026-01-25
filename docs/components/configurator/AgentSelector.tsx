import React from 'react'
import { agents } from './config'

interface AgentSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ selected, onChange }) => {
  const toggleAgent = (agentId: string) => {
    // Don't allow deselecting orchestrator
    if (agentId === 'orchestrator') return

    if (selected.includes(agentId)) {
      onChange(selected.filter(id => id !== agentId))
    } else {
      onChange([...selected, agentId])
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
        Agents <span style={{ color: 'var(--vocs-color_textAccent)', fontWeight: '400' }}>({selected.length}/{agents.length})</span>
      </h4>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--vocs-color_textAccent)',
        marginBottom: '1rem'
      }}>
        Select the agents you want to use. Orchestrator is always required.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {agents.map((agent) => {
          const isSelected = selected.includes(agent.id)
          const isDisabled = agent.required

          return (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              disabled={isDisabled}
              style={{
                padding: '1rem',
                border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                textAlign: 'left',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.7 : 1,
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
                  {agent.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: isSelected ? '#10b981' : '#cbd5e1'
                    }}>
                      {agent.name}
                    </span>
                    {agent.required && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontWeight: '500'
                      }}>
                        Required
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--vocs-color_textAccent)',
                    lineHeight: '1.4'
                  }}>
                    {agent.description}
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
