// All copy lives here. Facts come from the resume and the previous case studies;
// proprietary work is described without internal names, code or client data.
export const profile = {
  name: 'Aryan Arora',
  role: 'Solutions Architect',
  company: 'OceanAI',
  location: 'Kochi, India',
  tz: 'Asia/Kolkata',
  email: 'aryan@stuckaryan.in',
  links: [
    { label: 'GitHub', href: 'https://github.com/0aaryan' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aryanaroraofficial' },
    { label: 'Cortex', href: 'https://cortex.stuckaryan.in' },
  ],
};

// Kept as an export so imports don't break; the section is no longer shown.
export const stats = [];

export const work = [
  {
    id: 'agent-platform', title: 'Agent Platform', kind: 'AI infrastructure', year: '2025',
    hook: 'A shared home for the SQL, voice, email and workflow agents we run for different clients.',
    stack: ['Python', 'FastAPI', 'React', 'LangChain', 'OpenAI Realtime', 'Prefect', 'Microsoft Graph'],
    role: 'Architect',
    problem: 'Fleet operations involve a lot of back-and-forth: questions to IT, status updates, emails across time zones. Each new agent or client we took on meant building the same plumbing again.',
    approach: 'One platform that hosts all four kinds of agent. Each client gets its own isolated agents on shared infrastructure, and agents can see operational context without seeing each other’s data. Multi-step work runs through a small DAG executor, and schema lookups sit behind a cache that invalidates on content changes.',
    impact: ['People ask for data in plain language instead of filing a request', 'Adding a client is mostly configuration now', 'Voice agents for crews who can’t easily use a screen'],
  },
  {
    id: 'mission-control', title: 'Mission Control', kind: 'Developer tools · MCP', year: '2025',
    hook: 'A place where AI coding agents check in, claim files and wait for the work they depend on.',
    stack: ['FastAPI', 'MCP', 'SQLAlchemy 2', 'Azure SQL', 'WebSocket'],
    role: 'AI Team Lead',
    problem: 'Coding agents were good on their own but had no idea what the others were doing. Two would edit the same file, or one would build on a task that wasn’t finished yet.',
    approach: 'An MCP server that agents talk to while they work. They check in, say which files they’ll touch, get a heads-up about conflicts, pick tasks in dependency order and leave a short summary when they’re done. Most of the coordination problem went away once the agents could see each other.',
    impact: ['The team uses it to run its sprints', 'Conflicts show up before anyone writes code', 'A readable history of who did what and why'],
  },
  {
    id: 'finbot', title: 'FinBot', kind: 'AI agent · NL-to-SQL', year: '2025',
    hook: 'Ask a finance question in plain English and get back a chart instead of a SQL ticket.',
    stack: ['Python', 'SQL Server', 'Recursive CTEs', 'RRF retrieval', 'Highcharts'],
    role: 'Lead engineer',
    problem: 'Budget variance and cost-centre questions meant walking account hierarchies across systems with different schemas and different fiscal calendars. Every question waited on the data team.',
    approach: 'An agent that knows the data model well enough to follow recursive hierarchies and fiscal rules, fed by an ETL pipeline that brings the sources into one shape. I spent most of the time on prompts and query validation, because a wrong number is worse than no answer.',
    impact: ['Answers come back as charts people can read at a glance', 'Several source systems normalised into one place', 'No fine-tuning; careful prompting and checks did the work'],
  },
  {
    id: 'qa-platform', title: 'QA Platform', kind: 'Test automation', year: '2025',
    hook: 'Turns the clicking QA engineers already do into Playwright tests.',
    stack: ['PySide6', 'Node.js', 'Playwright', 'WebSocket', 'Azure Blob'],
    role: 'AI Team Lead',
    problem: 'Releases were tested by hand, module by module. Coverage depended on the day, and nobody had time to write automation from scratch.',
    approach: 'A desktop app that records what testers do in the browser, generates tests from it and streams results back. The idea was to not ask anyone to change how they work.',
    impact: ['Still runs as part of the release routine', 'Later grew AI-assisted debugging and an MCP tool server', 'People used it because it fit what they already did'],
  },
  {
    id: 'document-intelligence', title: 'Document Intelligence', kind: 'Search & retrieval', year: '2024',
    hook: 'Search over manuals, certificates and procedures that understands both meaning and clause numbers.',
    stack: ['Azure OpenAI', 'Cosmos DB (HNSW)', 'Hybrid search', 'RRF'],
    role: 'Lead engineer',
    problem: 'During audits people need the right procedure quickly. Keyword search missed meaning, and vector search missed exact references like a specific code section.',
    approach: 'Vector and text search combined with Reciprocal Rank Fusion, so “crew safety procedures” and “ISM Code 7.2” both find what they should. Chunking follows the document’s structure so a procedure stays in one piece, and each client’s data stays separate.',
    impact: ['One search box for both kinds of question', 'Procedures keep their context when retrieved', 'Used by several of our clients'],
  },
];

export const independent = [
  {
    title: 'hypr-tools', tag: 'Open source · MCP',
    body: 'An MCP server that lets Claude Code drive my Linux desktop: windows, workspaces, audio, clipboard, screenshots, and the LED strips too.',
    href: 'https://github.com/0aaryan/hypr-tools', cta: 'View on GitHub', video: 'media/mcp-demo.mp4', poster: 'media/mcp-demo-poster.jpg',
  },
  {
    title: 'Cortex', tag: 'Personal project · live',
    body: 'Where I keep track of my own engineering work: MCP tools, a knowledge graph and a dashboard I actually use every day.',
    href: 'https://cortex.stuckaryan.in', cta: 'Open Cortex',
  },
  {
    title: 'Comply', tag: 'Side project · 2026',
    body: 'Sanctions screening against OFAC, EU and UN lists, with document analysis and an audit trail.',
  },
];

export const experience = [
  {
    when: '2024 — Now', org: 'OceanAI · MariApps Marine Solutions', role: 'Solutions Architect',
    points: ['Design AI systems for maritime clients, from first conversation to running in production', 'Earlier led the AI team as it grew, and helped set up Git, CI/CD, code review and sprints', 'Enjoy mentoring; worked with several intern cohorts and partner teams'],
  },
  {
    when: '2024', org: 'SOS 42', role: 'AI Engineer',
    points: ['Built LLM agents with retrieval across OpenAI, Anthropic and Hugging Face models', 'Moved a Django backend to FastAPI with WebSockets and Azure CI/CD'],
  },
  {
    when: '2020 — 2024', org: 'Vellore Institute of Technology', role: 'B.Tech, Computer Science',
    points: [],
  },
];

export const capabilities = [
  { group: 'AI systems', items: ['Multi-agent orchestration', 'MCP servers', 'RAG & hybrid retrieval', 'NL-to-SQL', 'Voice agents', 'Evaluation & prompting'] },
  { group: 'Engineering', items: ['Python · FastAPI', 'TypeScript · React', 'PostgreSQL · SQL Server', 'Cosmos DB · vector search', 'WebSockets', 'Playwright'] },
  { group: 'Working with teams', items: ['Solution design', 'Architecture & ADRs', 'CI/CD · Docker · Azure', 'Mentoring', 'Workflows for AI-assisted teams'] },
];
