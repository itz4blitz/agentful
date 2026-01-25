import React from 'react';

function SkillBadge({ name, icon }: {
  name: string;
  icon: string;
}) {
  return (
    <div style={{
      padding: '0.625rem 0.875rem',
      background: 'rgba(16, 185, 129, 0.15)',
      borderRadius: '8px',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      fontSize: '0.8125rem',
      fontWeight: '700',
      color: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      {name}
    </div>
  );
}

function QualityGate({ name, icon }: {
  name: string;
  icon: string;
}) {
  return (
    <div style={{
      padding: '0.5rem 0.75rem',
      background: 'rgba(168, 85, 247, 0.15)',
      borderRadius: '8px',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      fontSize: '0.75rem',
      fontWeight: '700',
      color: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: '0.875rem' }}>{icon}</span>
      {name}
    </div>
  );
}

export function SystemVisualization() {
  return (
    <div style={{
      margin: '2rem 0',
      padding: '3rem 2.5rem',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '3.5rem',
      }}>
        <img src="/logo-icon.svg" alt="agentful" style={{ width: '56px', height: '56px' }} />
        <div style={{
          fontSize: '2.25rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>How It Works</div>
      </div>

      {/* Step-by-step sequence */}
      <div style={{ marginBottom: '4rem' }}>
        {/* Step 1: You write spec */}
        <SequenceStep
          number="1"
          title="You write product spec"
          description=".claude/product/index.md"
          color="#06b6d4"
          icon="📝"
        />

        <Arrow label="Run /agentful-start" color="#10b981" highlight />

        {/* Step 2: Hooks intercept */}
        <SequenceStep
          number="2"
          title="Hooks intercept & modify"
          description="PreToolUse • PostToolUse • UserPromptSubmit"
          color="#3b82f6"
          icon="🪝"
          dashed
        />

        <Arrow color="#8b5cf6" />

        {/* Step 3: Orchestrator */}
        <SequenceStep
          number="3"
          title="Orchestrator analyzes & delegates"
          description="Reads spec, creates execution plan, spawns agents"
          color="#8b5cf6"
          icon="🎯"
        />

        <Arrow label="⚡ Parallel execution in git worktrees" color="#10b981" highlight />

        {/* Step 4: Agents work in parallel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '1rem',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            }}>4</div>
            <span>Agents execute in parallel</span>
          </div>

          {/* Timeline showing parallel execution */}
          <div style={{
            position: 'relative',
            height: '220px',
            marginBottom: '2.5rem',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '25px',
            border: '1px solid rgba(148, 163, 184, 0.15)',
          }}>
            {/* Timeline markers */}
            {[0, 25, 50, 75, 100].map((position) => (
              <div
                key={position}
                style={{
                  position: 'absolute',
                  left: `${position}%`,
                  top: '25px',
                  bottom: '25px',
                  width: '1px',
                  background: position === 0 ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.15)',
                  borderLeft: position === 0 ? '2px solid rgba(148, 163, 184, 0.3)' : 'none',
                }}
              />
            ))}

            <TimelineBar
              label="🏗️ Architect"
              description=""
              left="10px"
              width="calc(60% - 10px)"
              color="#ef4444"
              top="10px"
            />
            <TimelineBar
              label="⚙️ Backend"
              description=""
              left="10px"
              width="calc(55% - 10px)"
              color="#3b82f6"
              top="60px"
            />
            <TimelineBar
              label="🎨 Frontend"
              description=""
              left="10px"
              width="calc(55% - 10px)"
              color="#10b981"
              top="110px"
            />
            <TimelineBar
              label="🧪 Tester"
              description=""
              left="10px"
              width="calc(45% - 10px)"
              color="#eab308"
              top="160px"
            />

            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '700',
            }}>
              <span>0min</span>
              <span>2min</span>
              <span>4min</span>
              <span>6min</span>
            </div>
          </div>

          <div style={{
            marginTop: '2.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>💡</span>
              Each agent uses shared skills
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
            }}>
              <SkillBadge name="Validation" icon="✓" />
              <SkillBadge name="Research" icon="🔍" />
              <SkillBadge name="Testing" icon="🧪" />
              <SkillBadge name="Product Planning" icon="📋" />
              <SkillBadge name="Product Tracking" icon="📊" />
              <SkillBadge name="Conversation" icon="💬" />
            </div>
          </div>
        </div>

        <Arrow color="#8b5cf6" />

        {/* Step 5: Reviewer validates */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #a855f720, #a855f710)',
          border: '2px solid #a855f760',
          borderRadius: '16px',
          marginBottom: '0.5rem',
          boxShadow: '0 8px 24px #a855f730',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <div style={{
              minWidth: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #a855f7dd)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '800',
              boxShadow: '0 6px 16px #a855f760',
            }}>
              5
            </div>
            <div style={{
              fontSize: '2.5rem',
              lineHeight: 1,
            }}>
              🔍
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: '#e2e8f0',
              }}>
                Reviewer runs quality gates
              </div>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '0.625rem',
          }}>
            <QualityGate name="Types" icon="📘" />
            <QualityGate name="Lint" icon="✨" />
            <QualityGate name="Tests" icon="🧪" />
            <QualityGate name="Coverage" icon="📊" />
            <QualityGate name="Security" icon="🔒" />
            <QualityGate name="Dead Code" icon="🗑️" />
          </div>
        </div>

        <Arrow color="#a855f7" />

        {/* Decision point */}
        <div className="decision-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '1rem',
        }}>
          <div>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#ef4444',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>✗</span>
                Validation fails
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#cbd5e1',
                lineHeight: '1.6',
              }}>🔧 Fixer auto-fixes issues and re-validates</div>
            </div>
          </div>

          <div>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>✓</span>
                All gates pass
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#cbd5e1',
                lineHeight: '1.6',
              }}>Clean, tested, secure, and fully validated</div>
            </div>
          </div>
        </div>

        <Arrow color="#10b981" />

        {/* Step 6: Production ready */}
        <SequenceStep
          number="6"
          title="Code ready for review"
          description="All quality gates passed • Ready to merge"
          color="#10b981"
          icon="✅"
        />
      </div>

      {/* Comparison */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
        padding: '2.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <h3 style={{
          margin: '0 0 2rem 0',
          color: '#e2e8f0',
          fontSize: '1.5rem',
          fontWeight: '800',
          textAlign: 'center',
        }}>Why Parallel Execution Matters</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
          gap: '1.5rem',
        }}>
          <div style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: '12px',
            border: '2px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
          }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ fontSize: '2rem' }}>⚡</span>
              With Git Worktrees
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: '900',
              color: '#10b981',
              marginBottom: '1rem',
              lineHeight: '1.2',
            }}>6 min</div>

            {/* Parallel execution visualization */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}>
              <WaitingAgent name="Backend" active={true} />
              <WaitingAgent name="Frontend" active={true} />
              <WaitingAgent name="Tester" active={true} />
              <WaitingAgent name="Reviewer" active={true} />
            </div>

            <div style={{
              fontSize: '0.875rem',
              color: '#cbd5e1',
              lineHeight: '1.6',
            }}>
              All agents run <strong style={{ color: '#10b981' }}>simultaneously</strong> in isolated git worktrees
            </div>
          </div>

          <div style={{
            padding: '1.75rem',
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '12px',
            border: '2px solid rgba(100, 116, 139, 0.3)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '800',
              color: '#94a3b8',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <span style={{ fontSize: '2rem' }}>🐌</span>
              Without Worktrees
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: '900',
              color: '#64748b',
              marginBottom: '1rem',
              lineHeight: '1.2',
            }}>15 min</div>

            {/* Sequential waiting visualization */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}>
              <WaitingAgent name="Backend" active={false} />
              <WaitingAgent name="Frontend" active={false} waiting />
              <WaitingAgent name="Tester" active={false} waiting />
              <WaitingAgent name="Reviewer" active={false} waiting />
            </div>

            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              lineHeight: '1.6',
            }}>
              Each agent must <strong style={{ color: '#64748b' }}>wait</strong> for the previous one to complete
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: '900',
            color: '#10b981',
            marginBottom: '0.25rem',
            lineHeight: '1.2',
          }}>2.5x faster</div>
          <div style={{
            fontSize: '0.875rem',
            color: '#cbd5e1',
            fontWeight: '600',
          }}>with parallel execution</div>
        </div>
      </div>
    </div>
  );
}

function SequenceStep({ number, title, description, color, icon, dashed = false }: {
  number: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  dashed?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.75rem',
      background: dashed
        ? 'transparent'
        : `linear-gradient(135deg, ${color}20, ${color}10)`,
      border: dashed ? `2px dashed ${color}80` : `2px solid ${color}60`,
      borderRadius: '16px',
      marginBottom: '0rem',
      boxShadow: dashed ? 'none' : `0 8px 24px ${color}30`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      if (!dashed) {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 12px 32px ${color}40`;
      }
    }}
    onMouseLeave={(e) => {
      if (!dashed) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
      }
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
      }}>
        <div style={{
          minWidth: '48px',
          height: '48px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: '800',
          boxShadow: `0 6px 16px ${color}60`,
        }}>
          {number}
        </div>
        <div style={{
          fontSize: '2.5rem',
          lineHeight: 1,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '800',
            color: '#e2e8f0',
          }}>
            {title}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '0.9rem',
        color: '#cbd5e1',
        fontWeight: '500',
      }}>
        {description}
      </div>
    </div>
  );
}

function Arrow({ label, color = '#64748b', style = {}, highlight = false }: {
  label?: string;
  color?: string;
  style?: React.CSSProperties;
  highlight?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '2rem 0',
      ...style,
    }}>
      <div style={{
        width: '4px',
        height: '60px',
        background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
        position: 'relative',
        borderRadius: '2px',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `12px solid ${color}`,
        }} />
      </div>
      {label && (
        <div style={{
          fontSize: '0.875rem',
          color: highlight ? '#e2e8f0' : color,
          fontWeight: '700',
          marginTop: '1.25rem',
          letterSpacing: '0.5px',
          padding: highlight ? '0.625rem 1.25rem' : '0.375rem 0.75rem',
          background: highlight
            ? `linear-gradient(135deg, ${color}35, ${color}20)`
            : `linear-gradient(135deg, ${color}20, ${color}10)`,
          borderRadius: '8px',
          border: highlight ? `2px solid ${color}60` : `1px solid ${color}30`,
          fontFamily: highlight ? 'monospace' : 'inherit',
          boxShadow: highlight ? `0 4px 12px ${color}30` : `0 2px 6px ${color}20`,
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

function WaitingAgent({ name, active, waiting = false }: {
  name: string;
  active: boolean;
  waiting?: boolean;
}) {
  const isActive = active && !waiting;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      marginBottom: '0.5rem',
      borderRadius: '6px',
      background: isActive
        ? 'rgba(16, 185, 129, 0.2)'
        : waiting
        ? 'rgba(100, 116, 139, 0.1)'
        : 'rgba(100, 116, 139, 0.2)',
      border: isActive
        ? '1px solid rgba(16, 185, 129, 0.4)'
        : `1px solid ${waiting ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.3)'}`,
      opacity: waiting ? 0.5 : 1,
    }}>
      <div style={{
        fontSize: '0.8rem',
        color: isActive ? '#10b981' : waiting ? '#64748b' : '#94a3b8',
        fontWeight: '600',
        flex: 1,
        minWidth: 0,
      }}>
        {name}
      </div>
      {waiting ? (
        <div style={{
          fontSize: '0.7rem',
          color: '#64748b',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          whiteSpace: 'nowrap',
        }}>
          <span>⏸️</span>
          waiting
        </div>
      ) : (
        <div style={{
          fontSize: '0.7rem',
          color: isActive ? '#10b981' : '#94a3b8',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          whiteSpace: 'nowrap',
        }}>
          <span>{isActive ? '▶️' : '▶️'}</span>
          running
        </div>
      )}
    </div>
  );
}

function TimelineBar({ label, description, left, width, color, top }: {
  label: string;
  description: string;
  left: string;
  width: string;
  color: string;
  top: string;
}) {
  return (
    <div style={{
      position: 'absolute',
      left,
      width,
      top,
      height: '38px',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 12px',
      color: '#000',
      boxShadow: `0 4px 12px ${color}60`,
      border: `1px solid ${color}`,
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: '800',
        lineHeight: '1.2',
        color: '#000',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{label}</div>
      {description && (
        <div style={{
          fontSize: '10px',
          opacity: 0.85,
          lineHeight: '1.2',
          fontWeight: '600',
          color: '#000',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{description}</div>
      )}
    </div>
  );
}
