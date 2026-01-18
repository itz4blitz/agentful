# agentful v0.1.1 - Master Execution Plan

**Generated**: 2026-01-18
**Status**: Ready for Implementation

## Executive Summary

This plan orchestrates the transformation of agentful from a flat PRODUCT.md-based system to a sophisticated hierarchical product structure with conversational AI interface and smart project analysis.

## Research Findings Summary

### Current State
- ✅ Code already supports both flat and hierarchical structures
- ❌ Documentation still heavily references flat PRODUCT.md
- ❌ No conversational interface (only rigid slash commands)
- ❌ Init is file-based, no smart project analysis

### Critical Gaps Identified
1. **17 documentation files** need updates for hierarchical structure
2. **No /agentful command** for natural language interaction
3. **Init doesn't analyze projects** - just copies templates
4. **No conversation history tracking** for context retention

## Implementation Phases

### Phase 1: Documentation Updates (CRITICAL - User Facing)
**Priority**: 🔴 CRITICAL
**Effort**: 4-6 hours
**Impact**: Immediate user confusion removal

#### 1.1 Update Core Documentation (4 files)
- [ ] `docs/pages/configuration/project-structure.mdx` - Add both structures to diagrams
- [ ] `docs/pages/guides/writing-product-md.mdx` - Two separate templates
- [ ] `docs/pages/getting-started/first-project.mdx` - Show both options
- [ ] `docs/pages/getting-started/quick-start.mdx` - Structure choice guidance

#### 1.2 Update Examples (2 files)
- [ ] `docs/pages/examples/full-stack-app.mdx` - Hierarchical structure example
- [ ] `docs/pages/examples/api-development.mdx` - Hierarchical structure example

#### 1.3 Update Entry Points (2 files)
- [ ] `README.md` - Quick start shows both options
- [ ] `docs/pages/getting-started/configuration.mdx` - Structure in directory diagram

**Success Criteria**:
- All user-facing docs show both structures
- Clear guidance on when to use each
- Decision matrix included

---

### Phase 2: Conversational Interface
**Priority**: 🟡 HIGH
**Effort**: 8-10 hours
**Impact**: Major UX improvement

#### 2.1 Core Infrastructure
- [ ] Create `.agentful/conversation-history.json` schema
- [ ] Build intent classification engine
- [ ] Implement conversation context manager

#### 2.2 Command Implementation
- [ ] Create `.claude/commands/agentful.md` with:
  - Intent classification algorithm
  - Decision logic flow
  - Orchestrator integration
  - Conversation history tracking

#### 2.3 Integration
- [ ] Update orchestrator to accept conversation context
- [ ] Connect with completion tracking
- [ ] Wire up decision handling

**Success Criteria**:
- User can type "Build authentication" and it works
- Conversation context retained across messages
- Intent classification accuracy > 85%

---

### Phase 3: Smart Init Enhancement
**Priority**: 🟡 HIGH
**Effort**: 12-15 hours
**Impact**: Project-specific agents automatically

#### 3.1 Analysis Engine
- [ ] Implement project structure scanner
- [ ] Build technology detector (language, framework, dependencies)
- [ ] Create domain detection algorithm (multi-source with confidence)
- [ ] Add pattern mining from code

#### 3.2 Agent Generation
- [ ] Create agent template system
- [ ] Build domain-specific agent generator
- [ ] Implement tech-specific agent generator

#### 3.3 Domain Structure Generation
- [ ] Build hierarchical product structure generator
- [ ] Create domain index templates
- [ ] Generate feature specifications

#### 3.4 CLI Integration
- [ ] Update `bin/cli.js` init command
- [ ] Add `--smart`, `--deep`, `--no-smart` flags
- [ ] Implement progress indicators
- [ ] Create user-friendly output

**Success Criteria**:
- `npx @itz4blitz/agentful init` analyzes existing projects
- Domain detection accuracy > 80%
- Generates working specialized agents
- Completes in < 30 seconds

---

### Phase 4: Template & CLI Updates
**Priority**: 🟢 MEDIUM
**Effort**: 2-3 hours
**Impact**: Consistency

#### 4.1 Template Updates
- [ ] Update `template/PRODUCT.md` with structure options
- [ ] Update `template/CLAUDE.md` with both structure references

#### 4.2 CLI Messages
- [ ] Update `bin/cli.js` output messages
- [ ] Add structure choice prompts
- [ ] Update help text

**Success Criteria**:
- Templates mention both structures
- CLI guides users to appropriate choice

---

## Deployment Strategy

### Parallel Work Streams

#### Stream A: Documentation (Agents: frontend + general-purpose)
1. Update project-structure.mdx (foundational reference)
2. Update writing-product-md.mdx (how-to guide)
3. Update first-project and quick-start (entry points)
4. Update examples (full-stack-app, api-development)
5. Update README and configuration docs

#### Stream B: Conversational Interface (Agent: backend)
1. Create conversation-history.json schema
2. Implement intent classification engine
3. Build conversation context manager
4. Create /agentful command
5. Integrate with orchestrator

#### Stream C: Smart Init (Agent: architect + backend)
1. Build project analysis engine
2. Implement domain detection
3. Create agent generator
4. Build domain structure generator
5. Update CLI integration

#### Stream D: Templates & CLI Polish (Agent: general-purpose)
1. Update templates
2. Update CLI messages
3. Test all flows
4. Final polish

### Quality Gates

After each phase:
1. **Reviewer agent** validates changes
2. **Tester agent** creates tests
3. **Fixer agent** addresses issues

## File Changes Inventory

### New Files (15)
```
.claude/commands/agentful.md                    # Conversational interface
.claude/skills/conversation/SKILL.md            # Natural language processing
.agentful/conversation-history.json             # Conversation tracking
.agentful/conversation-preferences.json         # User preferences
.agentful/analysis.json                        # Smart init analysis results
.claude/agents/auto-generated/*.md             # Generated agents
.claude/product/domains/*/index.md             # Generated domains
.claude/product/domains/*/features/*.md        # Generated features
```

### Modified Files (30)
```
Documentation (17 files):
  docs/pages/configuration/project-structure.mdx
  docs/pages/guides/writing-product-md.mdx
  docs/pages/getting-started/first-project.mdx
  docs/pages/getting-started/quick-start.mdx
  docs/pages/getting-started/configuration.mdx
  docs/pages/examples/full-stack-app.mdx
  docs/pages/examples/api-development.mdx
  README.md
  + 9 other documentation files

Code (8 files):
  bin/cli.js
  template/PRODUCT.md
  template/CLAUDE.md
  .claude/commands/agentful-start.md
  .claude/commands/agentful-status.md
  .claude/agents/orchestrator.md
  .claude/skills/product-tracking/SKILL.md
  package.json (version bump)

State (5 files):
  .agentful/state.json (enhanced)
  .agentful/completion.json (enhanced)
  .agentful/decisions.json (enhanced)
  .agentful/architecture.json (enhanced)
  + conversation-history.json (new)
```

## Testing Strategy

### Unit Tests
- [ ] Intent classification accuracy tests
- [ ] Domain detection accuracy tests
- [ ] Conversation context retention tests
- [ ] Product structure auto-detection tests

### Integration Tests
- [ ] Full conversation flow (feature → status → continue)
- [ ] Smart init on test projects (Next.js, Django, Go)
- [ ] Agent generation and usage
- [ ] Documentation completeness

### Validation
- [ ] All docs reference both structures correctly
- [ ] No hardcoded PRODUCT.md references
- [ ] CLI messages consistent
- [ ] All agents work with both structures

## Success Metrics

### Documentation
- ✅ 0 critical files left with outdated PRODUCT.md references
- ✅ Clear decision matrix for structure choice
- ✅ All examples show hierarchical structure (or explain why flat)

### Conversational Interface
- ✅ Intent classification accuracy > 85%
- ✅ Conversation context retention > 95%
- ✅ Natural language requests work without specific commands

### Smart Init
- ✅ Project analysis completes in < 30 seconds
- ✅ Domain detection accuracy > 80%
- ✅ Generated agents work without modification
- ✅ Hierarchical structure generation accuracy > 90%

### Overall
- ✅ All validation gates pass
- ✅ Test coverage > 80% on new code
- ✅ No breaking changes to existing functionality

## Risk Mitigation

### Risk 1: Breaking Existing Users
**Mitigation**: Backward compatibility maintained - both structures supported, auto-detection

### Risk 2: Documentation Confusion
**Mitigation**: Clear messaging, decision matrix, migration guide

### Risk 3: Smart Init Accuracy
**Mitigation**: Confidence thresholds, user prompts for low-confidence detections, graceful fallbacks

### Risk 4: Conversation History Bloat
**Mitigation**: Automatic pruning, summarization, configurable retention

## Rollout Plan

### Stage 1: Documentation (Days 1-2)
- Update all user-facing docs
- Add examples
- Update README

### Stage 2: Conversational Interface (Days 3-5)
- Build conversation infrastructure
- Implement /agentful command
- Integrate with existing commands

### Stage 3: Smart Init (Days 6-10)
- Build analysis engine
- Implement domain detection
- Create agent generation
- Update CLI

### Stage 4: Testing & Polish (Days 11-12)
- Comprehensive testing
- Bug fixes
- Documentation review

### Stage 5: Release (Day 13)
- Version bump to 0.1.1
- Release notes
- Deploy documentation

## Next Actions

1. ✅ Research complete (4 agents deployed)
2. ⏳ Execute documentation updates (delegate to general-purpose + frontend agents)
3. ⏳ Implement conversational interface (delegate to backend agent)
4. ⏳ Enhance smart init (delegate to architect + backend agents)
5. ⏳ Validate all changes (delegate to reviewer agent)
6. ⏳ Test thoroughly (delegate to tester agent)

---

**Orchestration Note**: This is a complex multi-stream effort. Use the orchestrator agent to coordinate work across multiple specialized agents working in parallel.
