import React from 'react'

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'info' | 'warning'
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
        }
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
        }
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          border: 'none',
        }
      case 'destructive':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
        }
      case 'outline':
        return {
          background: 'transparent',
          color: '#10b981',
          border: '1px solid #10b981',
        }
      case 'secondary':
        return {
          background: 'rgba(30, 41, 59, 0.8)',
          color: '#cbd5e1',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }
      default:
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
        }
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        ...getVariantStyles(),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}
    >
      {children}
    </span>
  )
}
