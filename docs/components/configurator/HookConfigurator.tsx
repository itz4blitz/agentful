import React from 'react'

interface HookConfiguratorProps {
  selectedHooks: string[]
  selectedGates: string[]
  onHooksChange: (hooks: string[]) => void
  onGatesChange: (gates: string[]) => void
}

const hooks = [
  { id: 'health-check', name: 'Health Check', description: 'Verify project dependencies and build status' },
  { id: 'block-random-docs', name: 'Block Random Docs', description: 'Prevent creation of random markdown files (enabled by default)' },
  { id: 'typescript-validation', name: 'TypeScript Validation', description: 'Run tsc --noEmit before sessions' },
  { id: 'notifications', name: 'Notifications', description: 'Desktop notifications for build and test events' },
  { id: 'format-on-save', name: 'Format on Save', description: 'Auto-format code before saving changes' },
]

const gates = [
  { id: 'types', name: 'Type Checking', description: 'TypeScript/Flow type validation' },
  { id: 'tests', name: 'Tests', description: 'All test suites must pass' },
  { id: 'coverage', name: 'Coverage', description: 'Minimum 80% code coverage' },
  { id: 'lint', name: 'Linting', description: 'ESLint/Biome validation' },
  { id: 'security', name: 'Security', description: 'Dependency vulnerability scanning' },
  { id: 'dead-code', name: 'Dead Code', description: 'Detect unused exports and files' },
]

export const HookConfigurator: React.FC<HookConfiguratorProps> = ({
  selectedHooks,
  selectedGates,
  onHooksChange,
  onGatesChange,
}) => {
  const toggleHook = (hookId: string) => {
    if (selectedHooks.includes(hookId)) {
      onHooksChange(selectedHooks.filter(id => id !== hookId))
    } else {
      onHooksChange([...selectedHooks, hookId])
    }
  }

  const toggleGate = (gateId: string) => {
    if (selectedGates.includes(gateId)) {
      onGatesChange(selectedGates.filter(id => id !== gateId))
    } else {
      onGatesChange([...selectedGates, gateId])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hooks */}
      <div>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: 'var(--vocs-color_text)'
        }}>
          Session Hooks
        </h4>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--vocs-color_textAccent)',
          marginBottom: '0.75rem'
        }}>
          Run checks when Claude Code sessions start.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {hooks.map((hook) => {
            const isSelected = selectedHooks.includes(hook.id)

            return (
              <label
                key={hook.id}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: `1px solid ${isSelected ? '#10b981' : 'var(--vocs-color_border)'}`,
                  borderRadius: '0.375rem',
                  background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleHook(hook.id)}
                  style={{
                    marginTop: '0.125rem',
                    cursor: 'pointer',
                    accentColor: '#10b981',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '0.125rem',
                    color: 'var(--vocs-color_text)'
                  }}>
                    {hook.name}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: 'var(--vocs-color_textAccent)',
                  }}>
                    {hook.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Quality Gates */}
      <div>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: 'var(--vocs-color_text)'
        }}>
          Quality Gates
        </h4>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--vocs-color_textAccent)',
          marginBottom: '0.75rem'
        }}>
          Validate implementations before marking features complete.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {gates.map((gate) => {
            const isSelected = selectedGates.includes(gate.id)

            return (
              <label
                key={gate.id}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: `1px solid ${isSelected ? '#10b981' : 'var(--vocs-color_border)'}`,
                  borderRadius: '0.375rem',
                  background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGate(gate.id)}
                  style={{
                    marginTop: '0.125rem',
                    cursor: 'pointer',
                    accentColor: '#10b981',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: 'var(--vocs-color_text)',
                    marginBottom: '0.125rem',
                  }}>
                    {gate.name}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: 'var(--vocs-color_textAccent)',
                  }}>
                    {gate.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
