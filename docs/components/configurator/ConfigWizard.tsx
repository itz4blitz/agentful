import React, { useState } from 'react'
import { AgentSelector } from './AgentSelector'
import { FeatureSelector } from './FeatureSelector'
import { HookConfigurator } from './HookConfigurator'
import { CommandGenerator } from './CommandGenerator'
import './configurator.css'

export interface ConfigState {
  agents: string[]
  skills: string[]
  hooks: string[]
  gates: string[]
}

// Default: EVERYTHING enabled (full agentful installation)
const fullConfig: ConfigState = {
  agents: ['orchestrator', 'architect', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'product-analyzer'],
  skills: ['product-tracking', 'validation', 'conversation', 'product-planning', 'testing', 'deployment'],
  hooks: ['health-check', 'block-random-docs', 'typescript-validation', 'notifications', 'format-on-save'],
  gates: ['types', 'tests', 'coverage', 'lint', 'security', 'dead-code'],
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
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={resetToFull}
            style={{
              padding: '1rem 2rem',
              background: !isCustomizing ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: !isCustomizing ? '#000000' : '#cbd5e1',
              border: !isCustomizing ? 'none' : '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: !isCustomizing ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: !isCustomizing ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              opacity: !isCustomizing ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (!isCustomizing) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              } else {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isCustomizing) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              } else {
                e.currentTarget.style.opacity = '0.6'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            ✨ Install agentful
          </button>

          <button
            onClick={() => setIsCustomizing(true)}
            style={{
              padding: '1rem 2rem',
              background: isCustomizing ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: isCustomizing ? '#000000' : '#cbd5e1',
              border: isCustomizing ? 'none' : '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: isCustomizing ? '700' : '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isCustomizing ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              opacity: isCustomizing ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (isCustomizing) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              } else {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'
              }
            }}
            onMouseLeave={(e) => {
              if (isCustomizing) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              } else {
                e.currentTarget.style.opacity = '0.6'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            ⚙️ Customize Installation
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
              <span>8 agents, 6 skills, all automation</span>
            </>
          ) : (
            <>
              <span style={{ color: '#10b981', fontWeight: '600' }}>Custom Installation:</span>
              <span>{config.agents.length} agents, {config.skills.length} skills, {config.hooks.length + config.gates.length} automation rules</span>
            </>
          )}
        </div>
      </div>

      {/* Component Customization (Hidden by default) */}
      {isCustomizing && (
        <div style={{
          marginBottom: '2rem',
          padding: '2rem',
          border: '2px solid var(--vocs-color_border)',
          borderRadius: '1rem',
          background: 'var(--vocs-color_background)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--vocs-color_text)',
            }}>
              Customize Components
            </h3>
            <button
              onClick={resetToFull}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--vocs-color_border)',
                borderRadius: '0.375rem',
                color: 'var(--vocs-color_textAccent)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981'
                e.currentTarget.style.color = '#10b981'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--vocs-color_border)'
                e.currentTarget.style.color = 'var(--vocs-color_textAccent)'
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
      <div style={{
        position: 'sticky',
        top: '1rem',
      }}>
        <CommandGenerator config={config} />
      </div>
    </div>
  )
}
