# agentful Open Source Sponsorship Playbook

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Draft Strategy Document

---

## Executive Summary

This playbook provides a comprehensive strategy for securing corporate sponsorships for **agentful**, an autonomous product development framework powered by Claude AI. It includes research findings from successful open-source projects, sponsorship tier structures, pitch templates, ROI calculations, timeline milestones, and legal considerations.

**Key Insight:** agentful drives direct API revenue for AI providers (Anthropic, Google) and infrastructure usage for deployment platforms (GitHub Actions, Vercel, Netlify). Our sponsorship strategy focuses on demonstrating ROI through revenue attribution rather than traditional brand awareness.

---

## Table of Contents

1. [Research: Successful Open Source Sponsorship Models](#1-research-successful-open-source-sponsorship-models)
2. [Sponsorship Tier Structure](#2-sponsorship-tier-structure)
3. [Target Sponsor Profiles & Pitch Strategy](#3-target-sponsor-profiles--pitch-strategy)
4. [ROI Calculation Framework](#4-roi-calculation-framework)
5. [Timeline & Adoption Milestones](#5-timeline--adoption-milestones)
6. [Legal & Tax Considerations](#6-legal--tax-considerations)
7. [Pitch Deck Templates](#7-pitch-deck-templates)
8. [Outreach & Execution Plan](#8-outreach--execution-plan)
9. [Measurement & Reporting](#9-measurement--reporting)
10. [Appendix: Case Studies](#10-appendix-case-studies)

---

## 1. Research: Successful Open Source Sponsorship Models

### 1.1 Model Analysis

#### **A. Employee-Funded Model (Vue.js / Evan You)**

**Structure:**
- Creator works full-time on open source
- Multiple revenue streams: GitHub Sponsors, Patreon, OpenCollective
- Educational partnerships and ads

**Financials:**
- Started with $4,000/month (Patreon + initial corporate sponsor)
- Grew to $16,000/month on Patreon alone
- Current: $400,000+/year from all sources combined

**Key Lessons:**
- Diversified income streams provide stability
- Personal brand matters (Evan You === Vue.js)
- Community trust converts to financial support
- Requires 3-5 years to reach sustainable income

**Applicability to agentful:** Medium. Agentful is not tied to a single creator's personal brand, but could benefit from diversified funding sources.

---

#### **B. Corporate Ownership Model (Next.js / Vercel)**

**Structure:**
- Company creates and maintains OSS project
- OSS drives adoption of commercial platform
- Full-time employees funded by company revenue

**Financials:**
- No external sponsorships needed
- Development costs amortized across platform revenue
- Next.js is a loss leader driving Vercel conversions

**Key Lessons:**
- OSS can be a marketing expense for a larger business
- Top-of-funnel capture at scale
- Requires product-market fit for commercial offering
- Company ownership provides stability but reduces community control

**Applicability to agentful:** Low for current phase. Could be future exit strategy (acquisition by Anthropic, GitHub, etc.).

---

#### **C. Corporate Sponsorship Model (Vite / StackBlitz)**

**Structure:**
- Independent OSS project
- Major corporate sponsor employs core maintainers
- Sponsorship aligned with sponsor's business interests

**Financials:**
- StackBlitz is largest backer of Vite core development
- Sponsors full-time contributors (Anthony Fu, Vladimir Sheremet)
- Additional sponsorships via GitHub Sponsors (Bronze, Silver, Gold, Platinum tiers)

**Key Lessons:**
- Strategic alignment drives sponsorship decisions
- Sponsors benefit from improved tooling for their ecosystem
- Multiple sponsor tiers diversify risk
- Platinum sponsors get prominent placement on docs

**Applicability to agentful:** **HIGH**. This is the ideal model for agentful. Claude Code (Anthropic) and Gemini (Google) benefit directly from agentful adoption.

---

#### **D. Utility Model (ESLint, Prettier, Babel)**

**Structure:**
- Critical infrastructure utility used by millions
- Multiple small sponsors via OpenCollective
- Transparent budget and spending

**Financials:**
- **ESLint:** Needs $20,000/month, struggles to secure it despite 13M weekly downloads
- **Prettier:** Received $200k total lifetime donations, pays maintainers $1,500/month each
- **Babel:** Needs $333,000/year, failed to secure sustainable funding despite universal adoption

**Key Lessons:**
- Utility tools are chronically underfunded (tragedy of the commons)
- High usage ≠ high sponsorship conversion
- Transparency (OpenCollective) doesn't automatically drive funding
- Corporate sponsors expect ROI, not just "doing good"

**Challenges:**
- "Everyone uses it, so someone else will fund it" mentality
- Sponsors prefer feature-driven projects over infrastructure
- Difficult to demonstrate direct business value

**Applicability to agentful:** Medium risk. Agentful could face similar funding challenges if positioned as pure infrastructure. **Solution:** Position as revenue driver, not utility.

---

#### **E. Open Core Model (HashiCorp Terraform - Failed Model)**

**Structure:**
- Open source core, paid enterprise features
- Core builds adoption, enterprise drives revenue

**Financials:**
- Terraform was massively popular but not profitable
- Vault (closed source) funded Terraform development
- Switched from MPL 2.0 to BSL 1.1 to prevent competitors monetizing their OSS

**Key Lessons:**
- Open core creates tension with community
- Competitors free-ride on R&D investment
- Popular ≠ profitable
- License changes damage trust

**Why It Failed:**
- 85% of HashiCorp revenue from only 2 products (Terraform + Vault)
- Terraform users wouldn't pay for enterprise features
- VC-funded competitors built on top of Terraform OSS
- Community forked to OpenTofu after license change

**Applicability to agentful:** **DO NOT PURSUE**. Open core creates community friction and rarely works for developer tools. agentful should remain fully open source.

---

### 1.2 Summary: Best Model for agentful

**Recommended:** **Corporate Sponsorship Model (Vite-style)** with **Revenue Attribution Framework**

**Why:**
1. **Direct ROI:** Anthropic/Google earn revenue for every agentful user
2. **Strategic Alignment:** Sponsors benefit from increased API usage
3. **Community Goodwill:** Stays fully open source
4. **Proven Success:** Vite/StackBlitz demonstrates viability
5. **Scalable:** Can add multiple sponsor tiers as adoption grows

---

## 2. Sponsorship Tier Structure

### 2.1 Tier Definitions

| Tier | Monthly | Annual | Benefits |
|------|---------|--------|----------|
| **Platinum Sponsor** | $10,000 | $120,000 | • Logo on homepage (top placement)<br>• Logo on README (top placement)<br>• Logo on docs (all pages)<br>• Mention in all release announcements<br>• Quarterly executive briefing on metrics<br>• Priority feature requests<br>• "Powered by [Sponsor]" in CLI output<br>• Custom case study published on website<br>• Speaking slot at community events |
| **Gold Sponsor** | $5,000 | $60,000 | • Logo on homepage<br>• Logo on README<br>• Logo on docs homepage<br>• Mention in major release announcements<br>• Quarterly metrics report<br>• Priority bug reports |
| **Silver Sponsor** | $2,500 | $30,000 | • Logo on README<br>• Logo on docs sponsors page<br>• Bi-annual metrics report<br>• Listing in release announcements |
| **Bronze Sponsor** | $1,000 | $12,000 | • Logo on README (smaller)<br>• Logo on docs sponsors page<br>• Annual metrics report |
| **Supporter** | $500 | $6,000 | • Logo on docs sponsors page<br>• Name listed in README |
| **Backer** | $100 | $1,200 | • Name listed on docs sponsors page |

### 2.2 Strategic Sponsor Benefits (Non-Public)

For **primary strategic sponsors** (Anthropic, Google, GitHub) who directly benefit from agentful's revenue attribution:

**Custom Benefits Package:**
- **Revenue Dashboard:** Real-time dashboard showing API calls, conversions, and attributed revenue
- **Attribution Reporting:** Monthly reports with UTM-tracked conversions back to their platform
- **Co-Marketing:** Joint blog posts, conference talks, case studies
- **Product Roadmap Input:** Direct input into feature prioritization
- **Early Access:** Beta features 30 days before public release
- **Integration Priority:** First-class integrations maintained by core team
- **Custom Instrumentation:** Specialized tracking for sponsor-specific metrics

**Target Pricing:**
- **Anthropic (Primary):** $15,000-20,000/month ($180k-240k/year)
- **Google (Secondary):** $10,000-15,000/month ($120k-180k/year)
- **GitHub (Tertiary):** $5,000-10,000/month ($60k-120k/year)

---

### 2.3 Value Proposition by Tier

#### **What Sponsors Get:**

**Brand Awareness:**
- Platinum: ~500k+ impressions/year (homepage, docs, README, releases)
- Gold: ~200k+ impressions/year
- Silver: ~50k+ impressions/year
- Bronze: ~20k+ impressions/year

**Developer Reach:**
- Access to audience of engineering leaders and CTOs (agentful users are decision-makers)
- Association with cutting-edge AI development practices
- Credibility in autonomous development space

**Business Intelligence:**
- Quarterly/annual reports showing adoption trends
- Insight into how companies build with AI agents
- Early visibility into AI-powered development patterns

**Competitive Positioning:**
- Position as supporter of open source AI infrastructure
- Differentiation from competitors who don't fund OSS
- Goodwill in developer community

---

## 3. Target Sponsor Profiles & Pitch Strategy

### 3.1 Primary Targets

#### **Target #1: Anthropic (Claude API)**

**Why They Should Sponsor:**
- **Direct Revenue Impact:** Every agentful user generates Claude API revenue
- **Market Position:** Positions Claude as the preferred model for autonomous development
- **Competitive Edge:** Differentiates from OpenAI/Gemini in developer tools space
- **Strategic Moat:** Investing in agentful locks in Claude as default model

**Quantifiable ROI:**
- Avg. agentful session: 50-200 API calls
- Avg. API cost per session: $2-10
- 1,000 daily active users = $2,000-10,000/day = $730k-3.6M/year API revenue
- **Sponsorship at $240k/year = 0.07-0.33x of generated revenue**
- **Sponsorship breakeven: ~100 daily active users**

**Decision Makers:**
- **Jack Clark** - VP of Policy & Co-Founder (strategic partnerships)
- **Daniela Amodei** - Co-Founder & President (business development)
- **Scott White** - Head of Developer Relations (DX & ecosystem)
- **Zac Hatfield-Dodds** - Engineering (dev tools & developer experience)

**Pitch Angle:**
- "Sponsoring agentful is not charity—it's a 3-10x ROI marketing spend that drives direct API revenue while building your developer ecosystem."
- Position agentful as **Claude's Next.js** (Vercel's strategy: own the framework, win the platform)

**Outreach Strategy:**
1. **Warm Intro (Preferred):** Via existing Anthropic connection, Y Combinator network, or AI conference
2. **Direct Outreach:** Email to partnerships@anthropic.com with pitch deck
3. **Public Visibility:** Tweet metrics showing Claude API usage driven by agentful, tag @AnthropicAI
4. **Community Advocacy:** Get agentful users to share Claude success stories

**Timeline:**
- **Approach When:** 500+ GitHub stars, 100+ weekly active projects, clear attribution metrics
- **Expected Close Time:** 3-6 months (enterprise decision cycle)

---

#### **Target #2: Google (Gemini API)**

**Why They Should Sponsor:**
- **API Revenue:** agentful can support Gemini models (multi-model strategy)
- **Competitive Response:** Anthropic sponsorship would make Google look behind
- **Developer Relations:** Google wants to win AI developer mindshare
- **Ecosystem Play:** Aligns with Google Cloud, Firebase, and GCP integrations

**Quantifiable ROI:**
- If 20% of agentful users choose Gemini over Claude = $146k-720k/year API revenue
- **Sponsorship at $120k-180k/year = 0.17-1.23x of generated revenue**
- **Sponsorship breakeven: ~50 daily active users on Gemini**

**Decision Makers:**
- **Sissie Hsiao** - VP, Google Assistant & Bard (Gemini)
- **Jeanine Banks** - VP, Google Cloud & Developer Relations
- **Googlers in AI/ML DevRel** - Reach via Google Cloud partnerships

**Pitch Angle:**
- "Support agentful to ensure Gemini is a first-class model for autonomous development, not an afterthought to Claude."
- Position as defensive strategy: "Don't let Anthropic own the AI development tool ecosystem."

**Outreach Strategy:**
1. **Google Cloud Partner Program:** Apply via Google Cloud partnerships
2. **Developer Relations:** Reach out via Google AI for Developers program
3. **Public Visibility:** Build Gemini integration first, showcase in docs
4. **Community Advocacy:** Highlight Gemini users in case studies

**Timeline:**
- **Approach When:** 1,000+ GitHub stars, Gemini integration live, 50+ Gemini users tracked
- **Expected Close Time:** 4-8 months (Google's decision-making is slower)

---

#### **Target #3: GitHub (GitHub Actions / Copilot)**

**Why They Should Sponsor:**
- **GitHub Actions Usage:** agentful users run CI/CD pipelines (validation, testing, deployment)
- **Copilot Synergy:** agentful + Copilot = AI-powered development workflow
- **Open Source Mandate:** GitHub has explicit open source sponsorship program
- **Competitive Positioning:** Microsoft wants GitHub to be center of AI development

**Quantifiable ROI:**
- Avg. agentful project: 10-50 GitHub Actions minutes/day
- Avg. cost: $0.008/minute = $0.08-0.40/day per project
- 1,000 active projects = $80-400/day = $29k-146k/year Actions revenue
- **Sponsorship at $60k-120k/year = 0.41-4.14x of generated revenue**
- **Sponsorship breakeven: ~500-1,500 active projects**

**Decision Makers:**
- **Thomas Dohmke** - CEO, GitHub (sets strategic priorities)
- **Alexis Wales** - VP, Developer Relations
- **GitHub Sponsors Team** - partnerships@github.com

**Pitch Angle:**
- "agentful drives GitHub Actions usage and positions GitHub as the platform for AI-powered development."
- "GitHub should sponsor the tools that make GitHub essential for AI development."

**Outreach Strategy:**
1. **GitHub Sponsors Program:** Apply directly via GitHub Sponsors
2. **Event Sponsorship:** Attend GitHub Universe, meet DevRel team
3. **Open Source Friday:** Get featured on GitHub's Open Source Friday livestream
4. **Community Advocacy:** Encourage agentful projects to use GitHub Actions

**Timeline:**
- **Approach When:** 2,000+ GitHub stars, clear Actions usage metrics, 200+ projects using Actions
- **Expected Close Time:** 3-6 months

---

### 3.2 Secondary Targets

#### **Target #4: Vercel**

**Why:** agentful users deploy to Vercel, positioning Next.js/Vercel as preferred stack
**Sponsorship Range:** $2,500-5,000/month ($30k-60k/year)
**Decision Maker:** Guillermo Rauch (CEO), Lee Robinson (VP of DX)
**Outreach:** Apply to Vercel Open Source Program (https://vercel.com/open-source-program)

---

#### **Target #5: Netlify**

**Why:** Alternative to Vercel, wants to compete for AI developer mindshare
**Sponsorship Range:** $1,000-2,500/month ($12k-30k/year)
**Decision Maker:** Matt Biilmann (CEO), Divya Sasidharan (Developer Experience)
**Outreach:** Apply to Netlify Open Source Program

---

#### **Target #6: Supabase**

**Why:** agentful projects often need databases, Supabase wants to be default choice
**Sponsorship Range:** $1,000-2,500/month ($12k-30k/year)
**Decision Maker:** Paul Copplestone (CEO), Ant Wilson (CTO)
**Outreach:** Direct Twitter DM or partnerships@supabase.io

---

#### **Target #7: Neon**

**Why:** Serverless Postgres for AI projects, agentful positioning aligns with Neon's market
**Sponsorship Range:** $500-1,000/month ($6k-12k/year)
**Decision Maker:** Nikita Shamgunov (CEO)
**Outreach:** Apply via Neon partnerships or GitHub Sponsors

---

### 3.3 Tertiary Targets (Community Sponsors)

**Who:**
- Companies using agentful in production (YC startups, AI-first companies)
- AI consultancies building on agentful
- Universities and research labs

**Sponsorship Range:** $100-500/month
**Approach:** Email outreach, "Support the tool you rely on" messaging
**Expected Conversion:** 5-10% of heavy users

---

## 4. ROI Calculation Framework

### 4.1 Revenue Attribution Model

**Tracking Infrastructure:**

1. **User Identification:**
   - CLI telemetry (opt-in, privacy-respecting)
   - Anonymous usage IDs
   - Project initialization timestamps

2. **API Call Attribution:**
   - Track which AI model used (Claude, Gemini, etc.)
   - Estimate API token usage per session
   - Calculate estimated API cost

3. **Infrastructure Attribution:**
   - Detect GitHub Actions usage via repository analysis
   - Track deployment platform (Vercel, Netlify, etc.)
   - Estimate infrastructure costs

4. **Conversion Tracking:**
   - UTM parameters in documentation links
   - Track sign-ups from agentful → sponsor platforms
   - Measure upgrade paths (free → paid tiers)

**Implementation:**

```javascript
// Example: Track API usage in agentful CLI
const telemetry = {
  userId: 'anon_abc123', // Anonymous hash
  model: 'claude-sonnet-4.5',
  tokensUsed: 15000,
  estimatedCost: 0.75, // $0.05 per 1k tokens
  session: {
    duration: 3600, // seconds
    commands: ['/agentful-start', '/agentful-validate'],
  },
  infrastructure: {
    ci: 'github-actions',
    deployment: 'vercel',
  },
  timestamp: '2026-01-21T10:00:00Z',
};

// Send to telemetry endpoint (opt-in only)
if (user.telemetryEnabled) {
  await sendTelemetry(telemetry);
}
```

**Privacy Considerations:**
- ✅ Opt-in by default
- ✅ Anonymous user IDs
- ✅ No PII collected
- ✅ User can disable telemetry
- ✅ Data retention: 90 days
- ✅ GDPR compliant

---

### 4.2 Sponsor ROI Dashboard

**What Sponsors See (Quarterly Report):**

```
==========================================
agentful Sponsorship Report Q1 2026
==========================================

YOUR IMPACT:
- API Revenue Attributed: $127,450
- New Sign-ups Tracked: 1,247
- Conversion Rate (Free → Paid): 12.3%
- Total API Calls: 8.4M
- Avg. Cost per Call: $0.015

REACH:
- README Impressions: 347,289
- Docs Page Views: 892,341
- GitHub Stars: 4,721 (+1,203 this quarter)
- Weekly Active Projects: 2,134 (+487)

DEVELOPER DEMOGRAPHICS:
- Company Size:
  - Enterprise (1000+): 23%
  - Mid-Market (100-1000): 34%
  - Startup (<100): 43%
- Industries:
  - SaaS/Tech: 67%
  - Finance: 12%
  - Healthcare: 8%
  - Other: 13%
- Regions:
  - North America: 58%
  - Europe: 27%
  - Asia: 15%

ROI ANALYSIS:
- Sponsorship: $60,000/quarter
- Revenue Attributed: $127,450
- ROI: 2.12x
- Cost per Acquisition: $48.11
==========================================
```

---

### 4.3 ROI Calculation Formula

**For API Providers (Anthropic, Google):**

```
ROI = (Attributed API Revenue - Sponsorship Cost) / Sponsorship Cost

Example (Anthropic):
- Sponsorship: $60,000/quarter
- API Revenue: $127,450/quarter
- ROI = ($127,450 - $60,000) / $60,000 = 1.12x (112% return)
```

**For Infrastructure Providers (GitHub, Vercel):**

```
ROI = (Infrastructure Revenue + LTV of Acquired Users - Sponsorship Cost) / Sponsorship Cost

Example (GitHub):
- Sponsorship: $15,000/quarter
- Actions Revenue: $8,200/quarter
- New Team Plan Sign-ups: 23 @ $48/mo = $1,104/mo × 12 months LTV = $13,248
- Total Value: $8,200 + $13,248 = $21,448
- ROI = ($21,448 - $15,000) / $15,000 = 0.43x (43% return)

Note: Infrastructure ROI is slower but compounds over time as users stay on platform.
```

---

### 4.4 Attribution Methodology

**Challenge:** How do we prove agentful drove API usage vs. organic usage?

**Solution: Baseline + Incremental Analysis**

1. **Cohort Comparison:**
   - Group A: Users who signed up via agentful UTM links
   - Group B: Organic users (no agentful attribution)
   - Measure API usage difference between groups

2. **Time Series Analysis:**
   - Track API usage before user discovered agentful
   - Track API usage after user started using agentful
   - Calculate uplift

3. **Survey Data:**
   - Ask users: "How did you hear about [Claude/Gemini]?"
   - Track "agentful" mentions in response
   - Validate quantitative data with qualitative insights

**Conservative Attribution:**
- Attribute 50-70% of incremental usage to agentful
- Discount baseline usage (users would have used API anyway)
- Focus on net new users and usage uplift

---

## 5. Timeline & Adoption Milestones

### 5.1 Phased Sponsorship Approach

**Philosophy:** Don't approach sponsors too early. Build proof first.

---

#### **Phase 1: Foundation (Months 1-3)**

**Goals:**
- Prove product-market fit
- Build initial user base
- Establish metrics infrastructure

**Adoption Targets:**
- 500+ GitHub stars
- 100+ weekly active projects
- 50+ testimonials / success stories
- 10+ case studies published

**Funding Strategy:**
- Self-funded or angel investment
- GitHub Sponsors (individual contributors)
- No corporate sponsorships yet

**Activities:**
- Launch telemetry infrastructure (opt-in)
- Create attribution dashboard (internal)
- Document success stories
- Build community on Discord/Slack

**Do NOT approach corporate sponsors yet.** Too early. Focus on product.

---

#### **Phase 2: Traction (Months 4-6)**

**Goals:**
- Demonstrate sustained growth
- Prove revenue attribution model
- Build case for sponsorship

**Adoption Targets:**
- 2,000+ GitHub stars
- 500+ weekly active projects
- $10k+/month attributed API revenue (estimated)
- 100+ companies using agentful

**Funding Strategy:**
- Open GitHub Sponsors (organizational)
- Approach **one** primary sponsor (Anthropic)
- Target: $10k-15k/month

**Activities:**
- Create first pitch deck (Anthropic-focused)
- Reach out to Anthropic DevRel via warm intro
- Publish Q1 metrics report (public)
- Launch "Powered by agentful" showcase

**Pitch Readiness Checklist:**
- ✅ 6+ months of attribution data
- ✅ Clear ROI calculation with real numbers
- ✅ 3+ enterprise case studies
- ✅ Testimonials from known companies
- ✅ Quarterly metrics report published

---

#### **Phase 3: Scale (Months 7-12)**

**Goals:**
- Secure first major sponsor
- Expand to multiple sponsors
- Achieve funding sustainability

**Adoption Targets:**
- 5,000+ GitHub stars
- 2,000+ weekly active projects
- $50k+/month attributed API revenue
- 500+ companies using agentful

**Funding Strategy:**
- Close Anthropic sponsorship ($15-20k/month)
- Approach Google ($10-15k/month)
- Open Bronze/Silver/Gold tiers on website
- Target: $30k-40k/month total

**Activities:**
- Negotiate Anthropic contract (Q1)
- Pitch Google (Q2)
- Launch public sponsorship tiers
- Speak at AI/developer conferences
- Publish "State of AI Development" report using agentful data

---

#### **Phase 4: Maturity (Year 2+)**

**Goals:**
- Diversified sponsorship portfolio
- Sustainable funding for 2-3 full-time maintainers
- Become "default" autonomous development tool

**Adoption Targets:**
- 10,000+ GitHub stars
- 5,000+ weekly active projects
- $200k+/month attributed API revenue
- 2,000+ companies using agentful

**Funding Strategy:**
- Maintain Anthropic + Google sponsorships
- Add GitHub, Vercel, Netlify, Supabase sponsors
- Target: $60k-80k/month total
- Hire 2-3 full-time maintainers

**Activities:**
- Expand to enterprise support tier (paid support contracts)
- Create agentful certification program (revenue generator)
- Launch annual "Autonomous Development Summit" (sponsor revenue)

---

### 5.2 Metrics Thresholds for Approaching Sponsors

**When to Approach:**

| Metric | Anthropic | Google | GitHub | Vercel | Bronze Tier |
|--------|-----------|--------|--------|--------|-------------|
| GitHub Stars | 2,000+ | 3,000+ | 5,000+ | 2,000+ | 1,000+ |
| Weekly Active Projects | 500+ | 1,000+ | 2,000+ | 500+ | 200+ |
| Attributed Monthly Revenue | $10k+ | $10k+ | $5k+ | $5k+ | N/A |
| Months of Data | 6+ | 6+ | 9+ | 6+ | 3+ |
| Case Studies Published | 3+ | 3+ | 5+ | 3+ | 1+ |

**Do NOT approach sponsors if:**
- ❌ Less than 1,000 GitHub stars
- ❌ Less than 6 months of attribution data
- ❌ No clear ROI calculation
- ❌ Less than 100 active projects
- ❌ No testimonials or case studies

**Why:** Premature pitches damage credibility. Sponsors need proof, not promises.

---

## 6. Legal & Tax Considerations

### 6.1 Entity Structure Options

#### **Option A: Individual (Sole Proprietor)**

**Pros:**
- ✅ Simple setup (no paperwork)
- ✅ GitHub Sponsors direct payments
- ✅ No corporate taxes

**Cons:**
- ❌ Unlimited personal liability
- ❌ Harder to get large corporate contracts
- ❌ No tax deductions for business expenses
- ❌ Income taxed as personal income (highest rate)

**Best For:** Early stage, <$2k/month sponsorship income

---

#### **Option B: LLC (Limited Liability Company)**

**Pros:**
- ✅ Personal liability protection
- ✅ Pass-through taxation (no double tax)
- ✅ Professional appearance for corporate sponsors
- ✅ Can elect S-Corp status for tax savings
- ✅ Business expense deductions

**Cons:**
- ❌ Annual filing fees ($800+ in California)
- ❌ Requires registered agent
- ❌ More complex accounting

**Best For:** $2k-10k/month sponsorship income

**Setup Cost:** $500-1,500 (legal + filing fees)
**Annual Cost:** $800-2,000 (state fees + registered agent)

---

#### **Option C: Fiscal Sponsorship (Open Source Collective / Open Collective Foundation)**

**Pros:**
- ✅ No need to create separate legal entity
- ✅ 501(c)(6) or 501(c)(3) status (tax-deductible donations for sponsors)
- ✅ Handles taxes, accounting, 1099s automatically
- ✅ Transparent budget (community trust)
- ✅ Invoices for corporate sponsors (required for vendor systems)
- ✅ International payments supported

**Cons:**
- ❌ 10% platform fee (Open Source Collective)
- ❌ Less control over funds
- ❌ Delays in payouts (15-30 days)
- ❌ Must align with OSC/OCF mission

**Best For:** Projects wanting 501(c) status, international sponsors, transparency

**Setup Cost:** $0
**Ongoing Cost:** 10% of donations

**Recommended Entity:** **Open Source Collective** (501(c)(6))
- Most OSS projects use this (ESLint, Babel, Webpack)
- Corporate sponsors can write off as business expense
- No personal tax burden
- Professional invoicing for enterprise sponsors

---

#### **Option D: 501(c)(3) Foundation (e.g., Open Collective Foundation)**

**Pros:**
- ✅ Tax-deductible donations (sponsors get tax write-off)
- ✅ Grants and foundation funding eligible
- ✅ Maximum credibility

**Cons:**
- ❌ Strict IRS rules (must be charitable/educational)
- ❌ Cannot benefit private individuals
- ❌ Harder to pay maintainers competitively
- ❌ More paperwork and compliance

**Best For:** Projects focused on education, research, or public good (not agentful)

---

### 6.2 Recommended Structure for agentful

**Phase 1 (0-6 months, <$5k/month):**
- **Individual + GitHub Sponsors**
- No entity needed
- Simple, fast setup
- Pay personal income tax

**Phase 2 (6-18 months, $5k-20k/month):**
- **Open Source Collective (501(c)(6))**
- Professional invoicing for corporate sponsors
- Transparent budget builds trust
- Handles all tax compliance
- 10% fee is acceptable trade-off

**Phase 3 (18+ months, $20k+/month):**
- **Consider LLC (Delaware or Wyoming)**
- Better for large contracts ($100k+/year)
- More control over funds
- Can elect S-Corp for tax savings
- Hire accountant and lawyer

**Final Recommendation:** Start with **Open Source Collective** once corporate sponsors are imminent (Phase 2). It provides legitimacy, tax benefits, and reduces admin burden.

---

### 6.3 Tax Considerations

#### **Individual Income:**
- Sponsorship = self-employment income
- Subject to income tax + self-employment tax (15.3%)
- Quarterly estimated tax payments required
- Deductions: Home office, equipment, software

#### **LLC (Single-Member):**
- Pass-through taxation (same as individual)
- Option to elect S-Corp status at $50k+/year income to save on self-employment tax

#### **Open Source Collective:**
- No personal tax burden (OSC is tax-paying entity)
- Maintainers paid as contractors (1099)
- OSC handles all tax forms

#### **International Sponsors:**
- US-based entity required for many international companies
- Open Source Collective simplifies cross-border payments
- Avoids currency conversion issues

---

### 6.4 Contract Templates

#### **Sponsorship Agreement Template (Annual)**

```
OPEN SOURCE PROJECT SPONSORSHIP AGREEMENT

This Agreement is entered into as of [DATE] between:

SPONSOR: [Company Name]
Address: [Address]
Contact: [Name, Title]

PROJECT: agentful (maintained by [Entity Name])
Address: [Address]
Contact: [Name]

1. SPONSORSHIP TIER: [Platinum/Gold/Silver/Bronze]

2. SPONSORSHIP AMOUNT: $[AMOUNT] per [month/year]

3. PAYMENT TERMS:
   - Invoices sent [monthly/quarterly/annually]
   - Payment due within 30 days of invoice
   - Payment method: [Wire transfer/ACH/Check]

4. SPONSORSHIP BENEFITS:
   [List specific benefits from tier]

5. TERM:
   - Start Date: [DATE]
   - End Date: [DATE]
   - Auto-renewal: [Yes/No]

6. TERMINATION:
   - Either party may terminate with 30 days written notice
   - No refunds for partial periods

7. INTELLECTUAL PROPERTY:
   - Sponsor grants agentful license to use logo/trademark for sponsorship purposes
   - agentful remains open source under [LICENSE]

8. NO ENDORSEMENT:
   - Sponsorship does not imply endorsement of Sponsor's products

9. REPORTING:
   - Quarterly metrics reports provided to Sponsor
   - Confidential data (if any) subject to NDA

10. GOVERNING LAW: [State/Country]

SIGNATURES:

Sponsor: _____________________ Date: _______
agentful: _____________________ Date: _______
```

---

#### **Monthly Sponsorship Agreement (Flexible)**

For smaller sponsors on GitHub Sponsors / Open Collective:

```
RECURRING SPONSORSHIP AGREEMENT

Sponsor: [Company Name]
Project: agentful
Tier: [Bronze/Silver/Gold]
Amount: $[AMOUNT]/month

Benefits: [List]

Term: Month-to-month, cancel anytime with 7 days notice.

By sponsoring via [GitHub Sponsors / Open Collective],
Sponsor agrees to these terms.
```

---

### 6.5 Platform Comparison

| Platform | Fees | Best For | Invoicing | Tax Handling |
|----------|------|----------|-----------|--------------|
| **GitHub Sponsors** | 0% | Individual developers, small sponsors | No (sponsors need receipt manually) | No (you handle) |
| **Open Collective** | 10% | Transparent budgets, community trust | Yes (automatic) | Yes (fiscal host handles) |
| **Patreon** | 5-12% | Creator-focused, perks-based tiers | No | No |
| **Direct Contracts** | 0% | Large corporate sponsors ($50k+/year) | Yes (you send invoices) | Yes (you handle) |

**Recommended Multi-Platform Strategy:**

1. **Open Source Collective** → Primary platform for corporate sponsors ($1k+/month)
2. **GitHub Sponsors** → Supplement for individual backers ($5-100/month)
3. **Direct Contracts** → Major sponsors ($10k+/month, e.g., Anthropic, Google)

**Why Multi-Platform?**
- Some companies prefer GitHub Sponsors (easy internal approval)
- Some require invoices (Open Collective or direct contract)
- Diversification reduces platform risk

---

## 7. Pitch Deck Templates

### 7.1 Master Pitch Deck Structure

**Slide 1: Cover**
```
agentful
Open Source Sponsorship Proposal

[Logo]

Prepared for: [Company Name]
Date: [Date]
```

---

**Slide 2: The Problem**
```
AI-Powered Development is Exploding
But Tools Are Fragmented

• 73% of developers use AI coding assistants (GitHub Copilot, Cursor)
• No unified framework for autonomous product development
• Manual orchestration of architecture, coding, testing, deployment
• 80% of developer time spent on undifferentiated work

[Chart: Growth of AI development tools 2023-2026]
```

---

**Slide 3: The Solution**
```
agentful: The First Autonomous Product Development Framework

What is agentful?
• Specialized AI agents (architect, backend, frontend, tester, reviewer)
• Reads product specs, generates architecture, writes code, runs tests
• Human-in-the-loop for key decisions
• Open source, tech-stack agnostic

[Screenshot: agentful CLI in action]

Used by: [Logos of companies using agentful]
```

---

**Slide 4: Traction**
```
Rapid Adoption by Engineering Leaders

• [2,000+] GitHub stars (launched [X months ago])
• [500+] active projects per week
• [100+] companies in production
• [50+] published case studies

Community:
• [5,000+] Discord members
• [10,000+] npm downloads/month
• [200+] contributors

[Chart: GitHub stars over time, exponential growth]
```

---

**Slide 5: Why This Matters to [Sponsor Company]**
```
agentful Drives Direct Revenue to [Sponsor]

Every agentful user generates:
• [X] API calls per session
• $[Y] in estimated API costs
• [Z] incremental usage vs. non-agentful users

[Chart: API usage comparison - agentful users vs. baseline]

Attribution: 100% tracked via telemetry + UTM parameters
```

---

**Slide 6: Revenue Attribution Model**
```
How We Measure Your ROI

1. User Tracking (opt-in, privacy-respecting)
   → Anonymous IDs, no PII

2. API Call Attribution
   → Model used, tokens, estimated cost

3. Conversion Tracking
   → UTM links in docs
   → Sign-ups from agentful → [Sponsor]

4. Quarterly Reports
   → Revenue attributed
   → New users acquired
   → ROI calculation

[Diagram: Data flow from agentful CLI → telemetry → sponsor dashboard]
```

---

**Slide 7: Your ROI**
```
Sponsorship is an Investment, Not a Donation

Sponsorship: $[X]/month ($[Y]/year)

Projected Returns:
• API Revenue: $[A]/month
• New Sign-ups: [B] users/month
• Conversion Rate: [C]%
• ROI: [D]x

Breakeven: [E] active users (we're at [F] today)

[Chart: Projected revenue over 12 months]
```

---

**Slide 8: Sponsorship Benefits**
```
What You Get

Visibility:
• Logo on homepage, README, docs
• [500k+] impressions/year
• Mention in all release announcements

Strategic:
• Quarterly metrics dashboard
• Direct line to maintainers
• Priority feature requests
• Co-marketing opportunities

Competitive:
• Position as leader in AI developer tools
• Differentiation from [Competitor]

[Table: Benefit breakdown by tier]
```

---

**Slide 9: Case Studies**
```
Companies Building with agentful

[Case Study 1: Company A]
• Built [Product] in 30 days with agentful
• 10x faster than manual development
• Using [Sponsor's product]

[Case Study 2: Company B]
• Migrated legacy app to modern stack
• agentful handled 80% of code generation
• $50k+ in API costs to [Sponsor]

[Case Study 3: Company C]
• Early-stage startup, shipped MVP in 2 weeks
• [Sponsor] API was critical infrastructure

[Logos + testimonials]
```

---

**Slide 10: Roadmap**
```
Where We're Going

Q1 2026:
• Multi-model support (Gemini, Grok, Claude)
• Enterprise features (SSO, audit logs)
• VS Code extension

Q2 2026:
• Cloud platform (hosted agentful)
• Team collaboration features
• Integration marketplace

Q3 2026:
• Certification program
• Annual conference (sponsorship opportunities)

[Your sponsorship funds these milestones]
```

---

**Slide 11: Team & Community**
```
Maintained by [Your Name/Team]

Background:
• [Experience]
• [Previous companies/projects]
• [Relevant expertise]

Community Contributors:
• [200+] active contributors
• [50+] companies contributing code
• [10] core maintainers

Open Source Principles:
• MIT License
• Transparent roadmap
• Community-driven decisions

[Photos/headshots]
```

---

**Slide 12: Ask**
```
Let's Partner to Build the Future of AI Development

Sponsorship Request:
• Tier: [Platinum/Gold/Silver]
• Amount: $[X]/month ($[Y]/year)
• Start Date: [Date]

Next Steps:
1. Review this proposal
2. Schedule follow-up call
3. Negotiate terms
4. Sign agreement

Contact:
[Name]
[Email]
[Phone]

Thank You.
```

---

### 7.2 Anthropic-Specific Pitch Deck (Customizations)

**Slide 5 (Why This Matters to Anthropic):**
```
agentful Positions Claude as the Default Model for Autonomous Development

Market Opportunity:
• 5M+ developers using AI coding tools
• $10B+ market for AI developer tools by 2027
• Winner will be model with best ecosystem

Strategic Positioning:
• Next.js is to Vercel as agentful is to Claude
• Vercel owns Next.js → Vercel owns frontend deployment
• Anthropic sponsors agentful → Claude owns autonomous dev

Competitive Threat:
• If OpenAI sponsors a competing framework, you lose market
• Sponsorship is defensive as much as offensive

[Chart: Model usage in AI development tools - Claude leads, but OpenAI catching up]
```

---

**Slide 9 (Anthropic Case Studies):**
```
agentful Users Love Claude

"Claude's long context windows make agentful possible.
We can feed entire codebases to the architect agent."
— [Company A, CTO]

"Tried GPT-4 and Gemini. Claude wins on code quality
and understanding of complex systems."
— [Company B, Lead Engineer]

"We've spent $15k on Claude API in 3 months thanks to agentful.
Worth every penny."
— [Company C, Founder]

[Testimonial screenshots from Twitter/LinkedIn]
```

---

**Slide 12 (Ask - Anthropic-Specific):**
```
Let's Make Claude the Model of Choice for Autonomous Development

Sponsorship Request:
• Tier: Platinum Sponsor
• Amount: $20,000/month ($240,000/year)
• Start Date: Q2 2026

What You Get:
• Exclusive "Powered by Claude" branding in CLI
• Quarterly executive briefings
• Priority feature development
• Co-marketing campaigns
• Speaking slots at Anthropic events

Expected ROI:
• $500k-1M+ in attributed API revenue (Year 1)
• 2-4x return on sponsorship investment

Next Steps:
• Call with [Jack Clark / Scott White / Zac Hatfield-Dodds]
• Review attribution dashboard (live demo)
• Negotiate contract terms

[CTA: Let's schedule a call this week]
```

---

### 7.3 Supporting Materials

**Appendix Slide 1: Telemetry & Privacy**
```
How We Track Attribution (Privacy-First)

What We Track:
✅ Model used (Claude, Gemini, etc.)
✅ Token usage (estimated)
✅ Session duration
✅ Commands run
✅ Infrastructure (CI/CD, deployment platform)

What We DON'T Track:
❌ Code content
❌ Project names
❌ User identity (beyond anonymous ID)
❌ Personal information

Compliance:
✅ GDPR compliant
✅ Opt-in by default
✅ User can disable telemetry anytime
✅ Data retention: 90 days

[Screenshot: Privacy policy excerpt]
```

---

**Appendix Slide 2: Competitive Landscape**
```
agentful vs. Alternatives

| Tool | Scope | Model Support | Open Source |
|------|-------|---------------|-------------|
| agentful | Full product dev | Multi-model | Yes (MIT) |
| Cursor | Code editor | GPT-4 only | No |
| GitHub Copilot | Code completion | GPT-4 only | No |
| Replit Agent | Single files | GPT-4 only | No |
| Devin (Cognition) | Full product dev | Proprietary | No |

Advantages:
• Only open source full-stack autonomous framework
• Tech-stack agnostic
• Multi-model support (coming Q1 2026)
• Community-driven (not VC-backed black box)

[Chart: Comparison matrix]
```

---

**Appendix Slide 3: Financial Projections**
```
Revenue Attribution Forecast

Assumptions:
• Growth: 50% QoQ (conservative)
• Active Projects: [Current] → [Projected 12 months]
• API Usage per Project: $10/week
• Conversion Rate: 15% (free → paid tier)

Projected Attributed Revenue (Anthropic):
• Q2 2026: $50k
• Q3 2026: $125k
• Q4 2026: $315k
• Q1 2027: $790k

Your Sponsorship: $240k/year
Your Return: $1.28M (Year 1)
ROI: 5.3x

[Chart: Cumulative attributed revenue over time]

Note: Conservative estimates. Actual could be 2-3x higher.
```

---

## 8. Outreach & Execution Plan

### 8.1 Pre-Outreach Checklist

**Before Reaching Out to Any Sponsor:**

- [ ] GitHub stars > [threshold for sponsor tier]
- [ ] 6+ months of attribution data
- [ ] Telemetry infrastructure live and tested
- [ ] 3+ case studies published on website
- [ ] 10+ testimonials collected
- [ ] Quarterly metrics report published (public or private)
- [ ] Pitch deck customized for sponsor
- [ ] ROI calculation validated with real data
- [ ] Website has dedicated "/sponsors" page
- [ ] Blog post announcing sponsorship program
- [ ] Video demo of agentful in action (<3 min)
- [ ] FAQ document addressing common sponsor questions

**If ANY of these are missing, do not reach out yet.** You will damage credibility.

---

### 8.2 Outreach Sequence (Warm Intro Path)

**Best Path: Warm Introduction**

**Step 1: Identify Connector (Week 1)**
- Look for mutual connections on LinkedIn
- Check if anyone in your network works at sponsor company
- Reach out to YC alumni / founder network
- Attend AI/dev conferences where sponsor employees present

**Step 2: Request Introduction (Week 1)**
```
Email to Connector:

Subject: Quick intro request - agentful sponsorship

Hi [Connector Name],

Hope you're doing well! I'm working on agentful, an open-source
autonomous development framework that's gaining traction
(2k+ GitHub stars, 500+ active projects).

I'm exploring corporate sponsorships and wanted to connect
with someone at [Sponsor Company] on the [Developer Relations /
Partnerships] team. I noticed you know [Decision Maker].

Would you be open to making an introduction? I have a clear
ROI case showing how agentful drives [API revenue / infrastructure
usage] for [Sponsor].

Happy to send more context. Thanks!

[Your Name]
[Title]
[agentful.app]
```

**Step 3: Warm Intro Happens (Week 2)**
- Connector introduces you via email
- Respond within 24 hours
- Keep initial email SHORT (3-4 sentences)

**Step 4: Initial Outreach to Decision Maker (Week 2)**
```
Email to Decision Maker:

Subject: agentful sponsorship proposal (intro from [Connector])

Hi [Decision Maker],

Thanks to [Connector] for the intro!

I'm [Your Name], maintainer of agentful - an open-source autonomous
development framework. We have 2k+ GitHub stars and 500+ active
projects.

Here's why this matters to [Sponsor Company]:
• agentful drives $50k+/month in API revenue to [Sponsor]
• We track 100% attribution (telemetry + UTM)
• Sponsorship = 3-5x ROI based on our data

I'd love to share a 15-minute pitch deck showing:
1. Our traction and growth
2. How we attribute revenue to [Sponsor]
3. Sponsorship tiers and benefits

Are you open to a quick call next week?

[Your Name]
[Title]
[Email] | [Phone]
[agentful.app]

P.S. Attaching one-pager with key metrics.
```

**Step 5: Follow-Up (Week 3)**
- If no response in 5 business days, send one follow-up
- If still no response, try different contact at company
- If no response after 2 attempts, move on (revisit in 3-6 months)

---

### 8.3 Outreach Sequence (Cold Outreach Path)

**Use Only If Warm Intro Not Possible**

**Step 1: Public Visibility (Ongoing)**
- Tweet about agentful metrics, tag @[SponsorCompany]
- Publish blog post: "How agentful drives [X] API calls to [Sponsor]"
- Get featured on Hacker News, Product Hunt, Reddit
- Speak at conferences where sponsor employees attend

**Step 2: Email to General Partnerships Inbox**
```
Email to partnerships@[sponsor].com:

Subject: Open source sponsorship proposal - agentful

Hi [Sponsor] Partnerships Team,

I'm [Your Name], maintainer of agentful, an open-source autonomous
development framework (MIT License).

Quick stats:
• 2,000+ GitHub stars
• 500+ active projects/week
• 100+ companies in production

Why this matters to [Sponsor]:
We've tracked $50k+/month in API revenue attributed to agentful users.
Our telemetry shows agentful drives [X] new sign-ups and [Y] API usage
uplift for [Sponsor] customers.

I'd love to discuss a sponsorship partnership. We offer:
• Revenue attribution dashboard (you see your ROI)
• Logo placement (docs, README, homepage)
• Quarterly metrics reports
• Co-marketing opportunities

Can we schedule a 15-minute call to explore this?

[Pitch deck attached]

[Your Name]
[agentful.app]
```

**Step 3: LinkedIn Outreach (Parallel Track)**
- Find decision maker on LinkedIn (VP of DevRel, Head of Partnerships)
- Send connection request with note:
```
Hi [Name], I'm working on agentful, an OSS autonomous dev
framework. We're driving significant API usage to [Sponsor]
and exploring sponsorships. Would love to connect!
```

**Step 4: Multi-Channel Follow-Up**
- Day 5: Email follow-up
- Day 10: LinkedIn message
- Day 15: Twitter DM (if decision maker active on Twitter)
- Day 20: Final email, then pause

**Step 5: Retry After Traction Milestone**
- If rejected or no response, revisit in 6 months
- Show new metrics: "We've grown from 2k → 5k stars, $50k → $150k attributed revenue"

---

### 8.4 Call Structure (Sponsor Discovery Call)

**Goal:** Qualify sponsor interest, understand their needs, present high-level case

**Agenda (30 minutes):**

**1. Intro (3 min)**
- "Thanks for taking the time. I'm [Your Name], maintainer of agentful."
- "We're an open-source autonomous development framework used by 500+ projects."
- "Today I want to show how agentful drives revenue to [Sponsor] and explore a sponsorship partnership."

**2. Understand Sponsor's Goals (5 min)**
- "Before I dive in, what are your goals for open source sponsorships?"
- "How do you typically measure ROI on developer tools sponsorships?"
- "What would make this a no-brainer for you?"

**Take notes. Tailor pitch to their answers.**

**3. Present agentful (5 min)**
- "Here's what agentful does..." [Demo or screenshare]
- "We've grown to [X] stars, [Y] active projects in [Z] months."
- "Our users are primarily [CTOs, engineering leads, startups]."

**4. Show Revenue Attribution (7 min)**
- "Here's why this matters to [Sponsor]..."
- [Screenshare: Attribution dashboard]
- "We've tracked $[X] in API revenue attributable to agentful."
- "Our users generate [Y] API calls per session, vs. [Z] baseline."
- "We use telemetry + UTM tracking, 100% transparent."

**5. Sponsorship Tiers (5 min)**
- "We offer [Platinum/Gold/Silver/Bronze] sponsorship tiers."
- "For [Sponsor], we recommend [Tier] at $[X]/month."
- "You'd get: [list benefits]"
- "Projected ROI: [Y]x based on our data."

**6. Q&A (5 min)**
- "What questions do you have?"
- "What would you need to see to move forward?"
- "Who else needs to be involved in this decision?"

**7. Next Steps (2 min)**
- "If this sounds interesting, here's what I propose:"
  - "I'll send a formal proposal by [date]"
  - "We schedule a follow-up call with [other stakeholders]"
  - "We aim to finalize agreement by [date]"
- "Does that work for you?"

**Close:**
- "Thanks again for your time. I'll follow up with [deliverable] by [date]."

---

### 8.5 Negotiation Tips

**Common Objections & Responses:**

**Objection 1: "We don't have budget for this."**
Response:
- "I understand budget is tight. Let's look at the ROI: we're attributing $[X] in revenue to you monthly. Even a $[Y] sponsorship is [Z]% of that, which is a fantastic return."
- "Can we start with a smaller tier (Bronze at $1k/month) and scale up once you see results?"
- "When does your next budget cycle start? Can we plan for Q[X]?"

**Objection 2: "How do you prove attribution?"**
Response:
- "Great question. We use three methods:"
  1. "Telemetry: We track which model users choose (opt-in, privacy-respecting)"
  2. "UTM links: We track sign-ups from agentful docs to your platform"
  3. "Surveys: We ask users how they discovered you (qualitative validation)"
- "I can show you our live dashboard right now." [Screenshare]

**Objection 3: "We already sponsor a lot of OSS projects."**
Response:
- "That's great, and it shows your commitment to open source. What differentiates agentful is direct revenue attribution. Most projects offer brand awareness—we offer measurable ROI."
- "Can I show you how much revenue we're driving vs. other projects you sponsor?"

**Objection 4: "We need to see more traction first."**
Response:
- "Totally fair. What metrics would you need to see to move forward?"
- [Take notes, follow up when metrics hit target]
- "Can we do a smaller pilot sponsorship (3 months, Bronze tier) to prove the model?"

**Objection 5: "We'd rather just donate via GitHub Sponsors."**
Response:
- "GitHub Sponsors is great for smaller amounts. For a strategic partnership like this, we recommend a direct agreement so we can provide:"
  - "Custom ROI dashboard"
  - "Quarterly executive briefings"
  - "Priority feature development"
  - "Co-marketing opportunities"
- "We can still accept payment via GitHub Sponsors if that's easier for your procurement team."

---

**Negotiation Tactics:**

**Tactic 1: Anchor High**
- Start with Platinum tier pricing
- Let them negotiate down to Gold (which was your target anyway)

**Tactic 2: Pilot Program**
- Offer 3-month pilot at reduced rate
- "Try it risk-free. If you don't see ROI, cancel anytime."

**Tactic 3: Bundling**
- "For $15k/month, we can include [extra benefit, e.g., custom integration]"
- Makes sponsor feel they're getting a deal

**Tactic 4: Scarcity**
- "We're only taking 3 Platinum sponsors to maintain exclusivity."
- "If you sign by [date], we can lock in this pricing before we raise rates in Q[X]."

**Tactic 5: Social Proof**
- "We're in advanced talks with [Competitor]. If they sign first, you'll miss the positioning opportunity."

---

### 8.6 Post-Outreach CRM

**Track Every Interaction:**

Use a simple CRM (Airtable, Notion, or Google Sheets):

| Company | Contact | Title | Stage | Last Contact | Next Step | Notes |
|---------|---------|-------|-------|--------------|-----------|-------|
| Anthropic | Scott White | Head of DevRel | Discovery Call | 2026-01-15 | Send proposal by 2026-01-20 | Excited about ROI model |
| Google | Jeanine Banks | VP DevRel | Outreach | 2026-01-10 | Follow up 2026-01-20 | No response yet |
| GitHub | Alexis Wales | VP DevRel | Intro Requested | 2026-01-18 | Wait for intro from [Connector] | Warm intro in progress |

**Stages:**
1. **Target** - Identified, not contacted yet
2. **Outreach** - Initial email sent, awaiting response
3. **Discovery Call** - First call scheduled or completed
4. **Proposal Sent** - Formal proposal delivered
5. **Negotiation** - Discussing terms, pricing
6. **Contract** - Agreement being drafted/reviewed
7. **Signed** - Active sponsor
8. **Rejected** - Passed for now (revisit in 6 months)

**Automate Follow-Ups:**
- Set calendar reminders for follow-ups
- Use email tracking (Mailtrack, HubSpot) to see when emails are opened
- Schedule quarterly check-ins with warm leads

---

## 9. Measurement & Reporting

### 9.1 Internal Metrics Dashboard

**Track Weekly:**
- GitHub stars (total + weekly growth)
- Active projects (unique projects running agentful per week)
- New projects initialized (first-time users)
- API calls generated (by model: Claude, Gemini, etc.)
- Estimated API revenue (total + by sponsor)
- Infrastructure usage (GitHub Actions minutes, deployment platform)
- Conversion events (sign-ups from agentful → sponsor platforms via UTM)

**Track Monthly:**
- Total companies using agentful (estimate via domain analysis)
- Case studies published
- Testimonials collected
- Blog post traffic
- Newsletter subscribers
- Discord/Slack community size

**Track Quarterly:**
- Revenue attributed to each sponsor
- ROI delivered per sponsor
- Sponsor retention rate
- Fundraising pipeline (sponsors in negotiation)

**Tools:**
- **Analytics:** Mixpanel, Amplitude, or custom database
- **Attribution:** UTM parameters in all links, captured in CRM
- **Telemetry:** Custom Node.js service (opt-in)
- **Dashboards:** Grafana, Metabase, or custom React app

---

### 9.2 Sponsor Reporting Template

**Quarterly Report to Sponsors:**

```
==========================================
agentful Sponsorship Report: Q1 2026
For: [Sponsor Company Name]
Prepared: [Date]
==========================================

EXECUTIVE SUMMARY
Your sponsorship of agentful generated an estimated
$127,450 in API revenue this quarter, delivering a
2.1x ROI on your $60,000 sponsorship.

==========================================
YOUR IMPACT
==========================================

API Revenue Attributed:
• Total API Calls: 8,423,291
• Avg. Cost per Call: $0.0151
• Total Revenue: $127,450
• Growth vs. Last Quarter: +43%

New Users Acquired:
• Sign-ups from agentful: 1,247
• Conversion Rate (Free → Paid): 12.3%
• Lifetime Value (est.): $1,890 per user
• Total LTV: $2,356,830

Infrastructure Usage:
• GitHub Actions Minutes: 2.4M
• Avg. Cost per Minute: $0.008
• Total Infrastructure Revenue: $19,200

ROI Calculation:
• Sponsorship Investment: $60,000
• Revenue Attributed: $127,450
• Return: $67,450 (112% ROI)
• ROI Multiple: 2.1x

==========================================
REACH & VISIBILITY
==========================================

Your Brand Exposure:
• README Impressions: 347,289 (GitHub visitors)
• Docs Page Views: 892,341
• Homepage Visits: 124,567
• Total Impressions: 1,364,197

Social Media Mentions:
• Twitter: 42 mentions, 127k impressions
• LinkedIn: 18 posts, 84k impressions
• Blog posts featuring you: 3

==========================================
PROJECT GROWTH
==========================================

Adoption Metrics:
• GitHub Stars: 4,721 (+1,203 this quarter)
• Active Projects: 2,134/week (+487 vs. last quarter)
• New Projects Initialized: 789 this quarter
• Community Size: 6,234 Discord members (+1,456)

Developer Demographics:
• Company Size:
  - Enterprise (1000+): 23%
  - Mid-Market (100-1000): 34%
  - Startup (<100): 43%
• Industries:
  - SaaS/Tech: 67%
  - Finance: 12%
  - Healthcare: 8%
  - Other: 13%
• Regions:
  - North America: 58%
  - Europe: 27%
  - Asia: 15%

==========================================
CASE STUDIES & TESTIMONIALS
==========================================

Featured Case Studies:
1. [Company A]: Built SaaS MVP in 30 days using agentful + [Sponsor]
2. [Company B]: Migrated legacy app to modern stack, $50k API spend
3. [Company C]: Early-stage startup shipped product 10x faster

New Testimonials:
• "agentful + [Sponsor] is our entire development stack. Game-changer."
  — [Name, Title, Company]
• "[Sponsor]'s API made agentful possible. Best investment we made."
  — [Name, Title, Company]

==========================================
ROADMAP UPDATE
==========================================

Completed This Quarter:
✅ Multi-model support (Claude, Gemini, GPT-4)
✅ VS Code extension launched
✅ Improved attribution dashboard

Coming Next Quarter:
• Enterprise features (SSO, audit logs)
• Integration marketplace
• Team collaboration features
• Annual conference (Q3)

==========================================
THANK YOU
==========================================

Your sponsorship makes agentful possible and helps
thousands of developers build better software faster.

We're grateful for your partnership and excited to
continue growing together.

Questions or feedback? Contact:
[Your Name]
[Email]
[Phone]

==========================================
```

---

### 9.3 Public Transparency Report

**Annual Transparency Report (Published on Website):**

```
# agentful 2026 Transparency Report

## Overview
This report provides full transparency into agentful's
funding, expenses, and impact.

## Funding Sources
- **Corporate Sponsorships:** $540,000 (72%)
- **Individual Sponsors:** $48,000 (6%)
- **Grants:** $50,000 (7%)
- **Consulting/Support:** $112,000 (15%)

**Total:** $750,000

## Expenses
- **Maintainer Salaries:** $480,000 (64%)
  - 4 full-time maintainers @ $120k/year avg.
- **Infrastructure:** $36,000 (5%)
  - Hosting, CI/CD, telemetry, docs
- **Marketing/Events:** $72,000 (10%)
  - Conferences, swag, ads
- **Legal/Accounting:** $24,000 (3%)
- **Platform Fees (Open Collective):** $54,000 (7%)
- **Reserves:** $84,000 (11%)

**Total:** $750,000

## Impact
- **Projects Using agentful:** 10,000+
- **API Revenue Generated (all providers):** $5.2M
- **GitHub Stars:** 12,450
- **Contributors:** 347

## Sponsors
### Platinum
- [Sponsor 1]
- [Sponsor 2]

### Gold
- [Sponsor 3]
- [Sponsor 4]

### Silver
- [Sponsor 5-8]

### Bronze
- [Sponsor 9-15]

[View full sponsor list →]

## 2027 Goals
- Grow to 50,000 active projects
- Hire 2 more maintainers
- Launch agentful certification program
- Host first annual conference

Thank you to our sponsors and community! ❤️
```

**Why Transparency?**
- Builds trust with community
- Shows sponsors their money is well-spent
- Differentiates from black-box VC-funded projects
- Encourages more sponsorships (social proof)

---

### 9.4 Key Performance Indicators (KPIs)

**Primary KPIs (Track Monthly):**

1. **Monthly Recurring Revenue (MRR):** Total sponsorship income per month
   - **Target Year 1:** $30k/month
   - **Target Year 2:** $80k/month

2. **Attributed Revenue per Sponsor:** Revenue generated for sponsor vs. sponsorship cost
   - **Target:** >2x ROI for all sponsors

3. **Active Projects (Weekly):** Unique projects running agentful per week
   - **Target Year 1:** 2,000/week
   - **Target Year 2:** 10,000/week

4. **GitHub Stars Growth:** Net new stars per month
   - **Target Year 1:** 500/month
   - **Target Year 2:** 1,000/month

5. **Sponsor Retention Rate:** % of sponsors who renew annually
   - **Target:** >90%

**Secondary KPIs:**

6. **API Calls Generated (Total):** Across all models
7. **Conversion Rate (Free → Paid):** % of users who upgrade to paid sponsor platform tiers
8. **Case Studies Published:** Quarterly target = 3
9. **Community Growth:** Discord members, newsletter subscribers
10. **Average Deal Size:** Mean sponsorship amount
11. **Sales Cycle Length:** Days from first contact → signed deal

---

### 9.5 Attribution Methodology Deep Dive

**Challenge:** Proving causation (agentful → sponsor revenue) vs. correlation

**Solution: Multi-Method Attribution**

#### **Method 1: Direct Tracking (Quantitative)**

**Implementation:**
1. User runs agentful CLI
2. CLI sends telemetry (if opted in):
   ```json
   {
     "userId": "anon_abc123",
     "model": "claude-sonnet-4.5",
     "tokensUsed": 15000,
     "session": { "duration": 3600, "commands": [...] }
   }
   ```
3. Aggregate by model, calculate estimated revenue

**Pros:**
- ✅ Direct measurement
- ✅ Real-time data
- ✅ Granular (per-session)

**Cons:**
- ❌ Requires opt-in (not all users enable telemetry)
- ❌ Estimates (we don't know actual sponsor revenue)

---

#### **Method 2: UTM Attribution (Quantitative)**

**Implementation:**
1. All links in docs use UTM parameters:
   ```
   https://claude.ai/?utm_source=agentful&utm_medium=docs&utm_campaign=sponsorship
   ```
2. Sponsor tracks conversions via UTM in their analytics
3. We receive quarterly report: "X users signed up, Y converted to paid"

**Pros:**
- ✅ Standard marketing practice
- ✅ Sponsor can validate in their own systems
- ✅ Tracks full funnel (visit → sign-up → paid)

**Cons:**
- ❌ Not all users click docs links
- ❌ UTM can be stripped by ad blockers

---

#### **Method 3: Cohort Analysis (Quantitative)**

**Implementation:**
1. Compare two cohorts:
   - **Cohort A:** Users who discovered sponsor via agentful (UTM-tracked)
   - **Cohort B:** Organic users (no agentful attribution)
2. Measure difference in API usage, LTV
3. Attribute uplift to agentful

**Pros:**
- ✅ Isolates agentful's impact
- ✅ Scientifically rigorous

**Cons:**
- ❌ Requires sponsor to run analysis (not all will)
- ❌ Takes months to collect statistically significant data

---

#### **Method 4: Surveys (Qualitative)**

**Implementation:**
1. Quarterly survey to agentful users: "How did you hear about [Sponsor]?"
2. Options: agentful docs, agentful community, conference, search, other
3. Track % who mention agentful

**Pros:**
- ✅ Validates quantitative data
- ✅ Simple to implement

**Cons:**
- ❌ Self-reported (bias)
- ❌ Low response rate

---

#### **Combined Attribution Score:**

For each sponsor, calculate:

```
Attribution Confidence Score =
  (Direct Tracking Weight × Direct Tracking %) +
  (UTM Attribution Weight × UTM %) +
  (Cohort Analysis Weight × Cohort Uplift %) +
  (Survey Weight × Survey %)

Weights (suggested):
- Direct Tracking: 40%
- UTM Attribution: 30%
- Cohort Analysis: 20%
- Survey: 10%

Example:
- Direct Tracking: 60% of users opted in
- UTM Attribution: 25% of sign-ups had agentful UTM
- Cohort Analysis: 35% uplift in usage for agentful cohort
- Survey: 40% of respondents mentioned agentful

Score = (0.4 × 60%) + (0.3 × 25%) + (0.2 × 35%) + (0.1 × 40%)
      = 24% + 7.5% + 7% + 4%
      = 42.5%

Interpretation: We attribute 42.5% of [Sponsor]'s new user revenue to agentful.
```

**Recommendation:** Use conservative attribution (30-50%) to maintain sponsor trust. Under-promise, over-deliver.

---

## 10. Appendix: Case Studies

### 10.1 Case Study: Vue.js (Evan You)

**Model:** Individual Creator, Multi-Platform Sponsorship

**Timeline:**
- **2014:** Vue.js launched
- **2016:** Evan goes full-time on Vue, $4k/month from Patreon + corporate sponsor
- **2018:** Grows to $16k/month on Patreon alone
- **2025:** $400k+/year from GitHub Sponsors, Patreon, educational partnerships

**Key Success Factors:**
1. **Personal Brand:** Evan You === Vue.js (inseparable)
2. **Consistent Shipping:** Weekly releases, transparent roadmap
3. **Community Focus:** Responsive to feedback, inclusive governance
4. **Diversified Income:** Not reliant on single platform or sponsor
5. **Long-Term Commitment:** 10+ years of consistent work

**Lessons for agentful:**
- ✅ Diversify funding sources (GitHub Sponsors + Open Collective + direct contracts)
- ✅ Build personal brand (your name/team associated with agentful)
- ✅ Consistent shipping builds trust
- ⚠️ Takes 3-5 years to reach sustainable income (don't quit day job too early)

---

### 10.2 Case Study: Vite (StackBlitz Sponsorship)

**Model:** Corporate Sponsorship Aligned with Business Strategy

**Timeline:**
- **2020:** Vite created by Evan You (Vue.js creator)
- **2021:** StackBlitz sponsors Vite core team (Anthony Fu, Vladimir Sheremet)
- **2022:** StackBlitz becomes largest backer, sponsors ViteConf
- **2025:** Vite powers StackBlitz's WebContainers, symbiotic relationship

**Why StackBlitz Sponsors Vite:**
- Vite is critical to StackBlitz's product (WebContainers run Vite projects)
- Improved Vite = better StackBlitz experience
- Sponsorship ensures Vite stability and rapid development
- Positions StackBlitz as leader in dev tools ecosystem

**Key Success Factors:**
1. **Strategic Alignment:** Sponsor directly benefits from project's success
2. **Full-Time Maintainers:** Sponsorship funds salaries, not side projects
3. **Tiered Sponsors:** Platinum sponsors get prominent placement
4. **Community Governance:** Despite sponsorship, Vite remains independent

**Lessons for agentful:**
- ✅ Target sponsors with direct business interest (Anthropic, Google)
- ✅ Position as strategic investment, not charity
- ✅ Ensure sponsorship funds full-time work (builds trust)
- ✅ Maintain independence (sponsors don't control roadmap)

**Recommended Approach for agentful:** This is the model to emulate.

---

### 10.3 Case Study: ESLint (Struggling Utility Model)

**Model:** Transparent, Community-Funded Utility

**Timeline:**
- **2013:** ESLint launched by Nicholas C. Zakas
- **2019:** Launches ESLint Collective on Open Collective, targets $20k/month
- **2020:** Automattic becomes first platinum sponsor ($2k/month)
- **2025:** Still struggles to fully fund maintainers despite 13M weekly downloads

**Funding:**
- Open Collective: $20k/month goal (not consistently met)
- Major Sponsors: Automattic ($2k/month), Facebook, Airbnb ($1k/month each)
- Individual Backers: $1-100/month

**Challenges:**
1. **Tragedy of Commons:** "Everyone uses it, someone else will fund it"
2. **Utility Perception:** ESLint is infrastructure, not a "product"
3. **No Direct ROI:** Hard to prove sponsorship drives revenue for sponsors
4. **Volunteer Fatigue:** Core team contributes in spare time, slow progress

**Why ESLint Struggles:**
- Sponsors don't see clear business value (brand awareness is weak ROI)
- Companies view linting as "free" (should be maintained by community)
- No competitive pressure (if ESLint dies, no clear replacement)

**Lessons for agentful:**
- ❌ Avoid positioning as pure utility/infrastructure
- ✅ Emphasize ROI, not just "doing good"
- ✅ Target sponsors with direct revenue impact
- ❌ Don't rely on small individual donations (doesn't scale)
- ✅ Secure major sponsors early (before volunteer burnout)

**What agentful Should Do Differently:**
- Position as revenue driver, not infrastructure
- Target sponsors who earn money from agentful users (Anthropic, Google)
- Provide attribution dashboard (ESLint doesn't track sponsor ROI)

---

### 10.4 Case Study: Babel (Failed Experiment)

**Model:** Full-Time Sponsorship Attempt (Failed)

**Timeline:**
- **2014:** Babel launched
- **2018:** Receives grants, attempts to fund full-time maintainers
- **2020:** Major sponsors: Airbnb ($150k total), Trivago, Gatsby, AMP, Salesforce
- **2021:** Publicly announces "running out of money" despite millions of users
- **2025:** Back to volunteer maintenance, minimal updates

**Funding:**
- Target: $333k/year to fund 3 maintainers
- Actual: $200k/year (60% of goal)
- Platform: Open Collective

**Why Babel Failed:**
1. **No Direct ROI:** Sponsors couldn't measure business impact
2. **Utility Perception:** Babel is "infrastructure", not a "product"
3. **Volunteer Expectations:** Community expects free maintenance
4. **Competition from Free Alternatives:** Companies built on Babel without paying

**What Babel Learned:**
- Full-time OSS maintenance via sponsorship is extremely hard
- Corporate sponsors need clear ROI, not just goodwill
- $11k/month per maintainer is break-even (not competitive with FAANG salaries)
- Platform fees (Open Collective 10%) eat into tight budgets

**Lessons for agentful:**
- ❌ Don't expect sponsorship to fully fund competitive salaries (without strong ROI case)
- ✅ Provide clear attribution (Babel didn't)
- ✅ Target sponsors with direct revenue impact (Babel's sponsors got brand awareness only)
- ⚠️ Open core or dual-licensing might be necessary if sponsorship fails (but harms community)

**What agentful Should Do Differently:**
- Build attribution infrastructure from day one
- Approach sponsors with ROI deck, not "please donate"
- Consider hybrid model (sponsorship + consulting/support) if pure sponsorship insufficient

---

### 10.5 Case Study: Terraform (Open Core Failure)

**Model:** Open Core (Free core, Paid enterprise)

**Timeline:**
- **2014:** Terraform launched as open source (MPL 2.0)
- **2015-2022:** Massive adoption, becomes de facto IaC standard
- **2021:** HashiCorp IPO ($15B valuation)
- **2023:** Switches to Business Source License (BSL), angering community
- **2023:** OpenTofu forks Terraform (community rebellion)
- **2025:** HashiCorp acquired by IBM, Terraform stagnates

**Why Open Core Failed:**
1. **Free Riders:** Competitors (env0, Spacelift, Scalr) built on Terraform OSS, didn't pay
2. **Enterprise Features Weak:** Terraform Enterprise didn't justify cost
3. **Vault Subsidized Terraform:** Only Vault was profitable
4. **Community Backlash:** License change destroyed trust, led to fork

**Key Insight:**
- Open core works only if enterprise features are compelling
- Terraform's core was "too good" (no need for enterprise)
- Competitors monetized Terraform without contributing back
- License changes are destructive (OpenTofu now rivals Terraform)

**Lessons for agentful:**
- ❌ **DO NOT PURSUE OPEN CORE MODEL**
- ✅ Stay fully open source (MIT license)
- ✅ Monetize via sponsorship + support, not features
- ⚠️ License changes destroy community trust (avoid at all costs)

**Why agentful Should Stay Open:**
- Open source is a competitive moat (community contributions accelerate development)
- Sponsorship model aligns incentives (sponsors benefit from usage, not feature gating)
- Licensing drama harms adoption

---

### 10.6 Case Study: Next.js / Vercel (Corporate Ownership)

**Model:** Company-Owned Open Source (Loss Leader)

**Timeline:**
- **2016:** Next.js launched by Vercel (formerly Zeit)
- **2017-2025:** Full-time team at Vercel develops Next.js
- **2025:** Next.js is most popular React framework, drives Vercel adoption

**Why Vercel Funds Next.js:**
- Next.js is a loss leader (free) that drives Vercel platform adoption
- Top-of-funnel capture: Developers learn Next.js → deploy to Vercel
- Vercel's revenue model: Free OSS framework → Paid hosting/infrastructure

**Key Insight:**
- Vercel doesn't need sponsorships (Next.js is marketing expense)
- OSS framework creates lock-in (Next.js is optimized for Vercel)
- Competitors (Netlify) struggle because Vercel controls roadmap

**Lessons for agentful:**
- ✅ This model works if you own a commercial platform (we don't)
- ⚠️ Risk: agentful could be acquired by Anthropic (becomes Claude's "Next.js")
- ✅ For now, stay independent (sponsorship model), consider acquisition exit later

**Potential Exit Strategy for agentful:**
- If sponsorship model fails, consider acquisition by Anthropic, GitHub, or Google
- Acquisition could fund full-time team while keeping project open source
- Risk: Loss of community control (Anthropic dictates roadmap)

---

### 10.7 Summary: Which Model for agentful?

| Model | Example | Viability for agentful | Risk |
|-------|---------|------------------------|------|
| **Individual Creator** | Vue.js | Medium | Requires 3-5 years, personal brand tied to project |
| **Corporate Sponsorship** | Vite | ✅ **HIGH** | Best model. Strategic alignment with sponsors. |
| **Utility Sponsorship** | ESLint | Low | Hard to prove ROI, chronic underfunding |
| **Open Core** | Terraform | ❌ **AVOID** | Community backlash, license drama |
| **Corporate Ownership** | Next.js | Medium | Potential exit strategy, not viable now |

**Recommended for agentful:**
1. **Primary:** Corporate Sponsorship (Vite model)
2. **Supplement:** Individual backers via GitHub Sponsors
3. **Backup:** Consulting/support contracts if sponsorship insufficient
4. **Exit Option:** Acquisition by Anthropic/GitHub/Google (if sponsorship fails long-term)

---

## Conclusion

This sponsorship playbook provides a comprehensive strategy for securing sustainable funding for agentful. The key differentiator is **revenue attribution**: unlike most OSS projects (ESLint, Babel, Prettier) that struggle to prove ROI, agentful directly drives API revenue and infrastructure usage for sponsors.

**Next Steps:**
1. **Build telemetry infrastructure** (opt-in, privacy-respecting)
2. **Track attribution metrics** for 6 months before approaching sponsors
3. **Publish case studies** and testimonials
4. **Approach Anthropic first** (highest ROI, strategic alignment)
5. **Expand to Google, GitHub, Vercel** as traction grows
6. **Set up Open Source Collective** for professional invoicing
7. **Report quarterly results** to sponsors (transparency builds trust)

**Timeline to Sustainability:**
- **Year 1:** $10k-30k/month (1-2 major sponsors)
- **Year 2:** $60k-80k/month (diversified sponsor portfolio)
- **Year 3:** Self-sustaining (4-5 full-time maintainers)

**Remember:** Sponsorship is a marathon, not a sprint. Build proof first, approach sponsors with data, and prioritize long-term relationships over short-term cash.

---

**Good luck!** 🚀

---

## Appendix: Resources

### Recommended Reading

1. **"Working in Public"** by Nadia Eghbal - Definitive book on OSS sustainability
2. **"The Cathedral and the Bazaar"** by Eric S. Raymond - Classic OSS philosophy
3. **Roads and Bridges: The Unseen Labor Behind Our Digital Infrastructure** by Nadia Eghbal - Report on OSS funding

### Useful Links

- **Open Source Collective:** https://www.oscollective.org/
- **GitHub Sponsors:** https://github.com/sponsors
- **Open Collective:** https://opencollective.com/
- **Tidelift:** https://tidelift.com/
- **Thanks.dev:** https://thanks.dev/
- **Scarf (OSS analytics):** https://about.scarf.sh/

### Communities

- **Open Source Maintainers Discord:** https://discord.gg/opensourcemaintainers
- **Sustain OSS:** https://sustainoss.org/
- **Open Source Collective Slack:** Apply via OSC website

### Legal Resources

- **Software Freedom Law Center:** https://softwarefreedom.org/
- **Open Source Initiative (Licensing):** https://opensource.org/licenses
- **Fiscal Sponsorship Guide:** https://docs.opencollective.foundation/

---

**Document Version:** 1.0
**Last Updated:** January 21, 2026
**Author:** [Your Name]
**License:** Internal Use Only (Do Not Share Without Permission)

---
