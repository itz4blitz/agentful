import React, { useState } from 'react'
import { ConfigState } from './ConfigWizard'
import { ShareModal } from './ShareModal'

interface CommandGeneratorProps {
  config: ConfigState
}

type ShareState = 'idle' | 'loading' | 'success' | 'error'

const fullConfig = {
  agents: ['orchestrator', 'architect', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'product-analyzer'],
  skills: ['product-tracking', 'validation', 'conversation', 'product-planning', 'testing', 'deployment'],
  hooks: ['health-check', 'typescript-validation', 'notifications', 'format-on-save'],
  gates: ['types', 'tests', 'coverage', 'lint', 'security', 'dead-code'],
}

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
        border: '1px solid var(--vocs-color_border)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1rem',
          background: 'var(--vocs-color_backgroundAccent)',
          borderBottom: '1px solid var(--vocs-color_border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--vocs-color_text)',
            }}>
              {isFullInstall ? 'Installation Command' : 'Custom Installation Command'}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleShare}
                disabled={shareState === 'loading'}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: shareState === 'success' ? '#10b981' : 'var(--vocs-color_background)',
                  border: '1px solid var(--vocs-color_border)',
                  borderRadius: '0.375rem',
                  color: shareState === 'success' ? 'white' : 'var(--vocs-color_text)',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: shareState === 'loading' ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: shareState === 'loading' ? 0.7 : 1,
                }}
              >
                {shareState === 'loading' ? 'Sharing...' : shareState === 'success' ? '✓ Shared!' : 'Share'}
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: copied ? '#10b981' : 'var(--vocs-color_background)',
                  border: '1px solid var(--vocs-color_border)',
                  borderRadius: '0.375rem',
                  color: copied ? 'white' : 'var(--vocs-color_text)',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          {isFullInstall && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--vocs-color_textAccent)',
            }}>
              Complete setup with all agents, skills, and automation
            </div>
          )}
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--vocs-color_codeBackground)',
          fontFamily: 'var(--vocs-font_mono)',
          fontSize: '0.875rem',
          lineHeight: '1.6',
          overflowX: 'auto',
        }}>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--vocs-color_codeText)',
          }}>
            {command}
          </pre>
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--vocs-color_background)',
          borderTop: '1px solid var(--vocs-color_border)',
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'var(--vocs-color_text)',
          }}>
            What gets installed:
          </h4>
          <div style={{
            display: 'grid',
            gap: '0.5rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--vocs-color_text)',
            }}>
              <span style={{ fontSize: '1.125rem' }}>🤖</span>
              <span style={{ fontWeight: '500' }}>Agents:</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}>
                {config.agents.length}
              </span>
              <span style={{ color: 'var(--vocs-color_textAccent)', fontSize: '0.75rem' }}>
                ({config.agents.join(', ')})
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--vocs-color_text)',
            }}>
              <span style={{ fontSize: '1.125rem' }}>📚</span>
              <span style={{ fontWeight: '500' }}>Skills:</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}>
                {config.skills.length}
              </span>
              <span style={{ color: 'var(--vocs-color_textAccent)', fontSize: '0.75rem' }}>
                {config.skills.length > 0 ? `(${config.skills.join(', ')})` : '(none)'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--vocs-color_text)',
            }}>
              <span style={{ fontSize: '1.125rem' }}>🔗</span>
              <span style={{ fontWeight: '500' }}>Hooks:</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}>
                {config.hooks.length}
              </span>
              <span style={{ color: 'var(--vocs-color_textAccent)', fontSize: '0.75rem' }}>
                {config.hooks.length > 0 ? `(${config.hooks.join(', ')})` : '(none)'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--vocs-color_text)',
            }}>
              <span style={{ fontSize: '1.125rem' }}>✅</span>
              <span style={{ fontWeight: '500' }}>Quality Gates:</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}>
                {config.gates.length}
              </span>
              <span style={{ color: 'var(--vocs-color_textAccent)', fontSize: '0.75rem' }}>
                {config.gates.length > 0 ? `(${config.gates.join(', ')})` : '(none)'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderTop: '1px solid rgba(16, 185, 129, 0.3)',
        }}>
          <div style={{
            fontSize: '0.8125rem',
            color: 'var(--vocs-color_textAccent)',
            lineHeight: '1.5',
          }}>
            <strong style={{ color: '#10b981' }}>Next steps:</strong>
            <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
              <li>Run the command in your project directory</li>
              <li>Edit <code style={{
                padding: '0.125rem 0.375rem',
                background: 'var(--vocs-color_codeBackground)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--vocs-font_mono)',
              }}>.claude/product/index.md</code> to define your product</li>
              <li>Start Claude Code: <code style={{
                padding: '0.125rem 0.375rem',
                background: 'var(--vocs-color_codeBackground)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--vocs-font_mono)',
              }}>claude</code></li>
              <li>Type: <code style={{
                padding: '0.125rem 0.375rem',
                background: 'var(--vocs-color_codeBackground)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--vocs-font_mono)',
              }}>/agentful-start</code></li>
            </ol>
          </div>
        </div>
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
