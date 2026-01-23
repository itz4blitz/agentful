import React, { useState, useEffect } from 'react'
import { ConfigState } from './ConfigWizard'
import { CommandGenerator } from './CommandGenerator'

export const ConfigViewer: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<ConfigState | null>(null)
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Extract ID from URL
        const pathParts = window.location.pathname.split('/')
        const id = pathParts[pathParts.length - 1]

        if (!id || !/^[a-f0-9]{8}$/i.test(id)) {
          setError('Invalid configuration ID')
          setLoading(false)
          return
        }

        // Fetch configuration
        const response = await fetch(`/api/get-config/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Configuration not found. It may have been deleted or expired.')
          } else if (response.status === 410) {
            setError('This configuration has expired (1 year TTL).')
          } else {
            setError(`Failed to load configuration: HTTP ${response.status}`)
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setConfig(data.config)
        setMetadata(data.metadata)
        setLoading(false)
      } catch (err) {
        console.error('Error loading config:', err)
        setError('Failed to load configuration. Please try again.')
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--vocs-color_border)',
              borderTop: '4px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--vocs-color_textAccent)' }}>Loading configuration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          marginTop: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '0.5rem',
          }}
        >
          Error
        </h2>
        <p style={{ color: 'var(--vocs-color_textAccent)', marginBottom: '1rem' }}>{error}</p>
        <a
          href="/configure"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Create Your Own Configuration
        </a>
      </div>
    )
  }

  if (!config) {
    return null
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Info Banner */}
      <div
        style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}
      >
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '0.5rem',
          }}
        >
          Shared agentful Configuration
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--vocs-color_textAccent)',
            marginBottom: '0.5rem',
          }}
        >
          This is a shared configuration created by the agentful community. Use the command below
          to install it in your project.
        </p>
        {metadata && (
          <div style={{ fontSize: '0.75rem', color: 'var(--vocs-color_textAccent)' }}>
            Created: {new Date(metadata.created_at).toLocaleDateString()} | Views:{' '}
            {metadata.views || 0}
          </div>
        )}
      </div>

      {/* Configuration Summary */}
      <div
        style={{
          padding: '1.5rem',
          border: '1px solid var(--vocs-color_border)',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--vocs-color_text)',
            marginBottom: '1rem',
          }}
        >
          Configuration Details
        </h3>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Agents ({config.agents.length})
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--vocs-color_textAccent)' }}>
              {config.agents.join(', ')}
            </p>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Skills ({config.skills.length})
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--vocs-color_textAccent)' }}>
              {config.skills.length > 0 ? config.skills.join(', ') : 'None'}
            </p>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Hooks ({config.hooks.length})
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--vocs-color_textAccent)' }}>
              {config.hooks.length > 0 ? config.hooks.join(', ') : 'None'}
            </p>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Quality Gates ({config.gates.length})
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--vocs-color_textAccent)' }}>
              {config.gates.length > 0 ? config.gates.join(', ') : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Installation Command */}
      <CommandGenerator config={config} />

      {/* Additional Info */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--vocs-color_backgroundAccent)',
          border: '1px solid var(--vocs-color_border)',
          borderRadius: '0.5rem',
        }}
      >
        <h4
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--vocs-color_text)',
            marginBottom: '0.5rem',
          }}
        >
          Want to customize this configuration?
        </h4>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--vocs-color_textAccent)',
            marginBottom: '0.75rem',
          }}
        >
          Visit the interactive configurator to create your own custom configuration.
        </p>
        <a
          href="/configure"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'var(--vocs-color_background)',
            border: '1px solid var(--vocs-color_border)',
            borderRadius: '0.375rem',
            color: 'var(--vocs-color_text)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Open Configurator
        </a>
      </div>
    </div>
  )
}
