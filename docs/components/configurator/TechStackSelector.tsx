import React from 'react'
import { ConfigState } from './ConfigWizard'

interface TechStackSelectorProps {
  config: ConfigState
  onChange: (updates: Partial<ConfigState>) => void
}

const techOptions = {
  language: [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
  ],
  frontend: [
    { value: 'nextjs', label: 'Next.js' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'angular', label: 'Angular' },
  ],
  backend: [
    { value: 'nextjs-api', label: 'Next.js API Routes' },
    { value: 'express', label: 'Express' },
    { value: 'fastify', label: 'Fastify' },
    { value: 'nestjs', label: 'NestJS' },
    { value: 'hono', label: 'Hono' },
  ],
  database: [
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'mongodb', label: 'MongoDB' },
  ],
  orm: [
    { value: 'prisma', label: 'Prisma' },
    { value: 'drizzle', label: 'Drizzle' },
    { value: 'typeorm', label: 'TypeORM' },
    { value: 'mongoose', label: 'Mongoose' },
  ],
  testing: [
    { value: 'vitest', label: 'Vitest' },
    { value: 'jest', label: 'Jest' },
    { value: 'playwright', label: 'Playwright' },
    { value: 'cypress', label: 'Cypress' },
  ],
}

export const TechStackSelector: React.FC<TechStackSelectorProps> = ({ config, onChange }) => {
  const handleChange = (key: keyof ConfigState, value: string) => {
    onChange({ [key]: value })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {Object.entries(techOptions).map(([key, options]) => (
        <div key={key}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            textTransform: 'capitalize',
            color: 'var(--vocs-color_text)'
          }}>
            {key === 'orm' ? 'ORM' : key}
          </label>
          <select
            value={config[key as keyof ConfigState] as string}
            onChange={(e) => handleChange(key as keyof ConfigState, e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem',
              border: '1px solid var(--vocs-color_border)',
              borderRadius: '0.375rem',
              background: 'var(--vocs-color_background)',
              color: 'var(--vocs-color_text)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div style={{
        marginTop: '0.5rem',
        padding: '0.75rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        color: 'var(--vocs-color_textAccent)'
      }}>
        <strong style={{ color: '#10b981' }}>Preset detected:</strong>{' '}
        {config.language === 'typescript' && config.frontend === 'nextjs' && config.database === 'postgresql'
          ? 'fullstack-typescript'
          : config.language === 'javascript' && config.frontend === 'react'
          ? 'fullstack-javascript'
          : 'custom'}
      </div>
    </div>
  )
}
