# Agent Generation System - Architecture Diagrams

## System Overview

```mermaid
graph TB
    subgraph "User Interface"
        CLI[CLI Commands]
        API[Programmatic API]
        WEB[Web Configurator]
    end

    subgraph "Core Engine"
        ORCH[Orchestration Layer]
        ANAL[Analysis Engine]
        GEN[Generation Engine]
        VAL[Validation Engine]
    end

    subgraph "Data Layer"
        TMPL[Template System]
        STOR[Storage Manager]
        VER[Version Control]
    end

    subgraph "Output"
        AGENTS[Generated Agents]
        ARCH[Architecture.json]
        META[Metadata]
    end

    CLI --> ORCH
    API --> ORCH
    WEB --> ORCH

    ORCH --> ANAL
    ORCH --> GEN
    ORCH --> VAL

    ANAL --> STOR
    GEN --> TMPL
    GEN --> STOR
    VAL --> STOR

    STOR --> AGENTS
    STOR --> ARCH
    STOR --> META
    STOR --> VER

    style ORCH fill:#f9f,stroke:#333,stroke-width:4px
    style ANAL fill:#bbf,stroke:#333,stroke-width:2px
    style GEN fill:#bbf,stroke:#333,stroke-width:2px
    style VAL fill:#bbf,stroke:#333,stroke-width:2px
```

## Analysis Flow

```mermaid
sequenceDiagram
    participant User
    participant Analyzer
    participant PatternDetector
    participant TechStackDetector
    participant ConventionExtractor
    participant Storage

    User->>Analyzer: analyze()

    Analyzer->>Analyzer: detectProjectType()
    Note over Analyzer: New vs Existing

    alt Existing Project
        Analyzer->>PatternDetector: detectPatterns(files)
        PatternDetector->>PatternDetector: Sample files
        PatternDetector->>PatternDetector: Extract patterns
        PatternDetector-->>Analyzer: PatternMap

        Analyzer->>TechStackDetector: detect()
        TechStackDetector->>TechStackDetector: Check package files
        TechStackDetector->>TechStackDetector: Scan imports
        TechStackDetector-->>Analyzer: TechStack

        Analyzer->>ConventionExtractor: extract()
        ConventionExtractor->>ConventionExtractor: Naming conventions
        ConventionExtractor->>ConventionExtractor: File structure
        ConventionExtractor->>ConventionExtractor: Code style
        ConventionExtractor-->>Analyzer: Conventions
    else New Project
        Analyzer->>Analyzer: Read product spec
        Analyzer->>Analyzer: Use declared stack
        Analyzer->>Analyzer: Mark for re-analysis
    end

    Analyzer->>Storage: saveArchitecture()
    Storage-->>Analyzer: Success

    Analyzer-->>User: AnalysisResult
```

## Generation Pipeline

```mermaid
flowchart LR
    subgraph "Input"
        ANALYSIS[Analysis Result]
        TEMPLATES[Templates]
        CONTEXT[Context]
    end

    subgraph "Processing"
        SELECT[Template Selection]
        COMPILE[Template Compilation]
        VALIDATE[Validation]
    end

    subgraph "Output"
        AGENTS[Generated Agents]
        CONFIG[Agent Configs]
        METADATA[Metadata]
    end

    ANALYSIS --> SELECT
    TEMPLATES --> SELECT
    SELECT --> COMPILE
    CONTEXT --> COMPILE
    COMPILE --> VALIDATE
    VALIDATE --> AGENTS
    VALIDATE --> CONFIG
    VALIDATE --> METADATA

    style COMPILE fill:#fbb,stroke:#333,stroke-width:2px
```

## Template Inheritance

```mermaid
graph TD
    BASE[Base Template]
    FRAMEWORK[Framework Template]
    PATTERN[Pattern Template]
    CUSTOM[Custom Template]
    FINAL[Final Agent]

    BASE --> FRAMEWORK
    FRAMEWORK --> PATTERN
    PATTERN --> CUSTOM
    CUSTOM --> FINAL

    BASE -.->|variables| FINAL
    FRAMEWORK -.->|sections| FINAL
    PATTERN -.->|examples| FINAL
    CUSTOM -.->|overrides| FINAL

    style BASE fill:#f9f,stroke:#333,stroke-width:2px
    style FINAL fill:#9f9,stroke:#333,stroke-width:2px
```

## Storage Architecture

```mermaid
graph TB
    subgraph ".agentful/"
        subgraph "agents/"
            GEN[generated/]
            CUST[custom/]
        end

        subgraph "templates/"
            BASE2[base/]
            FW[frameworks/]
            PAT[patterns/]
        end

        subgraph "versions/"
            V1[v1.0.0/]
            V2[v1.0.1/]
            V3[v1.0.2/]
        end

        ARCH2[architecture.json]
        META2[metadata.json]
        LOG[generation.log]
    end

    GEN --> V3
    ARCH2 --> V3
    META2 --> V3

    style GEN fill:#fdd,stroke:#333,stroke-width:2px
    style CUST fill:#dfd,stroke:#333,stroke-width:2px
    style V3 fill:#ddf,stroke:#333,stroke-width:2px
```

## Pattern Detection Strategy

```mermaid
flowchart TD
    START[Start Analysis]
    SAMPLE[Sample Files]

    subgraph "Detectors"
        IMP[Import Patterns]
        COMP[Component Patterns]
        API[API Patterns]
        DB[Database Patterns]
        TEST[Testing Patterns]
        AUTH[Auth Patterns]
        ERR[Error Patterns]
    end

    AGGREGATE[Aggregate Results]
    CONFIDENCE[Calculate Confidence]
    DECIDE{Confidence > 0.5?}
    INCLUDE[Include Pattern]
    EXCLUDE[Exclude Pattern]
    RESULT[Pattern Map]

    START --> SAMPLE
    SAMPLE --> IMP
    SAMPLE --> COMP
    SAMPLE --> API
    SAMPLE --> DB
    SAMPLE --> TEST
    SAMPLE --> AUTH
    SAMPLE --> ERR

    IMP --> AGGREGATE
    COMP --> AGGREGATE
    API --> AGGREGATE
    DB --> AGGREGATE
    TEST --> AGGREGATE
    AUTH --> AGGREGATE
    ERR --> AGGREGATE

    AGGREGATE --> CONFIDENCE
    CONFIDENCE --> DECIDE
    DECIDE -->|Yes| INCLUDE
    DECIDE -->|No| EXCLUDE
    INCLUDE --> RESULT
    EXCLUDE --> RESULT

    style CONFIDENCE fill:#ff9,stroke:#333,stroke-width:2px
    style DECIDE fill:#f9f,stroke:#333,stroke-width:2px
```

## Error Recovery Flow

```mermaid
stateDiagram-v2
    [*] --> Analysis
    Analysis --> Detection: Success
    Analysis --> ErrorState: Failure

    Detection --> LowConfidence: Confidence < 0.5
    Detection --> HighConfidence: Confidence >= 0.5

    ErrorState --> Recovery
    Recovery --> FallbackMode

    LowConfidence --> PromptUser: Ask for input
    LowConfidence --> UseBestPractices: New project

    PromptUser --> Detection: User provides info
    UseBestPractices --> Generation: Use templates

    HighConfidence --> Generation
    FallbackMode --> Generation

    Generation --> Validation
    Validation --> Success: Valid
    Validation --> Retry: Invalid

    Retry --> Generation: Max 2 attempts
    Retry --> Manual: Exceeded retries

    Success --> [*]
    Manual --> [*]
```

## API Interaction Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Analyzer
    participant Generator
    participant Storage

    Client->>API: agentful.init()
    API->>Storage: initialize()
    Storage-->>API: ready

    Client->>API: agentful.analyze()
    API->>Analyzer: analyze()
    Analyzer-->>API: AnalysisResult
    API->>Storage: saveArchitecture()
    Storage-->>API: saved
    API-->>Client: AnalysisResult

    Client->>API: agentful.generateAgents()
    API->>Generator: generate(analysis)
    Generator->>Generator: selectTemplates()
    Generator->>Generator: compileTemplates()
    Generator->>Generator: validateAgents()
    Generator-->>API: GeneratedAgents
    API->>Storage: saveAgents()
    Storage-->>API: saved
    API-->>Client: GenerationResult

    Client->>API: agentful.listAgents()
    API->>Storage: listAgents()
    Storage-->>API: AgentList
    API-->>Client: AgentList
```

## Confidence Scoring

```mermaid
graph LR
    subgraph "Input Signals"
        TC[Tech Stack<br/>30%]
        PT[Patterns<br/>30%]
        CV[Conventions<br/>20%]
        EX[Examples<br/>20%]
    end

    subgraph "Calculation"
        WEIGHTED[Weighted Sum]
        NORMALIZE[Normalize 0-1]
    end

    subgraph "Output"
        SCORE[Confidence Score]
        ACTION{Action}
    end

    TC --> WEIGHTED
    PT --> WEIGHTED
    CV --> WEIGHTED
    EX --> WEIGHTED

    WEIGHTED --> NORMALIZE
    NORMALIZE --> SCORE

    SCORE --> ACTION
    ACTION -->|> 0.8| HIGH[High Confidence]
    ACTION -->|0.5-0.8| MEDIUM[Medium Confidence]
    ACTION -->|< 0.5| LOW[Low Confidence]

    LOW --> REANALYZE[Mark for Re-analysis]

    style SCORE fill:#ff9,stroke:#333,stroke-width:2px
    style HIGH fill:#9f9,stroke:#333,stroke-width:2px
    style LOW fill:#f99,stroke:#333,stroke-width:2px
```

## Version Control Integration

```mermaid
flowchart TD
    GENERATE[Generate Agents]
    SAVE[Save to Disk]
    CHECK{Git Enabled?}

    GITIGNORE[Update .gitignore]
    STAGE[Stage Files]
    COMMIT[Create Commit]

    VERSION[Create Version]
    SNAPSHOT[Save Snapshot]
    META3[Update Metadata]

    GENERATE --> SAVE
    SAVE --> CHECK

    CHECK -->|Yes| GITIGNORE
    GITIGNORE --> STAGE
    STAGE --> COMMIT

    CHECK -->|No| VERSION
    COMMIT --> VERSION

    VERSION --> SNAPSHOT
    SNAPSHOT --> META3

    style CHECK fill:#ff9,stroke:#333,stroke-width:2px
    style COMMIT fill:#9f9,stroke:#333,stroke-width:2px
    style VERSION fill:#99f,stroke:#333,stroke-width:2px
```