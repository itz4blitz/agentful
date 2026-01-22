import React from 'react'

interface AgentSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

const agents = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    description: 'Coordinates work, never writes code directly. Required.',
    required: true,
    icon: '🎯',
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Analyzes tech stack, generates domain-specific agents.',
    required: false,
    icon: '🏗️',
  },
  {
    id: 'backend',
    name: 'Backend',
    description: 'Server-side logic, APIs, databases, authentication.',
    required: false,
    icon: '⚙️',
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'UI components, state management, client-side code.',
    required: false,
    icon: '🎨',
  },
  {
    id: 'tester',
    name: 'Tester',
    description: 'Test generation, test execution, coverage reports.',
    required: false,
    icon: '🧪',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Quality validation, type checking, linting, security.',
    required: false,
    icon: '✅',
  },
  {
    id: 'fixer',
    name: 'Fixer',
    description: 'Automated remediation of validation failures.',
    required: false,
    icon: '🔧',
  },
  {
    id: 'product-analyzer',
    name: 'Product Analyzer',
    description: 'Analyzes product specs, reverse-engineers features.',
    required: false,
    icon: '📊',
  },
]

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
                border: `2px solid ${isSelected ? '#10b981' : 'var(--vocs-color_border)'}`,
                borderRadius: '0.5rem',
                background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
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
                  borderRadius: '0.375rem',
                  background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--vocs-color_backgroundAccent)',
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
                      color: isSelected ? '#10b981' : 'var(--vocs-color_text)'
                    }}>
                      {agent.name}
                    </span>
                    {agent.required && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        borderRadius: '0.25rem',
                        fontWeight: '600'
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

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(16, 185, 129, 0.15)',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        color: 'var(--vocs-color_text)'
      }}>
        Selected: <strong style={{ color: '#10b981' }}>{selected.length}</strong> agent{selected.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
