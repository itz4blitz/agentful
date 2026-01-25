import React, { useState, useEffect } from 'react'

interface DiagramModalProps {
  children: React.ReactNode
  title?: string
}

export const DiagramModal: React.FC<DiagramModalProps> = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  return (
    <>
      {/* Clickable diagram preview */}
      <div
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          cursor: 'pointer',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          padding: '1.5rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 20px rgba(16, 185, 129, 0.15)'
            : '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {children}

        {/* Expand icon overlay */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(16, 185, 129, 0.9)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: isHovered ? 1 : 0.7,
            transition: 'opacity 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>
            Click to expand
          </span>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'rgba(30, 41, 59, 0.95)',
              borderRadius: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: '95vw',
              maxHeight: '95vh',
              width: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              animation: 'scaleIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                flexShrink: 0,
                background: 'rgba(30, 41, 59, 0.98)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backdropFilter: 'blur(10px)',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  margin: 0,
                }}
              >
                {title || 'Diagram'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Close (ESC)
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                minHeight: 0,
              }}
            >
              <div style={{
                maxWidth: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {children}
              </div>
            </div>
          </div>

          {/* Animations */}
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
