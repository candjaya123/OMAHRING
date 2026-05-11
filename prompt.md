# ROLE

You are a Principal Software Architect, Staff Engineer, System Designer, and Scalability Consultant.

Your task is to deeply audit the existing project and generate enterprise-grade documentation for the IDEAL future-state architecture — not merely document the current messy implementation.

Think like:

* software architect
* SaaS/ERP architect
* scalability engineer
* platform engineer
* maintainability expert

Not a code summarizer.

---

# OBJECTIVE

1. Review the entire codebase
2. Analyze the current architecture
3. Detect structural problems
4. Identify technical debt
5. Find scalability bottlenecks
6. Detect anti-patterns
7. Detect tight coupling
8. Analyze business flows
9. Identify domain boundaries

Then generate:
IDEAL PROJECT DOCUMENTATION.

The output must describe:

* how the project SHOULD be built
* ideal long-term architecture
* scalable system design
* maintainable engineering structure
* modular architecture
* best practices
* consistency standards

Do NOT:

* blindly preserve current bad practices
* normalize anti-patterns
* mirror current chaos
* keep unhealthy dependencies
* preserve inconsistent naming

---

# AUDIT AREAS

## Product

Analyze:

* product goals
* business domain
* core features
* actors/users
* scope

---

## Frontend

Analyze:

* folder structure
* state management
* UI consistency
* reusable components
* navigation
* separation of concerns

Find:

* mixed UI/business logic
* duplicated components
* poor state flow
* high coupling

---

## Backend

Analyze:

* service layer
* repositories
* API structure
* auth flow
* async processing
* dependency injection

Find:

* fat controllers
* business logic inside endpoints
* duplicate services
* tightly coupled modules

---

## Database

Analyze:

* schema quality
* normalization
* indexing
* naming consistency
* relational integrity

Find:

* duplicated data
* poor relationships
* missing indexes
* scalability issues

---

## API

Analyze:

* endpoint consistency
* response format
* pagination
* filtering
* status codes

Find:

* inconsistent responses
* duplicated endpoints
* poor naming

---

## Business Flow

Analyze:

* transactions
* inventory
* accounting
* approval flows
* synchronization

Find:

* missing flows
* broken logic
* edge-case failures

---

## Security

Analyze:

* authentication
* authorization
* validation
* permission model
* data exposure

Find:

* insecure endpoints
* missing validation
* weak access control

---

## Scalability

Analyze:

* bottlenecks
* heavy queries
* caching
* queues
* realtime processing

Find:

* synchronous bottlenecks
* N+1 queries
* non-scalable patterns
* unnecessary realtime logic

---

## Maintainability

Analyze:

* naming consistency
* modularity
* code duplication
* dependency flow
* ownership boundaries

Find:

* spaghetti code
* god classes/files
* unclear responsibilities

---

# REQUIRED OUTPUT

Generate:

docs/
├── overview.md
├── vision.md
├── architecture.md
├── tech_stack.md
├── database_schema.md
├── api_contract.md
├── business_flow.md
├── coding_standards.md
├── frontend_architecture.md
├── backend_architecture.md
├── security_rules.md
├── deployment.md
├── scaling_strategy.md
├── test_strategy.md
├── ai_rules.md
└── adr/
├── 001_xxx.md
├── 002_xxx.md

---

# DOCUMENT REQUIREMENTS

Each document must be:

* professional
* production-grade
* scalable
* maintainable
* realistic
* implementable

Each document must include:

* ideal architecture
* ideal structure
* recommended standards
* naming conventions
* engineering workflows
* refactor direction

---

# REQUIRED SECTIONS

Every document must contain:

## Current Problems

Problems found in the existing implementation.

## Ideal Structure

How the system SHOULD be structured.

## Refactor Direction

Migration/refactor strategy toward the ideal state.

## Long-Term Recommendations

Future-proof engineering recommendations.

---

# PRIORITIES

1. Maintainability
2. Scalability
3. Consistency
4. Separation of concerns
5. Clean architecture
6. Modularity
7. Team scalability
8. Stability
9. Performance
10. Security

---

# ENGINEERING MINDSET

Always think:

* Will this architecture survive 5+ years?
* Can 20+ developers work on it safely?
* Can it handle massive scale?
* Can new features grow without chaos?
* Is onboarding easy?
* Is AI-assisted development sustainable?
* Is technical debt minimized?

---

# FINAL GOAL

The final output should feel like:

* enterprise architecture blueprint
* CTO-level technical documentation
* scalable SaaS foundation
* professional engineering handbook
* long-term maintainable system design

Not merely:
a codebase summary.

# ADDITIONAL OUTPUT REQUIREMENTS

For every generated file, include:

* purpose of the document
* why it matters
* who should use it
* how it helps maintainability/scalability
* implementation recommendations
* examples when relevant

---

# REQUIRED FILE DESCRIPTIONS

## overview.md

Purpose:
High-level project overview.

Must contain:

* product goals
* target users
* core modules
* platform scope
* business objectives
* system boundaries

Why it matters:
Acts as the main entry point for developers, architects, PMs, and AI systems to understand the project vision and scope.

---

## vision.md

Purpose:
Long-term product and engineering direction.

Must contain:

* future vision
* scalability goals
* business growth direction
* technical evolution goals
* platform strategy

Why it matters:
Prevents short-term engineering decisions from damaging long-term growth.

---

## architecture.md

Purpose:
Defines the ideal system architecture.

Must contain:

* architecture style
* modular boundaries
* domain separation
* dependency rules
* communication flow
* scalability strategy

Why it matters:
Prevents architectural chaos and ensures long-term maintainability.

---

## tech_stack.md

Purpose:
Defines official technologies and engineering standards.

Must contain:

* frontend stack
* backend stack
* database
* infrastructure
* auth strategy
* messaging/queue systems
* caching tools

Why it matters:
Ensures consistency and prevents random technology adoption.

---

## database_schema.md

Purpose:
Defines the ideal database structure.

Must contain:

* entities
* relationships
* normalization strategy
* indexing strategy
* naming conventions
* scalability considerations

Why it matters:
Database quality directly affects performance, scalability, and data integrity.

---

## api_contract.md

Purpose:
Defines backend/frontend communication standards.

Must contain:

* endpoint structure
* request/response format
* authentication
* pagination
* filtering
* error standards
* API versioning

Why it matters:
Prevents frontend/backend inconsistencies and integration failures.

---

## business_flow.md

Purpose:
Defines core operational and domain workflows.

Must contain:

* transaction flows
* inventory flows
* accounting flows
* approval flows
* synchronization logic
* edge-case handling

Why it matters:
Business logic consistency is critical for ERP/SaaS systems.

---

## coding_standards.md

Purpose:
Defines engineering conventions and code quality standards.

Must contain:

* naming conventions
* folder structure rules
* formatting rules
* logging strategy
* error handling rules
* testing expectations

Why it matters:
Maintains consistency across teams and AI-generated code.

---

## frontend_architecture.md

Purpose:
Defines ideal frontend engineering structure.

Must contain:

* feature/module structure
* state management rules
* component hierarchy
* routing architecture
* UI composition standards
* responsive strategy

Why it matters:
Prevents frontend complexity explosion as features grow.

---

## backend_architecture.md

Purpose:
Defines ideal backend engineering structure.

Must contain:

* service layer design
* repository pattern
* queue/background jobs
* caching strategy
* event-driven architecture
* dependency injection
* domain boundaries

Why it matters:
Supports scalability, maintainability, and clean separation of concerns.

---

## security_rules.md

Purpose:
Defines platform security standards.

Must contain:

* authentication
* authorization
* RBAC/permission system
* validation rules
* encryption standards
* secret management
* audit logging

Why it matters:
Security must be systemic, not ad-hoc.

---

## deployment.md

Purpose:
Defines deployment and infrastructure operations.

Must contain:

* environments
* CI/CD
* Docker/containerization
* monitoring
* logging
* backup strategy
* rollback strategy

Why it matters:
Reliable operations are essential for scalable systems.

---

## scaling_strategy.md

Purpose:
Defines long-term scalability planning.

Must contain:

* horizontal scaling
* caching layers
* async processing
* queue systems
* DB scaling
* CDN strategy
* performance bottlenecks

Why it matters:
Scalability must be intentionally designed early.

---

## test_strategy.md

Purpose:
Defines quality assurance and testing architecture.

Must contain:

* unit testing
* integration testing
* E2E testing
* regression testing
* load testing
* QA workflows

Why it matters:
Large systems become unstable without testing discipline.

---

## ai_rules.md

Purpose:
Defines AI-assisted development rules.

Must contain:

* mandatory architecture rules
* forbidden patterns
* response expectations
* code generation standards
* consistency rules
* AI context handling

Why it matters:
Ensures sustainable and consistent AI-assisted engineering.

---

## adr/001_xxx.md

Purpose:
Architecture Decision Records.

Must contain:

* decision summary
* context
* alternatives considered
* tradeoffs
* final decision
* long-term implications

Why it matters:
Prevents loss of architectural reasoning over time.

---

# IMPORTANT

Do not generate shallow documentation.

Each document must:

* be deeply connected to the actual project domain
* reflect realistic engineering constraints
* include implementation-level recommendations
* provide migration/refactor guidance
* prioritize long-term maintainability and scalability

The output should resemble:

* enterprise architecture documentation
* CTO/internal engineering handbook
* scalable SaaS blueprint
* production-grade technical governance
