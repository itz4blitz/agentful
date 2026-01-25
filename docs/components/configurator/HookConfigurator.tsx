import React from 'react'
import { hooks, gates } from './config'

interface HookConfiguratorProps {
  selectedHooks: string[]
  selectedGates: string[]
  onHooksChange: (hooks: string[]) => void
  onGatesChange: (gates: string[]) => void
}

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
          Session Hooks <span style={{ color: 'var(--vocs-color_textAccent)', fontWeight: '400' }}>({selectedHooks.length}/{hooks.length})</span>
        </h4>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--vocs-color_textAccent)',
          marginBottom: '0.75rem'
        }}>
          Run checks when Claude Code sessions start.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hooks.map((hook) => {
            const isSelected = selectedHooks.includes(hook.id)

            return (
              <button
                key={hook.id}
                onClick={() => toggleHook(hook.id)}
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
                    {hook.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: isSelected ? '#10b981' : '#cbd5e1',
                      marginBottom: '0.25rem'
                    }}>
                      {hook.name}
                    </div>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--vocs-color_textAccent)',
                      lineHeight: '1.4'
                    }}>
                      {hook.description}
                    </div>
                  </div>
                </div>
              </button>
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
          Quality Gates <span style={{ color: 'var(--vocs-color_textAccent)', fontWeight: '400' }}>({selectedGates.length}/{gates.length})</span>
        </h4>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--vocs-color_textAccent)',
          marginBottom: '0.75rem'
        }}>
          Validate implementations before marking features complete.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {gates.map((gate) => {
            const isSelected = selectedGates.includes(gate.id)

            return (
              <button
                key={gate.id}
                onClick={() => toggleGate(gate.id)}
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
                    {gate.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: isSelected ? '#10b981' : '#cbd5e1',
                      marginBottom: '0.25rem',
                    }}>
                      {gate.name}
                    </div>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--vocs-color_textAccent)',
                      lineHeight: '1.4'
                    }}>
                      {gate.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
