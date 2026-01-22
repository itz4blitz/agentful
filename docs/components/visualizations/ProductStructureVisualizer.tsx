import React, { useCallback, useState, useMemo } from 'react'
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
  useReactFlow,
  ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type NodeStatus = 'complete' | 'in-progress' | 'pending'
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
type NodeLevel = 'product' | 'domain' | 'feature' | 'subtask'

interface Subtask {
  id: string
  name: string
  completion: number
  status: NodeStatus
}

interface Feature {
  id: string
  name: string
  completion: number
  priority: Priority
  status: NodeStatus
  subtasks: Subtask[]
  description?: string
  dependencies?: string[]
}

interface Domain {
  id: string
  name: string
  completion: number
  features: Feature[]
  description?: string
}

interface Product {
  id: string
  name: string
  completion: number
  description?: string
}

export interface ProductStructure {
  product: Product
  domains: Domain[]
}

interface BaseNodeData extends Record<string, unknown> {
  id: string
  name: string
  completion: number
  level: NodeLevel
  status?: NodeStatus
  priority?: Priority
  color: string
  parentId?: string
  isExpanded?: boolean
}

interface ProductNodeData extends BaseNodeData {
  level: 'product'
  description?: string
}

interface DomainNodeData extends BaseNodeData {
  level: 'domain'
  featureCount: number
  description?: string
}

interface FeatureNodeData extends BaseNodeData {
  level: 'feature'
  status: NodeStatus
  priority: Priority
  subtaskCount: number
  description?: string
  dependencies?: string[]
}

interface SubtaskNodeData extends BaseNodeData {
  level: 'subtask'
  status: NodeStatus
}

type ProductNodeDataUnion = ProductNodeData | DomainNodeData | FeatureNodeData | SubtaskNodeData

// ============================================================================
// STYLING & COLOR CONFIGURATION
// ============================================================================

const STATUS_COLORS: Record<NodeStatus, string> = {
  complete: '#10b981', // Green
  'in-progress': '#f59e0b', // Yellow
  pending: '#6b7280', // Gray
}

const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: '#ef4444', // Red
  HIGH: '#f97316', // Orange
  MEDIUM: '#3b82f6', // Blue
  LOW: '#6b7280', // Gray
}

const LEVEL_STYLES = {
  product: {
    width: 220,
    height: 110,
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    icon: '🎯',
    fontSize: '1rem',
  },
  domain: {
    width: 200,
    height: 100,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    icon: '📦',
    fontSize: '0.9375rem',
  },
  feature: {
    width: 180,
    height: 90,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    icon: '✨',
    fontSize: '0.875rem',
  },
  subtask: {
    width: 160,
    height: 70,
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    icon: '📝',
    fontSize: '0.8125rem',
  },
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_DATA: ProductStructure = {
  product: {
    id: 'product-1',
    name: 'agentful',
    completion: 75,
    description: 'Autonomous product development framework with specialized AI agents',
  },
  domains: [
    {
      id: 'domain-1',
      name: 'Agent System',
      completion: 90,
      description: 'Core agent orchestration and delegation system',
      features: [
        {
          id: 'feature-1',
          name: 'Orchestrator Agent',
          completion: 100,
          priority: 'CRITICAL',
          status: 'complete',
          description: 'Central coordinator managing all specialist agents',
          subtasks: [
            { id: 'sub-1', name: 'Task delegation', completion: 100, status: 'complete' },
            { id: 'sub-2', name: 'State management', completion: 100, status: 'complete' },
            { id: 'sub-3', name: 'Progress tracking', completion: 100, status: 'complete' },
          ],
        },
        {
          id: 'feature-2',
          name: 'Specialist Agents',
          completion: 80,
          priority: 'HIGH',
          status: 'in-progress',
          description: 'Domain-specific agents for focused development tasks',
          subtasks: [
            { id: 'sub-4', name: 'Backend agent', completion: 100, status: 'complete' },
            { id: 'sub-5', name: 'Frontend agent', completion: 90, status: 'in-progress' },
            { id: 'sub-6', name: 'Tester agent', completion: 70, status: 'in-progress' },
            { id: 'sub-7', name: 'Reviewer agent', completion: 60, status: 'in-progress' },
          ],
        },
        {
          id: 'feature-3',
          name: 'Quality Gates',
          completion: 70,
          priority: 'HIGH',
          status: 'in-progress',
          description: 'Automated validation and quality checks',
          subtasks: [
            { id: 'sub-8', name: 'Type checking', completion: 100, status: 'complete' },
            { id: 'sub-9', name: 'Test coverage', completion: 80, status: 'in-progress' },
            { id: 'sub-10', name: 'Security scanning', completion: 30, status: 'in-progress' },
          ],
        },
      ],
    },
    {
      id: 'domain-2',
      name: 'Documentation',
      completion: 60,
      description: 'User guides and interactive visualizations',
      features: [
        {
          id: 'feature-4',
          name: 'Interactive Visualizations',
          completion: 50,
          priority: 'HIGH',
          status: 'in-progress',
          description: 'React Flow based visual components',
          subtasks: [
            { id: 'sub-11', name: 'Agent Architecture Flow', completion: 100, status: 'complete' },
            { id: 'sub-12', name: 'Product Structure Visualizer', completion: 0, status: 'pending' },
            { id: 'sub-13', name: 'Progress Dashboard', completion: 0, status: 'pending' },
          ],
        },
        {
          id: 'feature-5',
          name: 'API Reference',
          completion: 70,
          priority: 'MEDIUM',
          status: 'in-progress',
          description: 'Comprehensive API documentation',
          subtasks: [
            { id: 'sub-14', name: 'Core APIs', completion: 90, status: 'in-progress' },
            { id: 'sub-15', name: 'CLI Commands', completion: 50, status: 'in-progress' },
          ],
        },
      ],
    },
    {
      id: 'domain-3',
      name: 'Developer Experience',
      completion: 75,
      description: 'Tools and configuration for better DX',
      features: [
        {
          id: 'feature-6',
          name: 'Web Configurator',
          completion: 80,
          priority: 'CRITICAL',
          status: 'in-progress',
          description: 'Interactive setup and configuration tool',
          subtasks: [
            { id: 'sub-16', name: 'Component selector', completion: 100, status: 'complete' },
            { id: 'sub-17', name: 'Preset manager', completion: 90, status: 'in-progress' },
            { id: 'sub-18', name: 'Export functionality', completion: 50, status: 'in-progress' },
          ],
        },
        {
          id: 'feature-7',
          name: 'CLI Presets',
          completion: 70,
          priority: 'HIGH',
          status: 'in-progress',
          description: 'Pre-configured installation profiles',
          subtasks: [
            { id: 'sub-19', name: 'Minimal preset', completion: 100, status: 'complete' },
            { id: 'sub-20', name: 'Full preset', completion: 80, status: 'in-progress' },
            { id: 'sub-21', name: 'Custom preset support', completion: 30, status: 'in-progress' },
          ],
        },
      ],
    },
  ],
}

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

/**
 * Custom hierarchical tree layout algorithm
 * Creates a top-to-bottom tree structure with automatic spacing
 *
 * Layout strategy:
 * - Product node at top center
 * - Domains spread horizontally below product
 * - Features vertically below each domain
 * - Subtasks vertically below each feature
 *
 * Spacing:
 * - Horizontal: 280px between siblings
 * - Vertical: 140px between levels
 */
interface LayoutNode {
  id: string
  level: NodeLevel
  parentId?: string
  children: string[]
  width: number
  height: number
}

interface Position {
  x: number
  y: number
}

const HORIZONTAL_SPACING = 280
const VERTICAL_SPACING = 140

function calculateTreeLayout(
  nodes: LayoutNode[],
  expandedNodes: Set<string>
): Map<string, Position> {
  const positions = new Map<string, Position>()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Level tracking for Y positioning
  const levelY: Record<NodeLevel, number> = {
    product: 0,
    domain: VERTICAL_SPACING,
    feature: VERTICAL_SPACING * 2,
    subtask: VERTICAL_SPACING * 3,
  }

  // Get visible children (respecting expand/collapse state)
  function getVisibleChildren(nodeId: string): string[] {
    const node = nodeMap.get(nodeId)
    if (!node || !expandedNodes.has(nodeId)) return []
    return node.children
  }

  // Calculate subtree width (for centering)
  function calculateSubtreeWidth(nodeId: string): number {
    const node = nodeMap.get(nodeId)
    if (!node) return 0

    const children = getVisibleChildren(nodeId)
    if (children.length === 0) return node.width

    const childWidths = children.map((childId) => calculateSubtreeWidth(childId))
    const totalChildWidth = childWidths.reduce((sum, w) => sum + w, 0)
    const totalSpacing = (children.length - 1) * HORIZONTAL_SPACING

    return Math.max(node.width, totalChildWidth + totalSpacing)
  }

  // Recursive layout function
  function layoutNode(nodeId: string, x: number, y: number): void {
    const node = nodeMap.get(nodeId)
    if (!node) return

    const children = getVisibleChildren(nodeId)
    const subtreeWidth = calculateSubtreeWidth(nodeId)

    // Center the current node over its subtree
    const nodeX = x + (subtreeWidth - node.width) / 2
    positions.set(nodeId, { x: nodeX, y })

    // Layout children
    if (children.length > 0) {
      let currentX = x

      children.forEach((childId) => {
        const childNode = nodeMap.get(childId)
        if (!childNode) return

        const childSubtreeWidth = calculateSubtreeWidth(childId)
        const childY = y + VERTICAL_SPACING

        layoutNode(childId, currentX, childY)
        currentX += childSubtreeWidth + HORIZONTAL_SPACING
      })
    }
  }

  // Start layout from product node (root)
  const productNode = nodes.find((n) => n.level === 'product')
  if (productNode) {
    const totalWidth = calculateSubtreeWidth(productNode.id)
    layoutNode(productNode.id, 0, 0)
  }

  return positions
}

// ============================================================================
// CUSTOM NODE COMPONENTS
// ============================================================================

/**
 * Progress bar component
 */
const ProgressBar: React.FC<{ completion: number; status?: NodeStatus }> = ({
  completion,
  status,
}) => {
  const statusColor = status ? STATUS_COLORS[status] : '#10b981'
  const isInProgress = status === 'in-progress'

  return (
    <div
      style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginTop: '0.5rem',
      }}
      role="progressbar"
      aria-valuenow={completion}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${completion}% complete`}
    >
      <div
        style={{
          height: '100%',
          width: `${completion}%`,
          background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isInProgress ? 'progressPulse 2s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  )
}

/**
 * Status badge component
 */
const StatusBadge: React.FC<{ status: NodeStatus }> = ({ status }) => {
  const labels: Record<NodeStatus, string> = {
    complete: 'Complete',
    'in-progress': 'In Progress',
    pending: 'Pending',
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.6875rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        background: `${STATUS_COLORS[status]}20`,
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}40`,
      }}
    >
      {labels[status]}
    </div>
  )
}

/**
 * Priority badge component
 */
const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.6875rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        background: `${PRIORITY_COLORS[priority]}20`,
        color: PRIORITY_COLORS[priority],
        border: `1px solid ${PRIORITY_COLORS[priority]}40`,
      }}
    >
      {priority}
    </div>
  )
}

/**
 * Generic hierarchical node component
 * Renders all 4 node types with appropriate styling
 */
const HierarchyNode: React.FC<NodeProps<ProductNodeDataUnion>> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false)
  const style = LEVEL_STYLES[data.level]

  const hasStatus = 'status' in data && data.status
  const hasPriority = 'priority' in data && data.priority
  const isExpandable = data.level === 'domain' || data.level === 'feature'

  return (
    <div
      style={{
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="treeitem"
      aria-label={`${data.name}, ${data.completion}% complete`}
      aria-expanded={isExpandable ? data.isExpanded : undefined}
    >
      <div
        style={{
          width: `${style.width}px`,
          height: `${style.height}px`,
          borderRadius: '0.75rem',
          background: data.level === 'product' ? style.gradient : 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${data.color}`,
          padding: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHovered
            ? `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 40px ${data.color}40`
            : `0 2px 8px rgba(0, 0, 0, 0.2)`,
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem',
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{style.icon}</span>
            <div
              style={{
                flex: 1,
                fontSize: style.fontSize,
                fontWeight: '600',
                color: data.level === 'product' ? '#ffffff' : '#f1f5f9',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {data.name}
            </div>
            {isExpandable && (
              <span
                style={{
                  fontSize: '0.875rem',
                  color: data.color,
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: data.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
                aria-hidden="true"
              >
                ▼
              </span>
            )}
          </div>

          {/* Badges */}
          {(hasStatus || hasPriority) && (
            <div
              style={{
                display: 'flex',
                gap: '0.375rem',
                marginBottom: '0.375rem',
              }}
            >
              {hasStatus && <StatusBadge status={(data as FeatureNodeData | SubtaskNodeData).status} />}
              {hasPriority && <PriorityBadge priority={(data as FeatureNodeData).priority} />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: data.level === 'product' ? 'rgba(255, 255, 255, 0.9)' : data.color,
              marginBottom: '0.25rem',
            }}
          >
            {data.completion}% Complete
          </div>
          <ProgressBar
            completion={data.completion}
            status={hasStatus ? (data as FeatureNodeData | SubtaskNodeData).status : undefined}
          />
        </div>
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// NODE TYPES
// ============================================================================

const nodeTypes = {
  hierarchyNode: HierarchyNode,
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ProductStructureVisualizerProps {
  data?: ProductStructure
  interactive?: boolean
  showControls?: boolean
  initialZoom?: number
  height?: string
  expandedByDefault?: boolean
}

export const ProductStructureVisualizer: React.FC<ProductStructureVisualizerProps> = ({
  data = SAMPLE_DATA,
  interactive = true,
  showControls = true,
  initialZoom = 0.6,
  height = '700px',
  expandedByDefault = false,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    if (!expandedByDefault) return new Set()

    // Expand all domains and features by default
    const expanded = new Set<string>([data.product.id])
    data.domains.forEach((domain) => {
      expanded.add(domain.id)
      domain.features.forEach((feature) => {
        expanded.add(feature.id)
      })
    })
    return expanded
  })

  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // ============================================================================
  // NODE & EDGE GENERATION
  // ============================================================================

  const { initialNodes, initialEdges } = useMemo(() => {
    const layoutNodes: LayoutNode[] = []
    const nodes: Node<ProductNodeDataUnion>[] = []
    const edges: Edge[] = []

    // Helper to check if node matches filters
    const matchesFilters = (
      status?: NodeStatus,
      priority?: Priority,
      name?: string
    ): boolean => {
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (priorityFilter !== 'all' && priority !== priorityFilter) return false
      if (searchQuery && name && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    }

    // Product node
    const productExpanded = expandedNodes.has(data.product.id)
    layoutNodes.push({
      id: data.product.id,
      level: 'product',
      children: productExpanded ? data.domains.map((d) => d.id) : [],
      width: LEVEL_STYLES.product.width,
      height: LEVEL_STYLES.product.height,
    })

    nodes.push({
      id: data.product.id,
      type: 'hierarchyNode',
      position: { x: 0, y: 0 }, // Will be updated by layout
      data: {
        id: data.product.id,
        name: data.product.name,
        completion: data.product.completion,
        level: 'product',
        color: STATUS_COLORS.complete,
        isExpanded: productExpanded,
        description: data.product.description,
      } as ProductNodeData,
      draggable: false,
    })

    // Domain nodes
    if (productExpanded) {
      data.domains.forEach((domain) => {
        const domainExpanded = expandedNodes.has(domain.id)
        const visibleFeatures = domain.features.filter((f) =>
          matchesFilters(f.status, f.priority, f.name)
        )

        if (visibleFeatures.length === 0 && searchQuery) return // Skip if no matching features

        layoutNodes.push({
          id: domain.id,
          level: 'domain',
          parentId: data.product.id,
          children: domainExpanded ? visibleFeatures.map((f) => f.id) : [],
          width: LEVEL_STYLES.domain.width,
          height: LEVEL_STYLES.domain.height,
        })

        nodes.push({
          id: domain.id,
          type: 'hierarchyNode',
          position: { x: 0, y: 0 },
          data: {
            id: domain.id,
            name: domain.name,
            completion: domain.completion,
            level: 'domain',
            color: '#3b82f6',
            isExpanded: domainExpanded,
            featureCount: domain.features.length,
            description: domain.description,
          } as DomainNodeData,
          draggable: false,
        })

        edges.push({
          id: `${data.product.id}-${domain.id}`,
          source: data.product.id,
          target: domain.id,
          type: ConnectionLineType.SmoothStep,
          animated: false,
          style: {
            stroke: '#3b82f6',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 16,
            height: 16,
          },
        })

        // Feature nodes
        if (domainExpanded) {
          visibleFeatures.forEach((feature) => {
            const featureExpanded = expandedNodes.has(feature.id)
            const visibleSubtasks = feature.subtasks.filter((s) =>
              matchesFilters(s.status, undefined, s.name)
            )

            layoutNodes.push({
              id: feature.id,
              level: 'feature',
              parentId: domain.id,
              children: featureExpanded ? visibleSubtasks.map((s) => s.id) : [],
              width: LEVEL_STYLES.feature.width,
              height: LEVEL_STYLES.feature.height,
            })

            nodes.push({
              id: feature.id,
              type: 'hierarchyNode',
              position: { x: 0, y: 0 },
              data: {
                id: feature.id,
                name: feature.name,
                completion: feature.completion,
                level: 'feature',
                status: feature.status,
                priority: feature.priority,
                color: PRIORITY_COLORS[feature.priority],
                isExpanded: featureExpanded,
                subtaskCount: feature.subtasks.length,
                description: feature.description,
                dependencies: feature.dependencies,
              } as FeatureNodeData,
              draggable: false,
            })

            edges.push({
              id: `${domain.id}-${feature.id}`,
              source: domain.id,
              target: feature.id,
              type: ConnectionLineType.SmoothStep,
              animated: feature.status === 'in-progress',
              style: {
                stroke: PRIORITY_COLORS[feature.priority],
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: PRIORITY_COLORS[feature.priority],
                width: 16,
                height: 16,
              },
            })

            // Subtask nodes
            if (featureExpanded) {
              visibleSubtasks.forEach((subtask) => {
                layoutNodes.push({
                  id: subtask.id,
                  level: 'subtask',
                  parentId: feature.id,
                  children: [],
                  width: LEVEL_STYLES.subtask.width,
                  height: LEVEL_STYLES.subtask.height,
                })

                nodes.push({
                  id: subtask.id,
                  type: 'hierarchyNode',
                  position: { x: 0, y: 0 },
                  data: {
                    id: subtask.id,
                    name: subtask.name,
                    completion: subtask.completion,
                    level: 'subtask',
                    status: subtask.status,
                    color: STATUS_COLORS[subtask.status],
                  } as SubtaskNodeData,
                  draggable: false,
                })

                edges.push({
                  id: `${feature.id}-${subtask.id}`,
                  source: feature.id,
                  target: subtask.id,
                  type: ConnectionLineType.SmoothStep,
                  animated: subtask.status === 'in-progress',
                  style: {
                    stroke: STATUS_COLORS[subtask.status],
                    strokeWidth: 2,
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: STATUS_COLORS[subtask.status],
                    width: 16,
                    height: 16,
                  },
                })
              })
            }
          })
        }
      })
    }

    // Calculate layout positions
    const positions = calculateTreeLayout(layoutNodes, expandedNodes)

    // Apply positions to nodes
    nodes.forEach((node) => {
      const pos = positions.get(node.id)
      if (pos) {
        node.position = pos
      }
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [data, expandedNodes, statusFilter, priorityFilter, searchQuery])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when filters or expand state changes
  React.useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<ProductNodeDataUnion>) => {
      const isExpandable = node.data.level === 'domain' || node.data.level === 'feature'

      if (isExpandable) {
        // Toggle expand/collapse
        setExpandedNodes((prev) => {
          const next = new Set(prev)
          if (next.has(node.id)) {
            next.delete(node.id)
          } else {
            next.add(node.id)
          }
          return next
        })
      }

      // Show details modal
      setSelectedNode(node.id)
    },
    []
  )

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    }, 0)
  }, [])

  // ============================================================================
  // DETAIL MODAL
  // ============================================================================

  const DetailModal: React.FC<{ nodeId: string; onClose: () => void }> = ({ nodeId, onClose }) => {
    const nodeData = nodes.find((n) => n.id === nodeId)?.data
    if (!nodeData) return null

    let content: React.ReactNode = null

    if (nodeData.level === 'product') {
      const productData = nodeData as ProductNodeData
      content = (
        <>
          <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {productData.description || 'No description available'}
          </p>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Domains
            </div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              {data.domains.length} total domains
            </div>
          </div>
        </>
      )
    } else if (nodeData.level === 'domain') {
      const domainData = nodeData as DomainNodeData
      const domain = data.domains.find((d) => d.id === nodeId)
      content = (
        <>
          <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {domainData.description || 'No description available'}
          </p>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Features ({domain?.features.length || 0})
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {domain?.features.map((feature) => (
                <li key={feature.id} style={{ fontSize: '0.8125rem', color: '#cbd5e1', paddingLeft: '1rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: PRIORITY_COLORS[feature.priority] }}>•</span>
                  {feature.name} ({feature.completion}%)
                </li>
              ))}
            </ul>
          </div>
        </>
      )
    } else if (nodeData.level === 'feature') {
      const featureData = nodeData as FeatureNodeData
      const domain = data.domains.find((d) => d.features.some((f) => f.id === nodeId))
      const feature = domain?.features.find((f) => f.id === nodeId)
      content = (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <StatusBadge status={featureData.status} />
            <PriorityBadge priority={featureData.priority} />
          </div>
          <p style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {featureData.description || 'No description available'}
          </p>
          {feature?.dependencies && feature.dependencies.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f59e0b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Dependencies
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {feature.dependencies.map((dep, idx) => (
                  <li key={idx} style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: PRIORITY_COLORS[featureData.priority], marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Subtasks ({feature?.subtasks.length || 0})
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {feature?.subtasks.map((subtask) => (
                <li key={subtask.id} style={{ fontSize: '0.8125rem', color: '#cbd5e1', paddingLeft: '1rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: STATUS_COLORS[subtask.status] }}>•</span>
                  {subtask.name} ({subtask.completion}%)
                </li>
              ))}
            </ul>
          </div>
        </>
      )
    } else if (nodeData.level === 'subtask') {
      const subtaskData = nodeData as SubtaskNodeData
      content = (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <StatusBadge status={subtaskData.status} />
          </div>
          <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
            Progress: {subtaskData.completion}%
          </div>
          <ProgressBar completion={subtaskData.completion} status={subtaskData.status} />
        </>
      )
    }

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
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          style={{
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `2px solid ${nodeData.color}`,
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${nodeData.color}30`,
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>{LEVEL_STYLES[nodeData.level].icon}</span>
            <h3 id="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#f1f5f9', flex: 1 }}>
              {nodeData.name}
            </h3>
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
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {content}

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            Click outside or press ESC to close
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    )
  }

  // Close modal on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ width: '100%' }}>
      {/* Filter Controls */}
      {interactive && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Search */}
          <div>
            <label
              htmlFor="search-input"
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Search
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)')}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#94a3b8',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Status
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['all', 'complete', 'in-progress', 'pending'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background:
                        statusFilter === status
                          ? status === 'all'
                            ? '#10b981'
                            : STATUS_COLORS[status]
                          : 'rgba(30, 41, 59, 0.6)',
                      border: `1px solid ${
                        statusFilter === status
                          ? status === 'all'
                            ? '#10b981'
                            : STATUS_COLORS[status]
                          : 'rgba(148, 163, 184, 0.3)'
                      }`,
                      borderRadius: '0.375rem',
                      color: statusFilter === status ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (statusFilter !== status) {
                        e.currentTarget.style.borderColor =
                          status === 'all' ? '#10b981' : STATUS_COLORS[status] || '#10b981'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (statusFilter !== status) {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      }
                    }}
                    aria-pressed={statusFilter === status}
                  >
                    {status === 'all' ? 'All' : status.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#94a3b8',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Priority
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setPriorityFilter(priority)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background:
                        priorityFilter === priority
                          ? priority === 'all'
                            ? '#10b981'
                            : PRIORITY_COLORS[priority]
                          : 'rgba(30, 41, 59, 0.6)',
                      border: `1px solid ${
                        priorityFilter === priority
                          ? priority === 'all'
                            ? '#10b981'
                            : PRIORITY_COLORS[priority]
                          : 'rgba(148, 163, 184, 0.3)'
                      }`,
                      borderRadius: '0.375rem',
                      color: priorityFilter === priority ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (priorityFilter !== priority) {
                        e.currentTarget.style.borderColor =
                          priority === 'all' ? '#10b981' : PRIORITY_COLORS[priority] || '#10b981'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (priorityFilter !== priority) {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      }
                    }}
                    aria-pressed={priorityFilter === priority}
                  >
                    {priority === 'all' ? 'All' : priority}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setPriorityFilter('all')
                setSearchQuery('')
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: '0.5rem',
                color: '#ef4444',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* React Flow Diagram */}
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
        aria-label="Product Structure Hierarchy"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={interactive ? onNodesChange : undefined}
          onEdgesChange={interactive ? onEdgesChange : undefined}
          onNodeClick={interactive ? handleNodeClick : undefined}
          onInit={onInit}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={interactive}
          zoomOnScroll={interactive}
          panOnDrag={interactive}
          defaultViewport={{ x: 0, y: 0, zoom: initialZoom }}
          minZoom={0.3}
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
                  background: rgba(30, 41, 59, 0.9);
                  border: 1px solid rgba(148, 163, 184, 0.2);
                  border-radius: 0.25rem;
                  color: #10b981;
                  transition: all 0.2s;
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
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '0.5rem',
              backdropFilter: 'blur(10px)',
            }}
            nodeColor={(node) => {
              const data = node.data as ProductNodeDataUnion | Record<string, unknown>
              if (data && typeof data === 'object' && 'color' in data && typeof data.color === 'string') {
                return data.color
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
            Product Structure
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {interactive ? 'Click to expand/collapse • Click for details' : 'Static view'}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNode && <DetailModal nodeId={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  )
}

// ============================================================================
// STATIC VARIANT (Non-interactive)
// ============================================================================

export const ProductStructureVisualizerStatic: React.FC<
  Omit<ProductStructureVisualizerProps, 'interactive'>
> = (props) => {
  return <ProductStructureVisualizer {...props} interactive={false} />
}
