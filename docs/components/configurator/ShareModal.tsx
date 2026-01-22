import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  installCommand: string
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  installCommand,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState(false)

  // Reset copied states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopiedUrl(false)
      setCopiedCommand(false)
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopiedCommand(true)
      setTimeout(() => setCopiedCommand(false), 2000)
    } catch (err) {
      console.error('Failed to copy command:', err)
    }
  }

  const handleShare = (platform: 'twitter' | 'linkedin') => {
    const text = 'Check out my agentful configuration!'
    const url = shareUrl

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }

    window.open(shareUrls[platform], '_blank', 'width=600,height=400')
  }

  if (!isOpen) return null

  return (
    <div
      className="share-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="share-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--vocs-color_background)',
          border: '1px solid var(--vocs-color_border)',
          borderRadius: '0.75rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--vocs-color_border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                margin: 0,
              }}
            >
              Configuration Saved!
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--vocs-color_textAccent)',
                margin: '0.25rem 0 0',
              }}
            >
              Share this URL with your team
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--vocs-color_textAccent)',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--vocs-color_text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--vocs-color_textAccent)')}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Shareable URL */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Shareable URL
            </label>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'stretch',
              }}
            >
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.75rem',
                  border: '1px solid var(--vocs-color_border)',
                  borderRadius: '0.375rem',
                  background: 'var(--vocs-color_backgroundAccent)',
                  color: 'var(--vocs-color_text)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--vocs-font_mono)',
                }}
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopyUrl}
                style={{
                  padding: '0.625rem 1rem',
                  background: copiedUrl ? '#10b981' : 'var(--vocs-color_background)',
                  border: '1px solid var(--vocs-color_border)',
                  borderRadius: '0.375rem',
                  color: copiedUrl ? 'white' : 'var(--vocs-color_text)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copiedUrl ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'center',
              padding: '1rem',
              background: 'var(--vocs-color_backgroundAccent)',
              borderRadius: '0.5rem',
              border: '1px solid var(--vocs-color_border)',
            }}
          >
            <div
              style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '0.5rem',
              }}
            >
              <QRCodeSVG value={shareUrl} size={200} level="M" />
            </div>
          </div>

          {/* Install Command */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Install Command
            </label>
            <div
              style={{
                border: '1px solid var(--vocs-color_border)',
                borderRadius: '0.375rem',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--vocs-color_codeBackground)',
                  fontFamily: 'var(--vocs-font_mono)',
                  fontSize: '0.8125rem',
                  overflowX: 'auto',
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'var(--vocs-color_codeText)',
                  }}
                >
                  {installCommand}
                </pre>
              </div>
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--vocs-color_backgroundAccent)',
                  borderTop: '1px solid var(--vocs-color_border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleCopyCommand}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: copiedCommand ? '#10b981' : 'var(--vocs-color_background)',
                    border: '1px solid var(--vocs-color_border)',
                    borderRadius: '0.375rem',
                    color: copiedCommand ? 'white' : 'var(--vocs-color_text)',
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedCommand ? '✓ Copied!' : 'Copy Command'}
                </button>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--vocs-color_text)',
                marginBottom: '0.5rem',
              }}
            >
              Share on Social Media
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleShare('twitter')}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  background: '#1DA1F2',
                  border: 'none',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Share on Twitter
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  background: '#0A66C2',
                  border: 'none',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Share on LinkedIn
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--vocs-color_border)',
            background: 'var(--vocs-color_backgroundAccent)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.625rem 1.5rem',
              background: 'var(--vocs-color_background)',
              border: '1px solid var(--vocs-color_border)',
              borderRadius: '0.375rem',
              color: 'var(--vocs-color_text)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
