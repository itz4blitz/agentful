import React, { useCallback, useState, useEffect, useMemo } from 'react'
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
  Position,
  ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Type definitions
export type StageId = 'spec' | 'implement' | 'test' | 'quality' | 'review' | 'deploy'
export type StageStatus = 'complete' | 'in-progress' | 'pending' | 'failed'

interface SubStep {
  id: string
  name: string
  completion: number
  status: StageStatus
}

interface StageData {
  id: StageId
  name: string
  icon: string
  color: string
  agent: string
  subSteps: SubStep[]
  status: StageStatus
  timeSpent: string
  completion: number
}

interface StageNodeData extends Record<string, unknown> {
  stage: StageData
  isActive?: boolean
  onClick?: (stage: StageData) => void
}

interface DecisionNodeData extends Record<string, unknown> {
  label: string
  question: string
  color: string
}

export interface DevelopmentWorkflowPipelineProps {
  currentStage?: StageId
  completedStages?: StageId[]
  failedStages?: StageId[]
  interactive?: boolean
  showControls?: boolean
  animatedFlow?: boolean
  orientation?: 'horizontal' | 'vertical'
  height?: string
}

// Stage metadata
const stagesData: Record<StageId, Omit<StageData, 'status' | 'completion' | 'timeSpent' | 'subSteps'>> = {
  spec: {
    id: 'spec',
    name: 'Product Specification',
    icon: '📋',
    color: '#3b82f6',
    agent: 'Product Analyzer',
  },
  implement: {
    id: 'implement',
    name: 'Implementation',
    icon: '⚙️',
    color: '#8b5cf6',
    agent: 'Architect, Backend, Frontend',
  },
  test: {
    id: 'test',
    name: 'Testing',
    icon: '🧪',
    color: '#f59e0b',
    agent: 'Tester',
  },
  quality: {
    id: 'quality',
    name: 'Quality Gates',
    icon: '🔍',
    color: '#14b8a6',
    agent: 'Reviewer',
  },
  review: {
    id: 'review',
    name: 'Final Review',
    icon: '✅',
    color: '#10b981',
    agent: 'Reviewer',
  },
  deploy: {
    id: 'deploy',
    name: 'Deploy',
    icon: '🚀',
    color: '#059669',
    agent: 'Orchestrator',
  },
}

// Sample sub-steps data
const sampleSubSteps: Record<StageId, SubStep[]> = {
  spec: [
    { id: 'write', name: 'Write product spec', completion: 100, status: 'complete' },
    { id: 'analyze', name: 'Analyze for gaps', completion: 100, status: 'complete' },
    { id: 'score', name: 'Calculate readiness score', completion: 100, status: 'complete' },
  ],
  implement: [
    { id: 'arch', name: 'Architect designs system', completion: 100, status: 'complete' },
    { id: 'backend', name: 'Backend builds APIs', completion: 80, status: 'in-progress' },
    { id: 'frontend', name: 'Frontend builds UI', completion: 60, status: 'in-progress' },
  ],
  test: [
    { id: 'unit', name: 'Write unit tests', completion: 40, status: 'in-progress' },
    { id: 'integration', name: 'Write integration tests', completion: 0, status: 'pending' },
    { id: 'e2e', name: 'Write E2E tests', completion: 0, status: 'pending' },
  ],
  quality: [
    { id: 'types', name: 'Type checking', completion: 0, status: 'pending' },
    { id: 'lint', name: 'Linting', completion: 0, status: 'pending' },
    { id: 'coverage', name: 'Coverage check', completion: 0, status: 'pending' },
    { id: 'security', name: 'Security scan', completion: 0, status: 'pending' },
    { id: 'deadcode', name: 'Dead code detection', completion: 0, status: 'pending' },
  ],
  review: [
    { id: 'codereview', name: 'Code review', completion: 0, status: 'pending' },
    { id: 'manual', name: 'Manual testing', completion: 0, status: 'pending' },
    { id: 'docs', name: 'Documentation check', completion: 0, status: 'pending' },
  ],
  deploy: [
    { id: 'build', name: 'Build production', completion: 0, status: 'pending' },
    { id: 'staging', name: 'Deploy to staging', completion: 0, status: 'pending' },
    { id: 'prod', name: 'Deploy to production', completion: 0, status: 'pending' },
  ],
}

// Status badge component
const StatusBadge: React.FC<{ status: StageStatus }> = ({ status }) => {
  const config = {
    complete: { icon: '✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
    'in-progress': { icon: '⟳', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
    pending: { icon: '○', color: '#64748b', bg: 'rgba(100, 116, 139, 0.2)' },
    failed: { icon: '✕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  }

  const { icon, color, bg } = config[status]

  return (
    <div
      style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: bg,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: '700',
        color,
        animation: status === 'complete' ? 'checkmark 0.3s ease-out' : 'none',
      }}
      aria-label={`Status: ${status}`}
    >
      {icon}
    </div>
  )
}

// Custom Stage Node Component
const StageNode: React.FC<NodeProps<StageNodeData>> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false)
  const stage = data.stage
  const isActive = data.isActive || false

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => data.onClick?.(stage)}
      role="button"
      tabIndex={0}
      aria-label={`${stage.name} stage: ${stage.status}, ${stage.completion}% complete`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          data.onClick?.(stage)
        }
      }}
    >
      <div
        style={{
          width: '180px',
          height: '140px',
          borderRadius: '0.75rem',
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${stage.color}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:
            isHovered || isActive
              ? `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 40px ${stage.color}40`
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          animation: isActive ? `stagePulse-${stage.id} 2s ease-in-out infinite` : 'none',
          position: 'relative',
        }}
      >
        <StatusBadge status={stage.status} />

        {/* Icon */}
        <div
          style={{
            fontSize: '3rem',
            lineHeight: 1,
            marginBottom: '0.25rem',
          }}
        >
          {stage.icon}
        </div>

        {/* Stage name */}
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#f1f5f9',
            textAlign: 'center',
            letterSpacing: '-0.01em',
            marginBottom: '0.5rem',
          }}
        >
          {stage.name}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(100, 116, 139, 0.3)',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${stage.completion}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`,
              borderRadius: '3px',
              transition: 'width 0.3s ease-out',
              boxShadow: `0 0 8px ${stage.color}80`,
            }}
          />
        </div>

        {/* Completion percentage */}
        <div
          style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginTop: '0.25rem',
          }}
        >
          {stage.completion}%
        </div>
      </div>

      {/* Inline styles for animation */}
      <style>{`
        @keyframes stagePulse-${stage.id} {
          0%, 100% {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 20px ${stage.color}40;
          }
          50% {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 40px ${stage.color}60;
          }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(-45deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Custom Decision Node Component
const DecisionNode: React.FC<NodeProps<DecisionNodeData>> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label={data.question as string}
    >
      {/* Diamond shape */}
      <div
        style={{
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${data.color}, ${data.color}dd)`,
          backdropFilter: 'blur(10px)',
          border: `2px solid ${data.color}`,
          transform: 'rotate(45deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHovered
            ? `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 40px ${data.color}40`
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            transform: 'rotate(-45deg)',
            fontSize: '2.5rem',
          }}
        >
          ❓
        </div>
      </div>

      {/* Label below */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#cbd5e1',
          whiteSpace: 'nowrap',
          fontWeight: '500',
        }}
      >
        {data.label}
      </div>
    </div>
  )
}

// Animated particle component
const AnimatedParticle: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  return (
    <div
      style={{
        position: 'absolute',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: `flowParticle 3s linear infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.8,
      }}
    />
  )
}

// Stage details modal
const StageDetailsModal: React.FC<{
  stage: StageData
  onClose: () => void
}> = ({ stage, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div
        style={{
          width: '90%',
          maxWidth: '500px',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${stage.color}`,
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 40px ${stage.color}30`,
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '3rem' }}>{stage.icon}</div>
          <div style={{ flex: 1 }}>
            <h2
              id="modal-title"
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#f1f5f9',
                marginBottom: '0.25rem',
              }}
            >
              {stage.name}
            </h2>
            <div
              style={{
                fontSize: '0.875rem',
                color: stage.color,
                fontWeight: '500',
              }}
            >
              {stage.agent}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Status
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: stage.color,
                textTransform: 'capitalize',
              }}
            >
              {stage.status.replace('-', ' ')}
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Time Spent
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#f1f5f9',
              }}
            >
              {stage.timeSpent}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#f1f5f9',
              }}
            >
              Completion
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: stage.color,
              }}
            >
              {stage.completion}%
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(100, 116, 139, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${stage.completion}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`,
                borderRadius: '4px',
                transition: 'width 0.3s ease-out',
                boxShadow: `0 0 12px ${stage.color}80`,
              }}
            />
          </div>
        </div>

        {/* Sub-steps */}
        <div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#f1f5f9',
              marginBottom: '0.75rem',
            }}
          >
            Sub-steps
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {stage.subSteps.map((step) => (
              <div
                key={step.id}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#f1f5f9',
                      fontWeight: '500',
                    }}
                  >
                    {step.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                    }}
                  >
                    {step.completion}%
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(100, 116, 139, 0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${step.completion}%`,
                      height: '100%',
                      background:
                        step.status === 'complete'
                          ? '#10b981'
                          : step.status === 'in-progress'
                          ? '#f59e0b'
                          : '#64748b',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Node types
const nodeTypes = {
  stageNode: StageNode,
  decisionNode: DecisionNode,
}

// Main component
export const DevelopmentWorkflowPipeline: React.FC<DevelopmentWorkflowPipelineProps> = ({
  currentStage,
  completedStages = [],
  failedStages = [],
  interactive = true,
  showControls = true,
  animatedFlow = true,
  orientation = 'horizontal',
  height = '500px',
}) => {
  const [selectedStage, setSelectedStage] = useState<StageData | null>(null)

  // Build stage data with status
  const stages = useMemo(() => {
    const stageIds: StageId[] = ['spec', 'implement', 'test', 'quality', 'review', 'deploy']
    return stageIds.map((id) => ({
      ...stagesData[id],
      status: failedStages.includes(id)
        ? 'failed'
        : completedStages.includes(id)
        ? 'complete'
        : currentStage === id
        ? 'in-progress'
        : 'pending',
      completion: failedStages.includes(id)
        ? 50
        : completedStages.includes(id)
        ? 100
        : currentStage === id
        ? 65
        : 0,
      timeSpent:
        currentStage === id || completedStages.includes(id) ? '2h 15m' : '0h 0m',
      subSteps: sampleSubSteps[id],
    } as StageData))
  }, [currentStage, completedStages, failedStages])

  // Calculate positions
  const getPosition = (index: number) => {
    if (orientation === 'horizontal') {
      return { x: index * 250, y: 200 }
    } else {
      return { x: 200, y: index * 200 }
    }
  }

  const getDecisionPosition = (afterStageIndex: number, offset: number = 0) => {
    if (orientation === 'horizontal') {
      return { x: afterStageIndex * 250 + 125, y: 200 + offset }
    } else {
      return { x: 200 + offset, y: afterStageIndex * 200 + 100 }
    }
  }

  // Build nodes
  const initialNodes: Node<StageNodeData | DecisionNodeData>[] = [
    // Stage nodes
    ...stages.map((stage, index) => ({
      id: stage.id,
      type: 'stageNode',
      position: getPosition(index),
      data: {
        stage,
        isActive: stage.id === currentStage,
        onClick: (s: StageData) => setSelectedStage(s),
      } as StageNodeData,
      draggable: interactive,
      sourcePosition: orientation === 'horizontal' ? Position.Right : Position.Bottom,
      targetPosition: orientation === 'horizontal' ? Position.Left : Position.Top,
    })),
    // Decision nodes
    {
      id: 'decision-quality',
      type: 'decisionNode',
      position: getDecisionPosition(3, orientation === 'horizontal' ? 100 : 100),
      data: {
        label: 'All checks pass?',
        question: 'All quality checks pass?',
        color: '#f59e0b',
      } as DecisionNodeData,
      draggable: interactive,
    },
    {
      id: 'decision-review',
      type: 'decisionNode',
      position: getDecisionPosition(4, orientation === 'horizontal' ? 100 : 100),
      data: {
        label: 'Approved?',
        question: 'Review approved?',
        color: '#f59e0b',
      } as DecisionNodeData,
      draggable: interactive,
    },
  ]

  // Build edges
  const initialEdges: Edge[] = [
    // Main flow
    {
      id: 'spec-implement',
      source: 'spec',
      target: 'implement',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
    },
    {
      id: 'implement-test',
      source: 'implement',
      target: 'test',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
    },
    {
      id: 'test-quality',
      source: 'test',
      target: 'quality',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
    },
    {
      id: 'quality-decision',
      source: 'quality',
      target: 'decision-quality',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
    },
    // Decision: Quality -> Review (Yes path)
    {
      id: 'decision-quality-review',
      source: 'decision-quality',
      target: 'review',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
      label: 'Yes',
      labelStyle: { fill: '#10b981', fontWeight: 600, fontSize: '0.875rem' },
      labelBgStyle: { fill: 'rgba(15, 23, 42, 0.9)' },
    },
    // Decision: Quality -> Implement (No path - Fixer loop)
    {
      id: 'fixer-loop',
      source: 'decision-quality',
      target: 'implement',
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: {
        stroke: '#ef4444',
        strokeWidth: 3,
        strokeDasharray: '5,5',
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444', width: 25, height: 25 },
      label: '🔧 Auto-fix',
      labelStyle: { fill: '#ef4444', fontWeight: 600, fontSize: '0.875rem' },
      labelBgStyle: { fill: 'rgba(15, 23, 42, 0.9)' },
    },
    {
      id: 'review-decision',
      source: 'review',
      target: 'decision-review',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
    },
    // Decision: Review -> Deploy (Yes path)
    {
      id: 'decision-review-deploy',
      source: 'decision-review',
      target: 'deploy',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 25, height: 25 },
      label: 'Yes',
      labelStyle: { fill: '#10b981', fontWeight: 600, fontSize: '0.875rem' },
      labelBgStyle: { fill: 'rgba(15, 23, 42, 0.9)' },
    },
    // Decision: Review -> Implement (No path)
    {
      id: 'review-loop',
      source: 'decision-review',
      target: 'implement',
      type: ConnectionLineType.SmoothStep,
      animated: animatedFlow,
      style: { stroke: '#f97316', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316', width: 25, height: 25 },
      label: 'No',
      labelStyle: { fill: '#f97316', fontWeight: 600, fontSize: '0.875rem' },
      labelBgStyle: { fill: 'rgba(15, 23, 42, 0.9)' },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
  }, [])

  return (
    <>
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
        aria-label="Development Workflow Pipeline"
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
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.5}
          maxZoom={1.5}
          fitView
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
        >
          {showControls && (
            <>
              <Controls
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(10px)',
                }}
                showInteractive={interactive}
              />
              <style>{`
                .react-flow__controls button {
                  background: rgba(16, 185, 129, 0.1);
                  border: 1px solid rgba(16, 185, 129, 0.3);
                  color: #10b981;
                  transition: all 0.2s ease;
                }
                .react-flow__controls button:hover {
                  background: rgba(16, 185, 129, 0.2);
                  border-color: #10b981;
                  transform: scale(1.05);
                }
                .react-flow__controls button path {
                  fill: #10b981;
                }
              `}</style>
            </>
          )}
          <MiniMap
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.5rem',
              backdropFilter: 'blur(10px)',
            }}
            nodeColor={(node) => {
              const data = node.data as StageNodeData | DecisionNodeData | Record<string, unknown>
              if (data && typeof data === 'object') {
                if ('stage' in data && data.stage && typeof data.stage === 'object' && 'color' in data.stage) {
                  return data.stage.color as string
                }
                if ('color' in data && typeof data.color === 'string') {
                  return data.color
                }
              }
              return '#10b981'
            }}
            maskColor="rgba(15, 23, 42, 0.8)"
          />
          <Background gap={16} size={1} color="rgba(148, 163, 184, 0.1)" />
        </ReactFlow>

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
            Development Pipeline
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Click stages for details • {orientation === 'horizontal' ? 'Horizontal flow' : 'Vertical flow'}
          </div>
        </div>
      </div>

      {/* Stage details modal */}
      {selectedStage && <StageDetailsModal stage={selectedStage} onClose={() => setSelectedStage(null)} />}

      {/* Global animations */}
      <style>{`
        @keyframes flowParticle {
          from {
            offset-distance: 0%;
            opacity: 0.8;
          }
          to {
            offset-distance: 100%;
            opacity: 0;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </>
  )
}

// Static variant for documentation
export const DevelopmentWorkflowPipelineStatic: React.FC<
  Omit<DevelopmentWorkflowPipelineProps, 'interactive'>
> = (props) => {
  return <DevelopmentWorkflowPipeline {...props} interactive={false} />
}

// Example usage component with sample data
export const DevelopmentWorkflowPipelineExample: React.FC = () => {
  return (
    <DevelopmentWorkflowPipeline
      currentStage="implement"
      completedStages={['spec']}
      failedStages={[]}
      interactive={true}
      showControls={true}
      animatedFlow={true}
      orientation="horizontal"
      height="600px"
    />
  )
}
