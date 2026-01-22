import React from 'react'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
  badge?: string
  badgeVariant?: 'success' | 'info' | 'warning'
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
  badgeVariant = 'success',
}) => {
  return (
    <div
      style={{
        position: 'relative',
        padding: '1.5rem',
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '0.75rem',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 20px rgba(16, 185, 129, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            padding: '0.25rem 0.625rem',
            fontSize: '0.6875rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: '9999px',
            background:
              badgeVariant === 'success'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : badgeVariant === 'info'
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          {badge}
        </div>
      )}

      <div
        style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3rem',
          height: '3rem',
          borderRadius: '0.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: '#f1f5f9',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.9375rem',
          lineHeight: '1.6',
          color: '#cbd5e1',
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  )
}

interface FeatureGridProps {
  children: React.ReactNode
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ children }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        margin: '2rem 0',
      }}
    >
      {children}
    </div>
  )
}
