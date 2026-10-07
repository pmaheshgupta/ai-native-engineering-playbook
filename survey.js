"use strict";
function scrollSurvey(){ var el=document.getElementById("survey"); if(el && el.getBoundingClientRect().top < 0) el.scrollIntoView({block:"start"}); }
// ===========================================================================
// DATA — ordered for early-adoption orgs (code first, org-scaling last).
// Each stage has a GATE: answer "No" and the stage is skipped (scores 0).
// ===========================================================================
var PHASES = [
  { id:"1", name:"Building with AI", stages:[
    { id:"S1", name:"Implementation", blurb:"AI writes the bulk; humans steer and take the hard parts.",
      gate:{ text:"Do your engineers use AI to write or modify code today? (Claude, Copilot, agents — anything)",
             hint:"This is almost certainly Yes if teams have Claude. Answering No skips this stage and scores it as not-adopted — that's fine, it just marks your frontier honestly." },
      questions:[
        { id:"1.1", text:"AI writes the bulk of code from spec + tests; humans steer and handle ambiguity.", hint:"Estimate honestly: what share of merged lines started as AI output? 'Norm' = clearly the majority for routine work, with humans focused on direction and edge judgment." },
        { id:"1.2", text:"There is a standard, repeatable scaffold-from-spec workflow.", hint:"Given an approved spec, the path to a working skeleton (code + tests + wiring) is a known, shared recipe — not something each engineer improvises." },
        { id:"1.3", text:"Engineers intervene on novel / high-judgment / high-risk code, not boilerplate.", hint:"Human attention is spent where it matters: money movement, auth, tricky concurrency, new domains. If seniors still hand-write CRUD, answer Partial at most." },
        { id:"1.4", text:"Generated code matches house style automatically.", hint:"Linters, formatters, and conventions are in the AI's context so output lands consistent by default — reviewers shouldn't be catching style issues." },
        { id:"1.5", text:"Throughput scales with agent capacity, not 1:1 with headcount.", hint:"The AI-native tell: can one engineer productively run multiple work streams in parallel via agents? If output only grows by hiring, answer Not yet." } ] },
    { id:"S2", name:"Testing & Quality", blurb:"Verification is the discipline that makes delegation safe.",
      gate:{ text:"Is AI used anywhere in creating or maintaining tests?",
             hint:"Any use counts for the gate — generating unit tests, edge cases, test data. If testing is still fully hand-written, answer No and skip." },
      questions:[
        { id:"2.1", text:"AI generates unit, integration, and edge-case tests as part of every change.", hint:"Tests are produced alongside the code by default — including the annoying edge cases humans skip. 'Partial' = happens for some changes or some teams." },
        { id:"2.2", text:"Tests function as the executable spec; humans define what \u201Ccorrect\u201D means.", hint:"The test suite encodes the acceptance criteria, so passing tests \u2248 meeting spec. Humans still decide the definition of correct — AI must not grade its own homework unchecked." },
        { id:"2.3", text:"Risk-critical paths (money movement, auth, PII) have a human-reviewed test strategy.", hint:"Fintech-critical. For paths where a bug means lost money or a breach, a human has deliberately designed the test approach — not just accepted generated tests." },
        { id:"2.4", text:"Test data generation / fuzzing is automated.", hint:"Realistic synthetic data, property-based tests, or fuzzing run without manual effort. This is where AI shines at finding what humans don't think of." },
        { id:"2.5", text:"Coverage and quality gates are enforced in CI, not by goodwill.", hint:"A change that lowers the quality bar cannot merge, regardless of who or what wrote it. If gates exist but are routinely overridden, answer Partial." } ] },
    { id:"S3", name:"Code Review", blurb:"Machines catch defects; humans exercise judgment and accountability.",
      gate:{ text:"Is AI involved in your code review process in any way?",
             hint:"Counts: AI reviewer bots on PRs, engineers asking AI to pre-review diffs, AI summarising changes. Doesn't count: review is entirely human with no AI touchpoint." },
      questions:[
        { id:"3.1", text:"Every PR gets an automated AI first-pass review.", hint:"Bugs, security smells, and spec conformance are flagged before a human looks. 'Norm' = it runs on every PR automatically, not on request." },
        { id:"3.2", text:"Human review focuses on architecture fit and judgment, not style nits.", hint:"If AI + tooling handle the mechanical layer, human review time shifts to 'is this the right change?' Ask reviewers what they actually comment on." },
        { id:"3.3", text:"Merge accountability is codified and enforced: tooling requires a named human's approval for every merge to main, so agents/automation cannot merge autonomously.", hint:"Guardrail-readiness check. The point is a deliberate, enforced rule (branch protection, required approvals) — not 'humans merge because AI can't.' If AI has no path to merging today: Not yet if nothing is written/enforced, Partial if the rule exists informally, Consistent norm only if it's codified in tooling and would still hold as agent autonomy grows." },
        { id:"3.4", text:"Security/compliance-sensitive diffs are automatically routed for mandatory human sign-off, regardless of who or what authored them.", hint:"Changes touching auth, crypto, payments, PII, or audit trails trigger required review via tooling (e.g. CODEOWNERS + branch rules). If AI isn't authoring such diffs yet: score the routing machinery itself — Not yet if review depends on memory/habit, Partial if it's convention only, Consistent norm only if it's enforced automatically." },
        { id:"3.5", text:"Review findings feed back into improving prompts/agents.", hint:"When AI output keeps making the same mistake, someone updates the context/prompt/agent so it stops. If the same feedback recurs forever, answer Not yet." } ] } ] },
  { id:"2", name:"Defining with AI", stages:[
    { id:"S4", name:"PRD / Specification", blurb:"Intent from humans, drafts and rigor from AI.",
      gate:{ text:"Is AI used in writing or refining product specs / PRDs?",
             hint:"Rewriting PRD docs with Claude counts as Yes. The questions then measure how deep it goes: from 'polish my doc' to 'spec is the machine-actionable source of truth'." },
      questions:[
        { id:"4.1", text:"Specs are drafted by AI from human intent + product/regulatory context.", hint:"PM/engineer supplies the intent and constraints; AI produces the structured first draft. 'Norm' = this is how most PRDs start, not an occasional trick." },
        { id:"4.2", text:"Specs are structured and testable — acceptance criteria map directly to tests.", hint:"Could someone (or an agent) generate test cases straight from the acceptance criteria? If specs are prose narratives that need interpretation, answer Not yet." },
        { id:"4.3", text:"Edge cases, non-functional and compliance requirements are AI-surfaced, human-confirmed.", hint:"AI is systematically asked 'what's missing / what breaks / what does the regulator care about' during spec review — and a human confirms which items matter." },
        { id:"4.4", text:"The spec is the primary source of truth and is machine-actionable downstream.", hint:"Downstream agents/engineers work from the spec, and the spec is updated when reality changes. If code is the only truth and specs rot, answer Not yet." },
        { id:"4.5", text:"Spec sign-off is an explicit step: a named human approves priorities and trade-offs before a spec goes downstream.", hint:"Guardrail-readiness check: as AI drafts more of each spec, approval must stay a deliberate step, not an assumption. Consistent norm = a defined sign-off step with a named owner. If sign-off is implicit ('the PM wrote it, so it's approved'), answer Partial; if nobody could tell you who approved a given spec, Not yet." } ] },
    { id:"S5", name:"Architecture & Technical Design", blurb:"AI proposes options; humans decide and own boundaries.",
      gate:{ text:"Is AI used in design or architecture work — exploring options, drafting ADRs, reviewing designs?",
             hint:"Counts: asking AI for design alternatives, drafting decision records, checking a design against your patterns. Doesn't count: design happens entirely on whiteboards with no AI input." },
      questions:[
        { id:"5.1", text:"AI proposes design options with explicit trade-offs against existing patterns.", hint:"Before designing, engineers ask AI for 2–3 approaches with pros/cons in the context of YOUR codebase and constraints — not generic textbook answers." },
        { id:"5.2", text:"ADRs (architecture decision records) are AI-drafted, human-decided.", hint:"Decisions get written down, AI does the drafting labor, a human makes and owns the call. If you don't write ADRs at all, answer Not yet." },
        { id:"5.3", text:"Ownership of system boundaries, data models, and security architecture is explicitly assigned to named humans.", hint:"Guardrail-readiness check: these decisions have long half-lives and regulatory weight. Consistent norm = ownership is written down (owners file, ADR sign-off rules) and anyone can name the owner. Humans doing all design by default, with no assigned ownership, is Partial at most — even with zero AI involved." },
        { id:"5.4", text:"AI checks new designs against codebase conventions and known constraints.", hint:"E.g. an agent with access to your ADRs/patterns reviews proposals for consistency ('we already have an event bus — why introduce a second queue?')." },
        { id:"5.5", text:"Design artifacts (diagrams, ADRs, docs) are kept in sync automatically.", hint:"When code changes, something regenerates or flags stale diagrams/docs. If keeping docs current relies on human discipline alone, answer Not yet." } ] } ] },
  { id:"3", name:"Shipping & Running", stages:[
    { id:"S6", name:"CI/CD & Infrastructure", blurb:"AI maintains the machinery; humans define the gates.",
      gate:{ text:"Is AI used in your CI/CD or infrastructure work at all — pipelines, IaC, release tooling?",
             hint:"Counts: AI writing/maintaining pipeline config or Terraform, fixing flaky tests, drafting runbooks. If your pipeline work is untouched by AI, answer No — very common, this is usually a later frontier." },
      questions:[
        { id:"6.1", text:"Pipelines and IaC are AI-maintained; humans define gates and approval policy.", hint:"Pipeline config, Terraform/K8s manifests, and their upkeep (including flaky-test fixes) are largely AI work, within human-defined guardrails." },
        { id:"6.2", text:"AI proposes rollout strategies (canary/blue-green) and generates runbooks.", hint:"For each release, AI suggests a rollout plan and produces the runbook/rollback doc. Humans choose; nobody hand-writes runbooks from scratch." },
        { id:"6.3", text:"Quality, security and compliance gates are codified in the pipeline, not manual.", hint:"The release checklist IS the pipeline. If shipping safely still depends on someone remembering a wiki checklist, answer Not yet." },
        { id:"6.4", text:"Production changes on regulated paths have a tooling-enforced human approval step that automation cannot bypass.", hint:"Guardrail-readiness check. Deploys touching money movement, auth, or customer data require approval enforced in the pipeline itself. If deploys are human-only today: score the enforcement — Not yet if approval is just 'whoever deploys decides,' Partial if it's a documented process without enforcement, Consistent norm only if the pipeline blocks unapproved changes." },
        { id:"6.5", text:"Automated rollback / progressive delivery is in place.", hint:"Bad releases are contained by machinery (auto-rollback on error budgets, feature flags, gradual rollout) — a prerequisite for trusting higher AI autonomy." } ] },
    { id:"S7", name:"Observability & Incident Response", blurb:"AI sees first and drafts; humans command and communicate.",
      gate:{ text:"Is AI used in monitoring, alerting, or incident response?",
             hint:"Counts: anomaly detection, AI triage of alerts, AI-drafted incident timelines/RCAs, pasting logs into Claude during an incident. If ops is fully manual dashboards + human triage, answer No." },
      questions:[
        { id:"7.1", text:"AI monitors telemetry and detects/triages anomalies before humans do.", hint:"Anomaly detection + AI triage that correlates signals and pages with context ('error rate up 4x on /payments after deploy #841'). Dashboards humans must watch = Not yet." },
        { id:"7.2", text:"AI drafts root-cause analyses and proposes fixes.", hint:"During/after incidents, AI assembles the timeline, correlates changes, and proposes candidate causes and fixes. Humans validate and decide." },
        { id:"7.3", text:"Auto-remediation exists for known issue classes, within explicit guardrails.", hint:"Known failure modes (restart, scale, rollback, cert renew) are fixed automatically with defined limits and logging. Unlimited autonomous prod access is the wrong answer too." },
        { id:"7.4", text:"Incident command, customer comms, and accountability are explicitly assigned human roles in your incident process.", hint:"Guardrail-readiness check. In fintech a human must run incidents and face customers/regulators — the bar is that this is written into the incident process (defined IC role, comms owner), not just what happens by default. No documented incident roles = Not yet, even if humans handle everything today." },
        { id:"7.5", text:"Incidents feed back into specs, tests, and guardrails automatically.", hint:"Every incident produces concrete changes: a new test, a new alert, an updated spec or guardrail — and AI does the drafting so it actually happens." } ] } ] },
  { id:"4", name:"Fintech Guardrails", stages:[
    { id:"S8", name:"Security & Compliance", blurb:"The fintech spine — humans stay accountable at every control gate.",
      gate:{ text:"Is AI or automation applied to security & compliance work — scan triage, threat modeling, policy-as-code, evidence gathering?",
             hint:"The bar here is automation + AI leverage, not just having scanners. If security/compliance work is entirely manual review and spreadsheets, answer No — but note this stage matters most for fintech, so it should be an early roadmap item." },
      questions:[
        { id:"8.1", text:"SAST, dependency and secret scanning run continuously and findings are AI-triaged.", hint:"Scanners are table stakes; the AI-native part is triage — AI clusters, deduplicates, and prioritizes findings so humans see signal, not noise." },
        { id:"8.2", text:"Policy-as-code checks (data residency, PII handling, etc.) gate the pipeline.", hint:"Compliance rules are encoded and enforced automatically in CI/CD — a change that violates policy cannot ship, no matter how it was authored." },
        { id:"8.3", text:"AI drafts threat models and compliance evidence; humans own interpretation.", hint:"Threat modeling and audit-evidence gathering are labor-heavy and AI-suited. 'Norm' = AI produces drafts routinely; a human validates and is accountable." },
        { id:"8.4", text:"Every AI-influenced change is auditable — who/what/why is traceable.", hint:"Could you show a regulator, for any change, what was AI-generated, who reviewed it, and against which spec? If you can't reconstruct that trail, answer Not yet." },
        { id:"8.5", text:"Every regulated control gate has a named, documented human owner who makes the final call.", hint:"Guardrail-readiness check. Consistent norm = you could list your regulated gates (release approval, access grants, data/model changes) and name the accountable human for each — and that mapping would survive an audit. If accountability is diffuse ('the team decides'), answer Partial; if gates aren't even identified, Not yet." },
        { id:"8.6", text:"AI tool usage itself is governed — data handling, model access, allowed context.", hint:"There's a clear, followed policy on what code/data can go to which AI tools, and access is managed like any other vendor risk. Ad-hoc personal accounts = Not yet." } ] } ] },
  { id:"5", name:"Scaling the System", stages:[
    { id:"S9", name:"Workflow & Process Integration", blurb:"Is AI in the process, or just in individual editors?",
      gate:{ text:"Beyond individuals using AI, is AI embedded in any shared team workflow or pipeline?",
             hint:"The line between AI-Assisted and AI-Augmented. Counts: AI steps in PR/CI/ticket flows, shared agent workflows, team-standard AI processes. Doesn't count: everyone uses Claude, each in their own way." },
      questions:[
        { id:"9.1", text:"AI is the default first attempt for routine work.", hint:"For boilerplate, tests, docs, small fixes: does the work start with AI by default across the team? 'Partial' = some people do, some don't." },
        { id:"9.2", text:"AI is embedded in the pipeline (PRs, CI, tickets), not just the IDE.", hint:"Examples: an AI reviewer on every PR, AI triage on tickets, AI-generated release notes in CI. IDE assistants alone don't count — that's individual, not process." },
        { id:"9.3", text:"Agents handle multi-step tasks end-to-end with defined human checkpoints.", hint:"E.g. 'take this ticket \u2192 branch \u2192 code \u2192 tests \u2192 open PR', with humans reviewing at agreed points. 'Norm' = a supported, repeatable workflow, not a demo." },
        { id:"9.4", text:"Workflows were redesigned around AI, not old workflows with AI bolted on.", hint:"A tell: did any process step disappear or fundamentally change (e.g. review shifted from style-nits to spec-conformance)? If everything looks the same but faster, answer Partial at most." },
        { id:"9.5", text:"Handoffs between stages (spec \u2192 design \u2192 code \u2192 test) are machine-readable artifacts.", hint:"Can an agent pick up the previous stage's output without a human translating it? Structured specs, ADRs, tests-as-spec count. Slide decks and hallway context don't." } ] },
    { id:"S10", name:"Tooling & Platform", blurb:"The substrate that makes agents effective and safe.",
      gate:{ text:"Have you invested in shared AI tooling or platform — shared prompts/context, retrieval over your code & docs, managed agent access?",
             hint:"This is about building FOR AI, not just using it. Counts: checked-in CLAUDE.md/context packs, internal retrieval, scoped agent credentials, eval harnesses. Individual licenses alone = No." },
      questions:[
        { id:"10.1", text:"Codebase, specs and docs are structured to be legible and actionable by agents.", hint:"Clear module boundaries, good READMEs/CLAUDE.md, consistent conventions, discoverable docs. If a new agent (or human) can't orient itself quickly, answer Not yet." },
        { id:"10.2", text:"Shared context infrastructure exists — retrieval over code, docs, decisions.", hint:"Agents and engineers can query org knowledge (code, ADRs, tickets, runbooks) rather than pasting context by hand each time." },
        { id:"10.3", text:"Agents have scoped, least-privilege access to the tools they operate.", hint:"Agent credentials are distinct, minimal, and auditable — an agent that writes docs can't touch prod. Shared human credentials for agents = Not yet." },
        { id:"10.4", text:"An evaluation harness measures AI output quality over time.", hint:"You test your AI workflows like you test code: golden tasks, regression checks on prompts/agents, quality dashboards. Vibes-based confidence = Not yet." },
        { id:"10.5", text:"Guardrails — what agents can and can't do autonomously — are explicit and enforced.", hint:"A written, enforced autonomy policy by risk tier (e.g. agents may open PRs anywhere, may merge docs-only, may never touch payment configs)." } ] },
    { id:"S11", name:"Culture, Skills & Operating Model", blurb:"Do people and incentives assume AI is part of the team?",
      gate:{ text:"Has your org started deliberately building AI skills and expectations — beyond just giving out tool licenses?",
             hint:"Counts: training, coached prompting, AI expectations in role definitions, deliberate norms. If adoption is purely bottom-up enthusiasm with no organizational intent yet, answer No — that's the honest state of most orgs." },
      questions:[
        { id:"11.1", text:"Engineers treat \u201Cspecify intent + verify output\u201D as the core skill, not \u201Ctype code faster.\u201D", hint:"The mindset shift. In an AI-native team the job is directing AI and critically verifying output. Yes only if engineers describe their work as steering & verifying." },
        { id:"11.2", text:"Prompting / context engineering is a recognised, coached skill.", hint:"Training, pairing, or internal guides on giving AI the right context. 'Norm' = taught and discussed like code review skills — not personal folk knowledge." },
        { id:"11.3", text:"Shared, version-controlled prompts / context packs / agent configs exist per repo or domain.", hint:"CLAUDE.md files, prompt libraries, agent configs checked into repos. 'Norm' = a new joiner inherits the team's AI setup automatically." },
        { id:"11.4", text:"Career ladder & performance expectations reflect AI-leveraged output.", hint:"Engineers evaluated on outcomes and judgment (specs, verification, system quality) rather than volume of hand-written code. Ladder silent on AI = Not yet." },
        { id:"11.5", text:"Engineers confidently reject AI output and know when NOT to delegate.", hint:"Healthy teams have taste: they know which tasks (novel algorithms, risky migrations, security-critical logic) need human hands. Rejecting AI output is routine, not awkward." },
        { id:"11.6", text:"Time-to-onboard a new engineer has measurably dropped because AI carries context.", hint:"AI with good context can answer 'how does this codebase work'. Yes only if you've observed/measured faster ramp-up, not just assumed it." } ] },
    { id:"S12", name:"Governance, Measurement & Feedback", blurb:"Treat the AI system itself as a product you improve.",
      gate:{ text:"Do you measure or govern AI usage in any structured way — metrics, policies, owned prompts/agents?",
             hint:"Counts: impact metrics, a human-in-the-loop policy, versioned prompt/agent ownership, failure tracking. If nobody owns 'how we use AI' as a system, answer No." },
      questions:[
        { id:"12.1", text:"You measure AI's impact — cycle time, throughput, defect rate, review load.", hint:"Real before/after metrics exist and are reviewed. If you can't say what AI changed in numbers, answer Not yet — regardless of how good it feels." },
        { id:"12.2", text:"Prompts, agents and context are versioned, owned, improvable assets.", hint:"Someone owns them, they live in version control, changes are reviewed, improvements are shared across teams — like any other production asset." },
        { id:"12.3", text:"There is a clear human-in-the-loop vs autonomous policy, by risk tier.", hint:"A written matrix: which task types may be fully autonomous, which need review, which are human-only. Everyone can name where the lines are." },
        { id:"12.4", text:"AI failures are captured and used to tune the system.", hint:"Bad generations, missed bugs, and wrong triages are logged and drive changes to prompts/context/guardrails — a real feedback loop, not anecdotes." },
        { id:"12.5", text:"Leadership has an explicit target maturity level and a roadmap to get there.", hint:"AI adoption is a managed transformation with an owner, a target state, and milestones — not an emergent side effect of individual enthusiasm." } ] } ] }
];

// Why-it-matters, keyed by question id (shown via the amber "why" toggle)
var WHY = {
  "1.1":"The biggest leverage shift: when AI writes the routine majority, scarce senior attention moves to the decisions that differentiate your product.",
  "1.2":"A repeatable recipe turns AI from a personal trick into team capacity — speed becomes predictable instead of hero-dependent.",
  "1.3":"Misallocated attention is the hidden cost: seniors hand-writing boilerplate is waste; AI writing risky money-path code unreviewed is danger.",
  "1.4":"Style drift multiplies review load and erodes trust in AI output — automating it keeps reviews about substance.",
  "1.5":"This is the economic definition of AI-native: output decoupled from headcount changes your hiring math and roadmap capacity.",
  "2.1":"More AI-written code demands more verification — generated tests are what make higher AI throughput safe instead of reckless.",
  "2.2":"When tests encode the spec, agents can iterate until green — verification becomes the contract between human intent and AI output.",
  "2.3":"In fintech a missed edge case is lost money or a breach — deliberate human test design on these paths is your regulator-facing defense.",
  "2.4":"Automated adversarial inputs find failure modes humans never imagine — cheap insurance that scales with your codebase.",
  "2.5":"Goodwill doesn't survive deadlines; enforced gates are what let you trust a growing share of machine-written changes.",
  "3.1":"Catches defects at the cheapest moment and frees human reviewers from mechanical scanning — review latency drops org-wide.",
  "3.2":"Human review time is your scarcest quality resource; spending it on nits while architecture slips is an expensive inversion.",
  "3.3":"When an agent-caused incident reaches production, 'who approved this' is the first question a regulator asks — this rule is your answer.",
  "3.4":"Automatic routing means safety doesn't depend on a reviewer noticing a diff is dangerous — critical as AI raises change volume.",
  "3.5":"Without this loop you pay for the same AI mistake forever; with it, review effort compounds into a better system.",
  "4.1":"Drafting is where PMs and engineers lose days; AI drafts shift human time to the judgment calls only they can make.",
  "4.2":"Ambiguous specs are the top cause of AI building the wrong thing — testable criteria make intent machine-checkable.",
  "4.3":"Most production surprises were knowable at spec time — systematic AI interrogation is the cheapest place to catch them.",
  "4.4":"Downstream agents can only be trusted if the spec they work from is current — rotting specs cap your automation ceiling.",
  "4.5":"As AI drafts more, implicit approval becomes rubber-stamping — an explicit step keeps a human genuinely deciding scope.",
  "5.1":"Considering only one design is how orgs accrete accidental architecture — cheap AI-generated alternatives raise decision quality.",
  "5.2":"Written decisions are what future agents and engineers reason from — undocumented architecture is invisible to your AI tooling.",
  "5.3":"Boundary and data-model mistakes take years to unwind and carry regulatory weight — named ownership prevents drift by default.",
  "5.4":"Consistency is what keeps a codebase agent-legible — every off-pattern design makes all future AI work a little worse.",
  "5.5":"Stale diagrams actively mislead both humans and agents — auto-sync turns documentation from a liability into infrastructure.",
  "6.1":"Pipeline toil silently consumes senior time; delegating it is high-value, low-risk automation inside human-defined gates.",
  "6.2":"Most release pain is repeatable planning work — AI-generated runbooks mean every release ships with a tested escape plan.",
  "6.3":"A wiki checklist fails exactly when you're rushed; codified gates make the safe path the only path.",
  "6.4":"This is the guardrail that lets you raise agent autonomy everywhere else — the regulated path physically can't be crossed without a human.",
  "6.5":"Blast-radius control is the prerequisite for trusting more automation — recovery speed matters more than never failing.",
  "7.1":"Minutes of detection latency are customer-visible minutes in fintech — AI watching telemetry beats humans watching dashboards.",
  "7.2":"Fast, thorough RCAs are how incidents become improvements instead of repeats — AI removes the labor excuse.",
  "7.3":"Known failures fixed in seconds at 3am, within limits you define — reliability without burning out on-call.",
  "7.4":"In a crisis, ambiguity about who commands costs more than the incident itself — and regulators expect a named human.",
  "7.5":"An incident you don't convert into a test or guardrail is a prepaid repeat — this loop is what makes reliability compound.",
  "8.1":"Alert fatigue is how real vulnerabilities ship; AI triage turns scanner noise into a short human-reviewable list.",
  "8.2":"Manual compliance checking cannot keep pace with AI-speed change volume — encoded policy scales with your throughput.",
  "8.3":"Threat modeling gets skipped when it's expensive; making it cheap means it actually happens — and audits get faster.",
  "8.4":"When a regulator asks how an AI-influenced change shipped, 'we can show you' vs 'we're not sure' is an existential difference.",
  "8.5":"Diffuse accountability is where regulated orgs fail audits — a named owner per gate survives scrutiny and speeds decisions.",
  "8.6":"Ungoverned AI tools are a data-leak and vendor-risk surface — governance is what lets you say yes to more AI, safely.",
  "9.1":"The gap between 'available' and 'default' is where most AI ROI is lost — defaults are what change team output.",
  "9.2":"Individual usage caps at individual skill; pipeline embedding gives every change AI leverage regardless of who ships it.",
  "9.3":"Multi-step delegation is where hours-per-task collapses — checkpoints keep it safe while trust is being earned.",
  "9.4":"Bolting AI onto old process yields single-digit gains; redesign is where step-change productivity comes from.",
  "9.5":"Every human-translation handoff is a bottleneck agents can't cross — structured artifacts unlock end-to-end automation.",
  "10.1":"Context quality is the main determinant of AI output quality — a legible codebase improves every AI interaction at once.",
  "10.2":"Hand-pasting context is an invisible tax on every AI use — shared retrieval pays back on every query, forever.",
  "10.3":"One over-privileged agent incident can set your AI program back a year — scoped access is what makes autonomy defensible.",
  "10.4":"Without measurement you can't tell improvement from regression — evals are how AI workflows get better instead of just different.",
  "10.5":"Written autonomy boundaries let engineers delegate confidently and give leadership a dial to turn — ambiguity freezes both.",
  "11.1":"Tools change in months; this mindset is the durable skill — teams that have it absorb every new capability faster.",
  "11.2":"The gap between your best and median AI user is likely 5–10x — coaching converts individual excellence into team baseline.",
  "11.3":"Uncaptured prompt knowledge walks out the door with people — versioned context is compounding team IP.",
  "11.4":"People optimize what's measured; a ladder that rewards hand-written volume actively fights your AI transformation.",
  "11.5":"Over-trust causes the incidents that trigger AI backlash — calibrated skepticism is what makes adoption sustainable.",
  "11.6":"Ramp time is a clean, measurable proof that your context infrastructure works — and a cost line leadership understands.",
  "12.1":"Anecdotes don't survive budget season — numbers are what sustain investment and show where AI actually helps.",
  "12.2":"Prompts and agents now encode how you build software — untracked they rot; versioned they compound.",
  "12.3":"A clear autonomy matrix prevents both failure modes: reckless delegation and fear-driven under-use.",
  "12.4":"Every uncaptured AI failure repeats; captured, it becomes training data for your system — this is the improvement engine.",
  "12.5":"Bottom-up enthusiasm plateaus at AI-Assisted; crossing to AI-Native takes deliberate org investment only leadership can make."
};

var ANSWER_OPTIONS = [
  { value:0, label:"Not yet" },
  { value:0.5, label:"Partial / some teams" },
  { value:1, label:"Consistent norm" }
];
var LEVELS = [
  { min:0,  name:"Ad-hoc",       desc:"Sporadic individual experimentation; no norms yet." },
  { min:17, name:"AI-Assisted",  desc:"Individuals use AI for discrete tasks; value is real but local and unmeasured." },
  { min:37, name:"AI-Augmented", desc:"AI is woven into shared workflows and the pipeline, with some measurement." },
  { min:60, name:"AI-First",     desc:"AI is the default first attempt; humans review and steer; process redesigned around it." },
  { min:84, name:"AI-Native",    desc:"Org designed around AI as a first-class participant; humans orchestrate, architect, verify." }
];

var ALL_STAGES = [];
PHASES.forEach(function(p){ p.stages.forEach(function(s){
  ALL_STAGES.push(Object.assign({}, s, { phase:p.name, phaseId:p.id }));
});});
var TOTAL_Q = ALL_STAGES.reduce(function(n,s){ return n + s.questions.length; }, 0);

// ------------------------------- STATE -------------------------------------
var state = {
  view:"intro", stageIdx:0,
  answers:{}, gates:{}, hints:{},
  meta:{ name:"", team:"", role:"", size:"" },
  copied:false, submitted:false
};

// ------------------------------ HELPERS ------------------------------------
function esc(str){
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function levelFor(pct){
  var lvl = LEVELS[0];
  LEVELS.forEach(function(l){ if(pct >= l.min) lvl = l; });
  return lvl;
}
function stageStats(s){
  if(state.gates[s.id] === "no")
    return { resolved:s.questions.length, total:s.questions.length, pts:0, skipped:true };
  var resolved = 0, pts = 0;
  s.questions.forEach(function(q){
    if(state.answers[q.id] !== undefined){ resolved++; pts += state.answers[q.id]; }
  });
  return { resolved:resolved, total:s.questions.length, pts:pts, skipped:false };
}
function totals(){
  var resolved = 0, pts = 0;
  ALL_STAGES.forEach(function(s){ var st = stageStats(s); resolved += st.resolved; pts += st.pts; });
  return { resolved:resolved, pts:pts };
}
// What each level transition is fundamentally about (the only hand-maintained bit)
var TRANSITION_FOCUS = {
  "Ad-hoc":"Make individual AI use a daily habit first: code, tests, and docs all start with AI.",
  "AI-Assisted":"Move AI out of individual editors into shared team workflows — PRs, CI, tickets — and standardize practices across teams.",
  "AI-Augmented":"Make AI the default first attempt everywhere, let agents run multi-step tasks with human checkpoints, and redesign processes around it.",
  "AI-First":"Build the platform and governance that let output scale with agents: shared context infrastructure, eval harnesses, and an explicit autonomy policy."
};

// Derive the path to the next level from the answers themselves —
// every answer below "Consistent norm" is a gap; no separate requirements list to maintain.
function computeRoadmap(){
  var t = totals();
  var pct = TOTAL_Q ? (t.pts/TOTAL_Q)*100 : 0;
  var cur = levelFor(pct);
  var idx = LEVELS.indexOf(cur);
  if(idx >= LEVELS.length-1) return { atTop:true, current:cur.name };
  var next = LEVELS[idx+1];
  var pointsNeeded = Math.max(0.5, Math.round((next.min/100*TOTAL_Q - t.pts)*10)/10);
  var quickWins = [], gaps = [], gated = [];
  ALL_STAGES.forEach(function(s){
    if(state.gates[s.id] === "no"){
      gated.push({ id:s.id, stage:s.name, potential:s.questions.length });
      return;
    }
    var st = stageStats(s);
    var spct = st.total ? st.pts/st.total : 0;
    s.questions.forEach(function(q){
      var v = state.answers[q.id];
      if(v === 0.5) quickWins.push({ id:q.id, stage:s.name, text:q.text, gain:0.5, spct:spct });
      else if(v === 0 || v === undefined) gaps.push({ id:q.id, stage:s.name, text:q.text, gain:1, spct:spct });
    });
  });
  // finish nearly-complete stages first: momentum + coherent capability
  gaps.sort(function(a,b){ return b.spct - a.spct; });
  return { atTop:false, current:cur.name, next:next.name, pointsNeeded:pointsNeeded,
    focus:TRANSITION_FOCUS[cur.name] || "", quickWins:quickWins, gaps:gaps, gated:gated };
}

function buildResult(){
  var t = totals();
  var pct = TOTAL_Q ? (t.pts/TOTAL_Q)*100 : 0;
  var lvl = levelFor(pct);
  var byStage = {};
  ALL_STAGES.forEach(function(s){
    var st = stageStats(s);
    byStage[s.id] = { stage:s.name, phase:s.phase, gate: state.gates[s.id] || "unanswered",
      skipped:st.skipped, answered:st.resolved, questions:st.total,
      points:Math.round(st.pts*10)/10, maxPoints:st.total, pct:Math.round((st.pts/st.total)*100) };
  });
  var answers = [];
  ALL_STAGES.forEach(function(s){
    s.questions.forEach(function(q){
      var skipped = state.gates[s.id] === "no";
      var v = skipped ? 0 : (state.answers[q.id] !== undefined ? state.answers[q.id] : null);
      var label = skipped ? "Not applicable — stage gated out (AI not used here yet)"
        : (v === null ? "Unanswered" : ANSWER_OPTIONS.filter(function(o){return o.value===v;})[0].label);
      answers.push({ id:q.id, phase:s.phase, stage:s.name, question:q.text, value:v, label:label });
    });
  });
  return {
    assessment:"ai-native-engineering-maturity", version:"2.0",
    completedAt:new Date().toISOString(),
    respondent:{ name:state.meta.name, team:state.meta.team, role:state.meta.role, teamSize:state.meta.size },
    scale:{ "0":"Not yet", "0.5":"Partial / some teams", "1":"Consistent norm" },
    gateRule:"A stage gated 'no' means AI is not yet used at that SDLC stage; its questions score 0 (not adopted).",
    score:{ points:Math.round(t.pts*10)/10, maxPoints:TOTAL_Q, resolved:t.resolved,
      totalQuestions:TOTAL_Q, percent:Math.round(pct*10)/10, level:lvl.name },
    levels:LEVELS.map(function(l){ return { minPercent:l.min, name:l.name }; }),
    byStage:byStage, readiness:(function(){ var r=readinessData(); return { guardrailPercent:Math.round(r.gPct), guardrailChecksAnswered:r.gAns, guardrailChecksTotal:GUARD_IDS.length, adoptionPercent:Math.round(r.aPct), quadrant:r.q ? QUAD[r.q].t : null, targetLevel:r.target!==null ? LEVELS[r.target].name : null }; })(), answers:answers,
    nextLevel:(function(){
      var r = computeRoadmap();
      if(r.atTop) return { name:null, note:"Already at the top level — focus on sustaining: keep measuring, keep guardrails current." };
      return { name:r.next, pointsNeeded:r.pointsNeeded, focus:r.focus,
        quickWinIds:r.quickWins.map(function(x){ return x.id; }),
        gapIds:r.gaps.map(function(x){ return x.id; }),
        gatedStages:r.gated.map(function(x){ return x.stage; }) };
    })(),
    note:"Paste this JSON into Claude to get your maturity rating, stage-by-stage analysis, and a prioritized roadmap."
  };
}
function copyJSON(){
  var text = JSON.stringify(buildResult(), null, 2);
  function done(){ state.copied = true; render(); setTimeout(function(){ state.copied = false; render(); }, 1800); }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done, function(){ fallbackCopy(text); done(); });
  } else { fallbackCopy(text); done(); }
}
function fallbackCopy(text){
  var ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch(e){}
  document.body.removeChild(ta);
}


// ---------------- READINESS: adoption vs guardrails, target by team size ----------------
// Guardrail checks = questions that test the fintech spine (named owners, enforced gates,
// auditability, least privilege, brakes). Scored separately so "fast but unsafe" is visible.
var GUARD_IDS = ["2.3","3.3","3.4","4.5","5.3","6.4","6.5","7.4","8.2","8.4","8.5","8.6","10.3","10.5","12.3"];
var QUAD = {
  red:{cls:"q-red", t:"Danger zone", d:"High AI use, weak guardrails. Chaos risk: pause adoption and build the gates first."},
  green:{cls:"q-green", t:"Healthy", d:"High use and strong guardrails. Keep climbing."},
  amber:{cls:"q-amber", t:"Experimenting", d:"Low use, weak guardrails. Fine to experiment; start the L2 build with the gates included."},
  teal:{cls:"q-teal", t:"Structurally ready", d:"Guardrails ahead of usage. Accelerate adoption with confidence: the ideal posture for a regulated business."}
};
function stageOf(qid){ for(var i=0;i<ALL_STAGES.length;i++){ for(var j=0;j<ALL_STAGES[i].questions.length;j++){ if(ALL_STAGES[i].questions[j].id===qid) return ALL_STAGES[i]; } } return null; }
function readinessData(){
  var gAns=0, gPts=0, aPts=0, aTot=0;
  ALL_STAGES.forEach(function(s){
    var gated = state.gates[s.id]==="no";
    s.questions.forEach(function(q){
      var v = state.answers[q.id];
      if(GUARD_IDS.indexOf(q.id)>=0){ if(!gated && v!==undefined){ gAns++; gPts+=v; } }
      else { aTot++; if(!gated && v!==undefined) aPts+=v; }
    });
  });
  var gPct = gAns ? gPts/gAns*100 : 0;
  var aPct = aTot ? aPts/aTot*100 : 0;
  var useHigh = aPct >= 37, gStrong = gAns>0 && gPct >= 60;
  var q = gAns ? (useHigh ? (gStrong?"green":"red") : (gStrong?"teal":"amber")) : null;
  var t = totals(); var pct = TOTAL_Q ? (t.pts/TOTAL_Q)*100 : 0;
  var cur = LEVELS.indexOf(levelFor(pct));
  var size = state.meta.size, target = null, why = "";
  if(size==="s"){ target=1; why="Under 15 engineers, the fixed cost of AI-Augmented won't amortize. Staying at AI-Assisted is the disciplined choice."; }
  else if(size==="m"){ target=2; why="At 15–40 engineers the AI-Augmented platform build pays back, and its guardrails have compliance value on their own."; }
  else if(size==="l"){ target = cur>=2 ? 3 : 2; why = cur>=2 ? "With 40+ engineers and a working AI-Augmented base, the redesign dividend of AI-First outweighs incremental gains." : "With 40+ engineers, AI-First is in reach, but only on a mature AI-Augmented base. Build that first."; }
  return { gAns:gAns, gPct:gPct, aPct:aPct, q:q, cur:cur, target:target, why:why };
}
function readinessHTML(){
  var r = readinessData();
  var cell = function(k){ return '<div class="q-cell ' + QUAD[k].cls + (k===r.q ? ' on' : '') + '">' + QUAD[k].t + '</div>'; };
  var quad = '<div class="quad"><span class="ylab">AI use high</span>' + cell("red") + cell("green") +
    '<span class="ylab">AI use low</span>' + cell("amber") + cell("teal") +
    '<span></span><span class="xlab">Guardrails weak</span><span class="xlab">Guardrails strong</span></div>';
  var verdict = r.q ? '<p class="q-say ' + QUAD[r.q].cls + '">' + QUAD[r.q].d + '</p>'
    : '<p class="q-say">Answer at least one guardrail check (they appear in every phase) to place your team.</p>';
  var meters = '<div class="rd-meter"><div class="rd-row"><span>Guardrail readiness</span><span class="mono">' + Math.round(r.gPct) + '% · ' + r.gAns + ' of ' + GUARD_IDS.length + ' checks</span></div><div class="bar"><i style="width:' + r.gPct + '%;background:' + (r.gPct>=60 ? 'var(--ok)' : 'var(--mid)') + '"></i></div></div>' +
    '<div class="rd-meter"><div class="rd-row"><span>AI adoption (all other questions)</span><span class="mono">' + Math.round(r.aPct) + '%</span></div><div class="bar"><i style="width:' + r.aPct + '%"></i></div></div>';
  var target = r.target===null
    ? '<div class="rd-target">Add your <b>team size</b> on the Overview to see the level that pays back for you. <button class="crumb-link" data-action="view" data-view="intro">Add team size</button></div>'
    : '<div class="rd-target"><span class="rd-lbl">Target for your size</span><b>' + LEVELS[r.target].name + '</b>' +
      (r.cur >= r.target ? ' <span class="rd-ok">✓ you’re there</span>' : ' <span class="rd-gap">' + (r.target - r.cur) + ' level' + (r.target-r.cur>1?'s':'') + ' up</span>') +
      '<p>' + esc(r.why) + ' <a href="evidence.html#economics">See the break-even calculator</a></p></div>';
  return '<div class="readiness"><div>' + quad + verdict + '</div><div class="rd-right">' + meters + target + '</div></div>';
}

// ------------------------------ RENDERING -----------------------------------
function meterHTML(){
  if(state.view === "intro") return "";
  var t = totals();
  var pct = TOTAL_Q ? (t.pts/TOTAL_Q)*100 : 0;
  var projPct = t.resolved ? (t.pts/t.resolved)*100 : 0;
  var isResults = state.view === "results";
  var shown = isResults ? pct : projPct;
  var label = t.resolved === 0 ? "—"
    : isResults ? levelFor(pct).name + " · " + Math.round(pct) + "%"
    : "trending " + levelFor(projPct).name + " · " + t.resolved + "/" + TOTAL_Q + " resolved";
  var zones = LEVELS.map(function(l,i){
    var next = LEVELS[i+1] ? LEVELS[i+1].min : 100;
    return '<div class="zone" style="flex-grow:' + (next-l.min) + '"><span>' + l.name + '</span></div>';
  }).join("");
  var needle = t.resolved > 0 ? '<div class="needle" style="left:' + Math.min(shown,99.5) + '%"></div>' : "";
  var sub = isResults ? levelFor(pct).desc
    : "The needle projects your level from what's resolved so far (answers + gated-out stages). It settles as you progress.";
  return '<div class="meter"><div class="meter-top">' +
    '<span class="meter-title">Maturity meter · live</span>' +
    '<span class="mono" style="font-size:13px;font-weight:700">' + esc(label) + '</span></div>' +
    '<div class="track"><div class="fill" style="width:' + shown + '%"></div>' + zones + needle + '</div>' +
    '<div class="meter-sub">' + esc(sub) + '</div></div>';
}

function introHTML(){
  var jColors = ["#8A94A0","#6B7FD6","#4A6BE0","#1F4FD8","#0E8A5F"];
  var jSoft   = ["#EEF1F4","#EAEEFA","#E6EBFB","#E8EDFB","#E4F3ED"];
  var journey = '<div class="jtrack">' +
    LEVELS.map(function(l,i){
      var open = !!state.hints["lvl-" + i];
      var dotStyle = 'background:' + jColors[i] +
        (open ? ';box-shadow:0 0 0 4px ' + jSoft[i] + ',0 0 0 5.5px ' + jColors[i] : '');
      return '<button class="jnode' + (open ? " open" : "") + '" data-action="lvl" data-key="lvl-' + i + '">' +
        '<span class="jdot2" style="' + dotStyle + '">' + i + '</span>' +
        '<span class="jlbl">' + esc(l.name) + '</span>' +
        '<span class="jhelp">' + (open ? "hide" : "? help") + '</span></button>';
    }).join("") +
    '</div>' +
    LEVELS.map(function(l,i){
      return state.hints["lvl-" + i]
        ? '<div class="hint" style="margin-top:10px;border-left-color:' + jColors[i] + '"><b>' + i + ' \u00B7 ' + esc(l.name) + ':</b> ' + esc(l.desc) + '</div>'
        : "";
    }).join("");
  return '<div class="intro-cols"><div class="panel">' +
    '<h3 style="margin-top:0">What \u201CAI-native\u201D means</h3>' +
    '<p style="font-size:14px;color:var(--ink)">An AI-native SDLC runs its operating model, roles, and processes around human-agent coordination, treating autonomous agents as first-class participants across the lifecycle rather than assistants. Workflows are designed so the agent makes the first attempt at every unit of work \u2014 from PRD to deployment \u2014 with humans setting intent going in and judging the result coming out.</p>' +
    '<p style="font-size:14px;color:var(--ink)">Two shifts sit underneath this, on two different axes.</p>' +
    '<div class="who-card" style="margin:8px 0 10px"><b>Shift 1 \u00B7 Who produces the work</b>Humans produce, tools assist \u2192 agents produce, humans steer.</div>' +
    '<div class="who-card" style="margin:0 0 4px"><b>Shift 2 \u00B7 Where the bottleneck is</b>Traditional SDLC assumes producing the artifact \u2014 PRD, design, code, tests \u2014 is the slow, expensive step, so everything protects it. When generation becomes cheap, that breaks, and the bottleneck moves to two new places:' +
    '<ol class="steps" style="margin-top:8px">' +
    '<li class="step"><span class="step-n">1</span><div><div class="step-t">Precise specification of intent</div><div class="step-d">If an agent can produce the artifact, the valuable human contribution is the clear statement of <i>what</i> and <i>under what constraints</i>, not the artifact itself.</div></div></li>' +
    '<li class="step"><span class="step-n">2</span><div><div class="step-t">Verification / trust</div><div class="step-d">Output isn\u2019t guaranteed to be right, and the volume of generated change is too high to eyeball. You can\u2019t manually review what you could previously produce by hand.</div></div></li>' +
    '</ol></div>' +
    '<h3>AI-native is a journey, not a switch</h3>' +
    journey +
    '<p style="font-size:13px;color:var(--muted);margin-top:12px"><b>Typical starting point:</b> if your teams have AI tools and use them individually for coding and docs, you\u2019ll likely land at <b>AI-Assisted</b>. That\u2019s normal — this assessment exists to show the concrete gaps to the next level, not to grade you.</p>' +
    '</div>' +
    '<aside class="side-card">' +
    '<h1 style="font-size:19px;margin:0 0 6px">How AI-native is your SDLC, really?</h1>' +
    '<p class="blurb" style="margin-bottom:16px">A quick self-assessment of how deeply AI is embedded in how you build and ship software.</p>' +
    '<div class="field"><label>Your name</label><input data-meta="name" value="' + esc(state.meta.name) + '"></div>' +
    '<div class="field"><label>Team (optional)</label><input data-meta="team" value="' + esc(state.meta.team) + '"></div>' +
    '<div class="field"><label>Role (optional)</label><input data-meta="role" value="' + esc(state.meta.role) + '"></div>' +
    '<div class="field"><label>Engineering team size</label><select data-meta="size">' +
      [["","Choose\u2026"],["s","Under 15 engineers"],["m","15\u201340 engineers"],["l","40+ engineers"]].map(function(o){ return '<option value="' + o[0] + '"' + (state.meta.size===o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join("") +
    '</select></div>' +
    '<button class="btn primary" data-action="start">Start the assessment \u2192</button>' +
    '</aside></div>';
}

function surveyHTML(){
  var stage = ALL_STAGES[state.stageIdx];
  var gateVal = state.gates[stage.id];

  var nav = PHASES.map(function(p){
    var items = p.stages.map(function(s){
      var idx = ALL_STAGES.findIndex(function(x){ return x.id === s.id; });
      var st = stageStats(s);
      var dot = st.skipped ? "skip" : st.resolved === 0 ? "" : st.resolved === st.total ? "full" : "some";
      var count = st.skipped ? "skip" : st.resolved + "/" + st.total;
      return '<button class="nav-item ' + (idx === state.stageIdx ? "active" : "") + '" data-action="nav" data-idx="' + idx + '">' +
        '<span class="dot ' + dot + '"></span><span>' + esc(s.name) + '</span><span class="nav-count">' + count + '</span></button>';
    }).join("");
    return '<div><div class="nav-phase">' + p.id + ' · ' + esc(p.name) + '</div>' + items + '</div>';
  }).join("");

  var gateHintOpen = !!state.hints["gate-" + stage.id];
  var gate = '<div class="gate"><div class="gate-label">Gate · does this stage apply to you yet?</div>' +
    '<div class="q-head" style="gap:8px"><span class="gate-text" style="flex:1">' + esc(stage.gate.text) + '</span>' +
    '<button class="hint-btn" data-action="hint" data-key="gate-' + stage.id + '">' + (gateHintOpen ? "hide" : "? help") + '</button></div>' +
    (gateHintOpen ? '<div class="hint">' + esc(stage.gate.hint) + '</div>' : "") +
    '<div class="gate-opts">' +
    '<button class="gate-btn ' + (gateVal === "yes" ? "yes" : "") + '" data-action="gate" data-val="yes">Yes — we use AI here</button>' +
    '<button class="gate-btn ' + (gateVal === "no" ? "no" : "") + '" data-action="gate" data-val="no">No — not yet, skip this stage</button>' +
    '</div></div>';

  var body = "";
  if(gateVal === undefined){
    body = '<div class="gate-wait">Answer the gate question above to continue — "No" skips straight to the next stage.</div>';
  } else if(gateVal === "no"){
    body = '<div class="skipped-card"><b>Stage skipped — marked as "not adopted yet."</b>' +
      'Its ' + stage.questions.length + ' questions score 0, which is the honest reading: this stage is part of your frontier, and it\u2019ll show up in the roadmap on the results page. Changed your mind? Flip the gate to Yes above.</div>';
  } else {
    body = stage.questions.map(function(q){
      var sel = state.answers[q.id];
      var hintOpen = !!state.hints[q.id];
      var whyOpen = !!state.hints["why-" + q.id];
      var opts = ANSWER_OPTIONS.map(function(o,i){
        var cls = sel === o.value ? "sel" + i : "";
        return '<button class="opt ' + cls + '" data-action="answer" data-q="' + q.id + '" data-v="' + o.value + '">' + o.label + '</button>';
      }).join("");
      return '<div class="q"><div class="q-head"><span class="q-id">' + q.id + '</span>' +
        '<span class="q-text">' + esc(q.text) + '</span>' +
        '<button class="hint-btn" data-action="hint" data-key="' + q.id + '">' + (hintOpen ? "hide" : "? help") + '</button>' +
        '<button class="why-btn" data-action="hint" data-key="why-' + q.id + '">' + (whyOpen ? "hide" : "\u2726 why") + '</button></div>' +
        (hintOpen ? '<div class="hint">' + esc(q.hint) + '</div>' : "") +
        (whyOpen ? '<div class="why"><b>Why it matters:</b> ' + esc(WHY[q.id] || "") + '</div>' : "") +
        '<div class="opts">' + opts + '</div></div>';
    }).join("");
  }

  var last = state.stageIdx === ALL_STAGES.length - 1;
  var foot = '<div class="foot">' +
    '<button class="btn" data-action="prev" ' + (state.stageIdx === 0 ? "disabled" : "") + '>\u2190 Previous</button>' +
    (last
      ? '<button class="btn primary" data-action="submit" ' + (gateVal === undefined ? "disabled" : "") + '>Submit &amp; see results</button>'
      : '<button class="btn primary" data-action="next" ' + (gateVal === undefined ? "disabled" : "") + '>Next stage \u2192</button>') +
    '</div>';

  return '<div class="cols"><nav class="nav">' + nav + '</nav>' +
    '<main class="panel"><div class="crumb">Phase ' + stage.phaseId + ' · ' + esc(stage.phase) +
    ' · Stage ' + (state.stageIdx+1) + ' of ' + ALL_STAGES.length + '</div>' +
    '<h2>' + esc(stage.name) + '</h2><p class="blurb">' + esc(stage.blurb) + '</p>' +
    gate + body + foot + '</main></div>';
}

function resultsHTML(){
  var t = totals();
  var pct = TOTAL_Q ? (t.pts/TOTAL_Q)*100 : 0;
  var lvl = levelFor(pct);
  var warn = t.resolved < TOTAL_Q
    ? '<div class="warn">' + (TOTAL_Q - t.resolved) + ' question(s) unresolved — they score 0 and pull the level down. ' +
      '<button class="btn" style="padding:4px 10px;font-size:12.5px" data-action="edit">Go back and finish</button></div>'
    : "";
  var bars = ALL_STAGES.map(function(s){
    var st = stageStats(s);
    var p = Math.round((st.pts/st.total)*100);
    var right = st.skipped ? '<span class="skip-tag">skipped</span>' : '<span class="bar-pct">' + p + '%</span>';
    return '<div class="bar-row"><span>' + esc(s.name) + '</span><div class="bar"><i style="width:' + p + '%"></i></div>' + right + '</div>';
  }).join("");
  var rm = computeRoadmap();
  var roadmap = "";
  if(rm.atTop){
    roadmap = '<div class="next"><div class="next-head"><b>You\u2019re at AI-Native.</b> The work now is sustaining it — keep measuring, keep guardrails current, keep the feedback loops alive.</div></div>';
  } else {
    function itemRows(list, cap, gainLabel){
      var html = list.slice(0, cap).map(function(x){
        return '<div class="next-item"><span class="q-id">' + x.id + '</span><span>' + esc(x.text) + '</span><span class="gain">' + gainLabel + '</span></div>';
      }).join("");
      if(list.length > cap) html += '<div class="next-more">+ ' + (list.length - cap) + ' more — full list travels in the JSON</div>';
      return html;
    }
    var gatedRows = rm.gated.slice(0, 4).map(function(x){
      return '<div class="next-item"><span class="q-id">' + x.id + '</span><span>' + esc(x.stage) + ' — run a pilot to open this stage</span><span class="gain">up to +' + x.potential + '</span></div>';
    }).join("") + (rm.gated.length > 4 ? '<div class="next-more">+ ' + (rm.gated.length - 4) + ' more gated stages in the JSON</div>' : "");
    roadmap = '<div class="next">' +
      '<div class="next-head">Path to <b>' + rm.next + '</b> — you need <b>+' + rm.pointsNeeded + ' pts</b> to cross the threshold</div>' +
      '<div class="next-focus"><b>Focus for this jump:</b> ' + esc(rm.focus) + '</div>' +
      (rm.quickWins.length ? '<div class="next-group"><div class="next-gt">Quick wins · turn \u201CPartial\u201D into the norm</div>' + itemRows(rm.quickWins, 6, "+0.5") + '</div>' : "") +
      (rm.gaps.length ? '<div class="next-group"><div class="next-gt">Close the gaps · stages you\u2019ve already started</div>' + itemRows(rm.gaps, 6, "+1") + '</div>' : "") +
      (rm.gated.length ? '<div class="next-group"><div class="next-gt">Open new frontiers · stages currently gated out</div>' + gatedRows + '</div>' : "") +
      '</div>';
  }
  return '<div class="panel">' +
    '<div class="crumb">Assessment complete' + (state.meta.team ? ' · ' + esc(state.meta.team) : "") + '</div>' +
    '<h1>Your snapshot</h1>' + warn +
    '<div class="score-hero"><div class="score-num">' + Math.round(t.pts*10)/10 +
    '<small> / ' + TOTAL_Q + ' pts · ' + Math.round(pct) + '%</small></div>' +
    '<div><span class="pill">' + lvl.name + '</span>' +
    '<div style="color:var(--muted);font-size:13.5px;margin-top:6px;max-width:420px">' + esc(lvl.desc) + '</div></div></div>' +
    readinessHTML() + '<h3 style="margin-top:22px">By stage</h3>' + bars + roadmap +
    '<div class="foot" style="margin-top:20px">' +
    '<button class="btn" data-action="edit">\u2190 Edit answers</button>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn" data-action="copy">' + (state.copied ? "Copied \u2713" : "Copy JSON") + '</button>' +
    '<button class="btn primary" data-action="guide" data-level="' + (rm.atTop ? 4 : LEVELS.findIndex(function(l){return l.name===rm.next;})) + '">Open the execution guide \u2192</button></div></div>' +
    '<div class="json-note"><b>Next step:</b> copy the JSON, then paste it into Claude and ask — "Here are my assessment results, give me my rating and a roadmap." You\u2019ll get the maturity rating, strongest/weakest stages, what the gated-out stages say about your frontier, and a prioritized plan to reach the next level.</div>' +
    '<div class="json-prev" id="json-prev"></div>' +
    '</div>';
}

function crumbsHTML(){
  var items = [["intro","Overview"],["survey","Assessment"],["results","Results"]];
  return '<div class="crumbs">' + items.map(function(it){
    var id = it[0], label = it[1];
    if(id === state.view) return '<span class="crumb-cur">' + label + '</span>';
    var reachable = id !== "results" || state.submitted;
    return reachable
      ? '<button class="crumb-link" data-action="view" data-view="' + id + '">' + label + '</button>'
      : '<span class="crumb-dis">' + label + '</span>';
  }).join('<span class="crumb-sep">\u203A</span>') + '</div>';
}

function render(){
  var app = document.getElementById("survey");
  var html = (state.view === "intro" ? "" : crumbsHTML()) + meterHTML();
  if(state.view === "intro") html += introHTML();
  else if(state.view === "survey") html += surveyHTML();
  else html += resultsHTML();
  app.innerHTML = html;
  if(state.view === "results"){
    // set JSON preview via textContent so it's safely escaped
    document.getElementById("json-prev").textContent = JSON.stringify(buildResult(), null, 2);
  }
}

// ------------------------------ EVENTS --------------------------------------
document.getElementById("survey").addEventListener("click", function(e){
  var el = e.target.closest("[data-action]");
  if(!el || el.disabled) return;
  var action = el.getAttribute("data-action");
  var stage = ALL_STAGES[state.stageIdx];
  switch(action){
    case "start": state.view = "survey"; render(); scrollSurvey(); break;
    case "nav": state.stageIdx = parseInt(el.getAttribute("data-idx"),10); render(); scrollSurvey(); break;
    case "gate": state.gates[stage.id] = el.getAttribute("data-val"); render(); break;
    case "hint": var k = el.getAttribute("data-key"); state.hints[k] = !state.hints[k]; render(); break;
    case "lvl": var lk = el.getAttribute("data-key"); var wasOpen = !!state.hints[lk]; LEVELS.forEach(function(_,i){ delete state.hints["lvl-" + i]; }); if(!wasOpen) state.hints[lk] = true; render(); break;
    case "answer": state.answers[el.getAttribute("data-q")] = parseFloat(el.getAttribute("data-v")); render(); break;
    case "prev": if(state.stageIdx > 0){ state.stageIdx--; render(); scrollSurvey();} break;
    case "next": if(state.stageIdx < ALL_STAGES.length-1){ state.stageIdx++; render(); scrollSurvey();} break;
    case "submit": state.view = "results"; state.submitted = true; render(); scrollSurvey(); break;
    case "edit": state.view = "survey"; render(); scrollSurvey(); break;
    case "view": state.view = el.getAttribute("data-view"); render(); scrollSurvey(); break;
    case "guide": location.href = "playbook.html#level-" + el.getAttribute("data-level"); break;
    case "copy": copyJSON(); break;
  }
});
// meta inputs: update state without re-rendering (keeps focus while typing)
document.getElementById("survey").addEventListener("input", function(e){
  var key = e.target.getAttribute && e.target.getAttribute("data-meta");
  if(key) state.meta[key] = e.target.value;
});

render();
