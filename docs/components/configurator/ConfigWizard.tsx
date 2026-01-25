import React, { useState } from 'react'
import { AgentSelector } from './AgentSelector'
import { FeatureSelector } from './FeatureSelector'
import { HookConfigurator } from './HookConfigurator'
import { CommandGenerator } from './CommandGenerator'
import { fullConfig } from './config'
import './configurator.css'

export interface ConfigState {
  agents: string[]
  skills: string[]
  hooks: string[]
  gates: string[]
}

export const ConfigWizard: React.FC = () => {
  const [config, setConfig] = useState<ConfigState>(fullConfig)
  const [isCustomizing, setIsCustomizing] = useState(false)

  const updateConfig = (updates: Partial<ConfigState>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const resetToFull = () => {
    setConfig(fullConfig)
    setIsCustomizing(false)
  }

  const isFullInstall =
    config.agents.length === fullConfig.agents.length &&
    config.skills.length === fullConfig.skills.length &&
    config.hooks.length === fullConfig.hooks.length &&
    config.gates.length === fullConfig.gates.length

  return (
    <div className="config-wizard" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>

        {/* Tab-style Buttons */}
        <div style={{
          display: 'inline-flex',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '0.25rem',
          gap: '0.25rem',
          marginBottom: '1.5rem',
        }}>
          <button
            onClick={resetToFull}
            style={{
              padding: '0.75rem 2rem',
              background: !isCustomizing ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: !isCustomizing ? '#10b981' : '#94a3b8',
              border: 'none',
              fontSize: '1rem',
              fontWeight: !isCustomizing ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isCustomizing) {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
              } else {
                e.currentTarget.style.color = '#cbd5e1'
              }
            }}
            onMouseLeave={(e) => {
              if (!isCustomizing) {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
              } else {
                e.currentTarget.style.color = '#94a3b8'
              }
            }}
          >
            Install agentful
          </button>

          <button
            onClick={() => setIsCustomizing(true)}
            style={{
              padding: '0.75rem 2rem',
              background: isCustomizing ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: isCustomizing ? '#10b981' : '#94a3b8',
              border: 'none',
              fontSize: '1rem',
              fontWeight: isCustomizing ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (isCustomizing) {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
              } else {
                e.currentTarget.style.color = '#cbd5e1'
              }
            }}
            onMouseLeave={(e) => {
              if (isCustomizing) {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
              } else {
                e.currentTarget.style.color = '#94a3b8'
              }
            }}
          >
            Customize Installation
          </button>
        </div>

        {/* Installation description */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.5rem',
          fontSize: '0.9375rem',
          color: 'var(--vocs-color_textAccent)',
        }}>
          {isFullInstall ? (
            <>
              <span style={{ color: '#10b981', fontWeight: '600' }}>Full Installation:</span>
              <span>8 agents, 7 skills, 5 hooks, 6 quality gates</span>
            </>
          ) : (
            <>
              <span style={{ color: '#10b981', fontWeight: '600' }}>Custom Installation:</span>
              <span>{config.agents.length} agents, {config.skills.length} skills, {config.hooks.length} hooks, {config.gates.length} quality gates</span>
            </>
          )}
        </div>
      </div>

      {/* Component Customization (Hidden by default) */}
      {isCustomizing && (
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          background: 'rgba(16, 185, 129, 0.03)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 60%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Customize Components
            </h3>
            <button
              onClick={resetToFull}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
            >
              Reset to Full
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}>
            {/* Agents Column */}
            <div>
              <AgentSelector
                selected={config.agents}
                onChange={(agents) => updateConfig({ agents })}
              />
            </div>

            {/* Skills Column */}
            <div>
              <FeatureSelector
                selected={config.skills}
                onChange={(skills) => updateConfig({ skills })}
              />
            </div>

            {/* Automation Column */}
            <div>
              <HookConfigurator
                selectedHooks={config.hooks}
                selectedGates={config.gates}
                onHooksChange={(hooks) => updateConfig({ hooks })}
                onGatesChange={(gates) => updateConfig({ gates })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Command Generator (Always visible) */}
      <CommandGenerator config={config} />
    </div>
  )
}
