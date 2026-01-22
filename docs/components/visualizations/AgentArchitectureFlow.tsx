import React, { useCallback, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  NodeProps,
  ConnectionLineType,
  MarkerType,
  ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Agent metadata
const agentDetails = {
  orchestrator: {
    icon: '🎯',
    name: 'Orchestrator',
    description: 'Coordinates all agents and manages workflow',
    skills: ['Task delegation', 'Progress tracking', 'State management'] as string[],
    color: '#10b981',
  },
  'product-analyzer': {
    icon: '📊',
    name: 'Product Analyzer',
    description: 'Analyzes product specs for gaps and ambiguities',
    skills: ['Requirements analysis', 'Gap detection', 'Readiness scoring'] as string[],
    color: '#3b82f6',
  },
  architect: {
    icon: '🏗️',
    name: 'Architect',
    description: 'Designs system architecture and tech stack',
    skills: ['Tech stack detection', 'Agent generation', 'Pattern analysis'] as string[],
    color: '#8b5cf6',
  },
  backend: {
    icon: '⚙️',
    name: 'Backend',
    description: 'Implements backend services and APIs',
    skills: ['API development', 'Database design', 'Authentication'] as string[],
    color: '#06b6d4',
  },
  frontend: {
    icon: '🎨',
    name: 'Frontend',
    description: 'Builds UI components and pages',
    skills: ['Component development', 'State management', 'Styling'] as string[],
    color: '#ec4899',
  },
  tester: {
    icon: '🧪',
    name: 'Tester',
    description: 'Writes comprehensive tests',
    skills: ['Unit tests', 'Integration tests', 'E2E tests'] as string[],
    color: '#f59e0b',
  },
  reviewer: {
    icon: '🔍',
    name: 'Reviewer',
    description: 'Reviews code quality and runs validation',
    skills: ['Quality checks', 'Dead code detection', 'Production readiness'] as string[],
    color: '#14b8a6',
  },
  fixer: {
    icon: '🔧',
    name: 'Fixer',
    description: 'Automatically fixes validation failures',
    skills: ['Auto-remediation', 'Test fixes', 'Type error resolution'] as string[],
    color: '#ef4444',
  },
}

type AgentId = keyof typeof agentDetails

interface AgentNodeData extends Record<string, unknown> {
  id: AgentId
  label: string
  icon: string
  description: string
  skills: string[]
  color: string
  isCenter?: boolean
}

// Custom node component for agents
const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const isCenter = data.isCenter

  const nodeSize = isCenter ? 150 : 120
  const fontSize = isCenter ? '3rem' : '2rem'

  return (
    <div
      style={{
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowTooltip(!showTooltip)}
      role="button"
      tabIndex={0}
      aria-label={`${data.label} agent: ${data.description}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setShowTooltip(!showTooltip)
        }
      }}
    >
      <div
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          borderRadius: isCenter ? '50%' : '0.75rem',
          background: isCenter
            ? `linear-gradient(135deg, ${data.color} 0%, #059669 100%)`
            : 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${data.color}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCenter ? '0.5rem' : '0.375rem',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHovered || showTooltip
            ? `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 50px ${data.color}50`
            : isCenter
            ? `0 0 20px ${data.color}30`
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: isHovered
            ? (isCenter ? 'scale(1.08)' : 'translateY(-6px) scale(1.02)')
            : 'scale(1)',
          animation: isCenter ? 'pulse 3s ease-in-out infinite' : 'none',
        }}
      >
        <div
          style={{
            fontSize,
            lineHeight: 1,
          }}
        >
          {data.icon}
        </div>
        <div
          style={{
            fontSize: isCenter ? '0.875rem' : '0.75rem',
            fontWeight: '600',
            color: isCenter ? '#ffffff' : '#f1f5f9',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Hover hint */}
      {isHovered && !showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.7rem',
            color: '#6b7280',
            whiteSpace: 'nowrap',
            opacity: 1,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          Click for details
        </div>
      )}

      {/* Tooltip/Modal */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '0.75rem',
            width: '280px',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${data.color}`,
            borderRadius: '0.75rem',
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px ${data.color}20`,
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{data.icon}</span>
            <h4
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f1f5f9',
              }}
            >
              {data.label}
            </h4>
          </div>
          <p
            style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.875rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
            }}
          >
            {data.description}
          </p>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: data.color,
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Skills
            </div>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              {data.skills.map((skill, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '0.8125rem',
                    color: '#94a3b8',
                    paddingLeft: '1rem',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      color: data.color,
                    }}
                  >
                    •
                  </span>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
          {/* Close hint */}
          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            Click again to close
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 20px ${data.color}30;
          }
          50% {
            box-shadow: 0 0 40px ${data.color}50;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Node types
const nodeTypes = {
  agentNode: AgentNode,
}

// Calculate positions in hexagonal formation
const getHexagonalPosition = (index: number, radius: number = 300) => {
  const angle = (index * 2 * Math.PI) / 7 - Math.PI / 2 // Start from top
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  }
}

// Component props
interface AgentArchitectureFlowProps {
  interactive?: boolean
  showControls?: boolean
  initialZoom?: number
  height?: string
}

export const AgentArchitectureFlow: React.FC<AgentArchitectureFlowProps> = ({
  interactive = true,
  showControls = true,
  initialZoom = 0.8,
  height = '600px',
}) => {
  // Define nodes
  const initialNodes: Node<AgentNodeData>[] = [
    // Center node - Orchestrator
    {
      id: 'orchestrator',
      type: 'agentNode',
      position: { x: 400, y: 300 },
      data: {
        id: 'orchestrator',
        label: agentDetails.orchestrator.name,
        icon: agentDetails.orchestrator.icon,
        description: agentDetails.orchestrator.description,
        skills: agentDetails.orchestrator.skills,
        color: agentDetails.orchestrator.color,
        isCenter: true,
      },
      draggable: interactive,
    },
    // Specialist agents in hexagonal formation
    ...(
      [
        'product-analyzer',
        'architect',
        'backend',
        'frontend',
        'tester',
        'reviewer',
        'fixer',
      ] as AgentId[]
    ).map((agentId, index) => {
      const pos = getHexagonalPosition(index)
      return {
        id: agentId,
        type: 'agentNode',
        position: { x: 400 + pos.x, y: 300 + pos.y },
        data: {
          id: agentId,
          label: agentDetails[agentId].name,
          icon: agentDetails[agentId].icon,
          description: agentDetails[agentId].description,
          skills: agentDetails[agentId].skills,
          color: agentDetails[agentId].color,
          isCenter: false,
        },
        draggable: false,
      } as Node<AgentNodeData>
    }),
  ]

  // Define edges (bidirectional connections)
  const initialEdges: Edge[] = (
    [
      'product-analyzer',
      'architect',
      'backend',
      'frontend',
      'tester',
      'reviewer',
      'fixer',
    ] as AgentId[]
  ).flatMap((agentId) => [
    {
      id: `orchestrator-${agentId}`,
      source: 'orchestrator',
      target: agentId,
      type: ConnectionLineType.Straight,
      animated: true,
      style: {
        stroke: agentDetails[agentId].color,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: agentDetails[agentId].color,
        width: 20,
        height: 20,
      },
    },
    {
      id: `${agentId}-orchestrator`,
      source: agentId,
      target: 'orchestrator',
      type: ConnectionLineType.Straight,
      animated: true,
      style: {
        stroke: agentDetails[agentId].color,
        strokeWidth: 2,
        opacity: 0.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: agentDetails[agentId].color,
        width: 20,
        height: 20,
      },
    },
  ])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onInit = useCallback(
    (reactFlowInstance: ReactFlowInstance) => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    },
    []
  )

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
      }}
      role="region"
      aria-label="Agent Architecture Flow Diagram"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={interactive ? onNodesChange : undefined}
        onEdgesChange={interactive ? onEdgesChange : undefined}
        onInit={onInit}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={interactive}
        zoomOnScroll={interactive}
        panOnDrag={interactive}
        defaultViewport={{ x: 0, y: 0, zoom: initialZoom }}
        minZoom={0.5}
        maxZoom={1.5}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        {showControls && (
          <Controls
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
            }}
            showInteractive={interactive}
          />
        )}
        <MiniMap
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
          nodeColor={(node) => {
            const data = node.data as AgentNodeData | Record<string, unknown>
            if (data && typeof data === 'object' && 'color' in data && typeof data.color === 'string') {
              return data.color
            }
            return '#10b981'
          }}
          maskColor="rgba(16, 185, 129, 0.1)"
        />
        <Background
          gap={16}
          size={1}
          color="rgba(148, 163, 184, 0.1)"
        />
      </ReactFlow>

      {/* Global styles for React Flow controls */}
      <style>{`
        .react-flow__controls-button {
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
          color: #10b981 !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .react-flow__controls-button:hover {
          background: rgba(16, 185, 129, 0.2) !important;
          border-color: #10b981 !important;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.3) !important;
        }

        .react-flow__controls-button svg {
          fill: #10b981 !important;
        }
      `}</style>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          color: '#cbd5e1',
          zIndex: 5,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '0.375rem', color: '#f1f5f9' }}>
          Agent Architecture
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Click agents to view details • {interactive ? 'Drag to reposition' : 'Static view'}
        </div>
      </div>
    </div>
  )
}

// Non-interactive variant for static documentation
export const AgentArchitectureFlowStatic: React.FC<Omit<AgentArchitectureFlowProps, 'interactive'>> = (
  props
) => {
  return <AgentArchitectureFlow {...props} interactive={false} />
}
