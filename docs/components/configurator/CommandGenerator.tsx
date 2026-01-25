import React, { useState } from 'react'
import { ConfigState } from './ConfigWizard'
import { ShareModal } from './ShareModal'
import { fullConfig } from './config'

interface CommandGeneratorProps {
  config: ConfigState
}

type ShareState = 'idle' | 'loading' | 'success' | 'error'

export const CommandGenerator: React.FC<CommandGeneratorProps> = ({ config }) => {
  const [copied, setCopied] = useState(false)
  const [shareState, setShareState] = useState<ShareState>('idle')
  const [shareUrl, setShareUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Check if this is a full installation (all components selected)
  const isFullInstall =
    config.agents.length === fullConfig.agents.length &&
    config.skills.length === fullConfig.skills.length &&
    config.hooks.length === fullConfig.hooks.length &&
    config.gates.length === fullConfig.gates.length &&
    config.agents.every(a => fullConfig.agents.includes(a)) &&
    config.skills.every(s => fullConfig.skills.includes(s)) &&
    config.hooks.every(h => fullConfig.hooks.includes(h)) &&
    config.gates.every(g => fullConfig.gates.includes(g))

  // Generate command based on configuration
  const generateCommand = (): string => {
    // If full install, just use the simple command
    if (isFullInstall) {
      return 'npx @itz4blitz/agentful init'
    }

    // Otherwise, build custom command with flags
    const parts = ['npx @itz4blitz/agentful init']

    if (config.agents.length > 0) {
      parts.push(`  --agents=${config.agents.join(',')}`)
    }

    if (config.skills.length > 0) {
      parts.push(`  --skills=${config.skills.join(',')}`)
    }

    if (config.hooks.length > 0) {
      parts.push(`  --hooks=${config.hooks.join(',')}`)
    }

    if (config.gates.length > 0) {
      parts.push(`  --gates=${config.gates.join(',')}`)
    }

    return parts.join(' \\\n')
  }

  const command = generateCommand()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    setShareState('loading')
    setErrorMessage('')

    try {
      const apiUrl = '/api/save-config'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setShareUrl(data.url)
      setShareState('success')
      setShowModal(true)
    } catch (err) {
      console.error('Failed to share config:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to share configuration')
      setShareState('error')
      setRetryCount(prev => prev + 1)
    }
  }

  return (
    <>
      <div style={{
        background: 'rgba(16, 185, 129, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.08)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 60%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {isFullInstall ? 'Installation Command' : 'Custom Installation Command'}
            </h3>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.375rem 0.75rem',
                background: copied ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: copied ? '#ffffff' : '#cbd5e1',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <pre className="command-output" style={{
          margin: 0,
          padding: '1rem 1rem 1rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.05) !important',
          backdropFilter: 'blur(8px)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '0.9375rem',
          lineHeight: 1.7,
          overflowX: 'auto',
          whiteSpace: 'pre',
          color: '#10b981',
          fontWeight: '500',
          border: 'none !important',
          borderRadius: '0 !important',
          boxShadow: 'none !important',
        }}>
          {command}
        </pre>
      </div>

      {shareState === 'error' && errorMessage && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          color: '#ef4444',
          fontSize: '0.875rem',
        }}>
          <strong>Error sharing configuration:</strong> {errorMessage}
          {retryCount < 3 && (
            <button
              onClick={handleShare}
              style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '0.25rem',
                color: '#ef4444',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      <ShareModal
        isOpen={showModal}
        shareUrl={shareUrl}
        installCommand={`npx @itz4blitz/agentful init --config=${shareUrl.split('/').pop() || ''}`}
        onClose={() => {
          setShowModal(false)
          setShareState('idle')
        }}
      />
    </>
  )
}
