export const profile = {
  name: "Salar Satti",
  role: "Data Scientist",
  email: "salarsattiss@gmail.com",
  location: "Boston, MA",
  current: "Building long-horizon voice agents @ Liberate AI",
  about:
    "Over 7 years professional experience; expertise in deep learning, LLMs, and NLP; experience in building data focused products; deploying machine learning pipelines.",
  taglines: [
    "builds voice agents that follow the rules",
    "turns 100TB of IoT data into dashboards",
    "teaches LLMs to read medical records",
    "went from a furniture store to Staff DS",
    "makes graphs of agents talk to each other",
  ],
}

export type Role = {
  id: string
  title: string
  company: string
  period: string
  duration: string
  summary: string
  points: string[]
  stack: string[]
  metrics?: { value: string; label: string }[]
  logo?: string
  // company homepage, opened from the logo
  url?: string
  // one-liner shown as a pill on the timeline card
  status: string
  current?: boolean
  // little animation shown next to the logo on the role page
  visual?: "voice" | "docs" | "ner" | "iot" | "fleet"
}

// homepages for tools named in a role's text; each mention is linked on the role page
export const techLinks: Record<string, string> = {
  LangGraph: "https://www.langchain.com/langgraph",
  LiveKit: "https://livekit.io",
  OpenTelemetry: "https://opentelemetry.io",
  Python: "https://www.python.org",
  FastAPI: "https://fastapi.tiangolo.com",
  React: "https://react.dev",
  "scikit-learn": "https://scikit-learn.org",
  Docker: "https://www.docker.com",
  flairNLP: "https://github.com/flairNLP/flair",
  PyTorch: "https://pytorch.org",
  "AWS OCR": "https://aws.amazon.com/textract/",
  Spark: "https://spark.apache.org",
  spaCy: "https://spacy.io",
  Hive: "https://hive.apache.org",
  Databricks: "https://www.databricks.com",
  Azure: "https://azure.microsoft.com",
  Django: "https://www.djangoproject.com",
}

export const experience: Role[] = [
  {
    id: "liberate",
    status: "Building long-horizon voice agents @ Liberate AI",
    current: true,
    visual: "voice",
    title: "Senior Data Scientist",
    company: "Liberate AI",
    logo: "/logos/liberate_inc_logo.jpeg",
    url: "https://www.liberate.ai/",
    period: "2025 – 2026",
    duration: "1 yr",
    summary:
      "Building a platform for insurance voice agents that automate front-office tasks end-to-end.",
    points: [
      "Led the implementation of a graph-based multi-agent system in LangGraph for the next generation of long-horizon voice agents, increasing determinism under strict low-latency constraints",
      "Introduced strict business-logic features in the graph agents for a high-stakes regulatory environment: updating policy information, claim submission, and payments",
      "Spearheaded end-to-end integration of LiveKit, LangGraph, and internal APIs on an accelerated timeline, minimizing response latency via real-time JSON tool-call streaming",
      "Drove offline evals and simulation-based benchmarking; built internal insurance benchmark datasets that cut the time to test improvements to zero",
      "Instrumented the agents with OpenTelemetry to record latency, token usage, spend, and other settings",
      "Built annotation features in the observability platform so support staff feedback is picked up by internal agents that open tickets and pull requests automatically",
    ],
    stack: ["LangGraph", "LiveKit", "OpenTelemetry", "LLMs", "Evals", "Python"],
    metrics: [{ value: "→ 0", label: "manual test time per change" }],
  },
  {
    id: "gradient-staff",
    visual: "docs",
    status: "UW model rebuild and Gen AI Products shipped @ Gradient AI",
    title: "Staff Data Scientist",
    company: "Gradient AI",
    logo: "/logos/gradientai_logo.jpeg",
    url: "https://www.gradientai.com/",
    period: "2024 – 2025",
    duration: "1 yr 4 mo",
    summary:
      "Technical team lead and LLM/NLP expert at an insurtech startup, delivering SaaS products driving millions of dollars of revenue.",
    points: [
      "Helped lead development of generative AI products that summarize and de-duplicate very large medical documents; benchmarked multiple LLMs and designed the RAG architecture",
      "Architected scalable cloud software for a document processing service: storage and querying of documents and metadata, custom workflow pipelines, APIs, and data schemas",
      "Led development of a React + FastAPI application for stakeholders to interact with model outputs",
      "Scrum master for the underwriting team; coached agile principles, led ceremonies, and drove adoption of ML pipelines across several teams",
      "Led a ground-up rebuild of the underwriting system with scikit-learn pipelines, unit tests, decoupled services, and Docker",
      "Led a data engineering initiative restructuring client data ingestion, table architecture, and data quality frameworks, directly improving model performance for a key line of business",
    ],
    stack: ["LLMs", "RAG", "FastAPI", "React", "scikit-learn", "Docker"],
    metrics: [{ value: "$M+", label: "in SaaS revenue driven" }],
  },
  {
    id: "gradient-senior",
    visual: "ner",
    status: "Built UW models and shipped NLP models @ Gradient AI",
    title: "Senior Data Scientist",
    company: "Gradient AI",
    logo: "/logos/gradientai_logo.jpeg",
    url: "https://www.gradientai.com/",
    period: "2021 – 2023",
    duration: "3 yrs",
    summary:
      "Worked on zero-inflated financial and insurance data and delivered some of the company's first standalone NLP products.",
    points: [
      "Created new features, integrated external datasets, tuned boosted-tree models, and built insurance-specific preprocessing, producing the best model performance to date",
      "Fine-tuned an NER text classification model with flairNLP (PyTorch) to identify body parts in free text, helping customers understand prior injuries and manage costs",
      "Extracted structured data from insurance documents using AWS OCR, custom proximity algorithms, masks, ML, and generative AI, driving new products and features",
      "Moved data out of relational databases into cold storage and set up distributed tools like Spark for offline querying",
    ],
    stack: ["LightGBM", "flairNLP", "PyTorch", "AWS Textract", "Spark"],
  },
  {
    id: "schneider-ds",
    visual: "iot",
    status: "Cut IoT alarm noise by 75% @ Schneider Electric",
    title: "Data Scientist",
    company: "Schneider Electric",
    logo: "/logos/schneider_electric_logo.jpeg",
    url: "https://www.se.com/",
    period: "2020 – 2021",
    duration: "1 yr 4 mo",
    summary:
      "Extracted value from company IoT datasets for internal and external customers.",
    points: [
      "Led fleet device alarm management initiatives; trained customer-facing text classifiers to re-route alarms, reducing alarm load by 75% with F1 scores over 98",
      "Trained a spaCy NER model to classify online product reviews, improving F1 from 30 to 90 by using iterative model predictions to generate cleaner data",
      "Trained a random forest for the Data Center Cooling Simulation engine, cutting total run time from 13s to 10s",
      "Built time series models to predict battery failure from IoT sensors and reduce costly downtime",
    ],
    stack: ["spaCy", "Random Forest", "Time Series", "IoT"],
    metrics: [
      { value: "−75%", label: "alarm load" },
      { value: "30→90", label: "NER F1" },
    ],
  },
  {
    id: "schneider-swe",
    visual: "fleet",
    status: "Tamed 100TB of IoT data @ Schneider Electric",
    title: "Data Science Software Engineer",
    company: "Schneider Electric",
    logo: "/logos/schneider_electric_logo.jpeg",
    url: "https://www.se.com/",
    period: "2019 – 2020",
    duration: "1 yr 1 mo",
    summary:
      "Created and optimized infrastructure to query and report on over 100 terabytes of IoT data.",
    points: [
      "Defined and led a benchmark of common operations on terabytes of data across Hive and Spark; compressed data to 2% of its original size and sped up queries more than 100×",
      "Wrote Spark SQL queries and built pipelines to feed stakeholder dashboards",
      "Led development of a React + Django data discovery tool deployed on Azure with Docker, cutting time-to-data from weeks to zero",
      "Selected and managed the team's Azure stack; built Spark SQL pipelines on Databricks and managed tables for modeling and reporting across teams",
    ],
    stack: ["Spark", "Hive", "Databricks", "Azure", "Django", "React"],
    metrics: [
      { value: "100×", label: "faster queries" },
      { value: "2%", label: "of original size" },
    ],
  },
  {
    id: "transition",
    status: "Retrained from economics to CS, at night",
    title: "Economics → Data Science",
    company: "Self-directed",
    period: "2016 – 2019",
    duration: "3 yrs",
    summary:
      "Took accredited night classes while working part-time at a furniture store to earn a place in a master's program.",
    points: [
      "Completed intro and advanced classes at Harvard Extension School and Boston Metropolitan College",
      "Accepted into and graduated from UMass Amherst's Computer Science master's program",
    ],
    stack: ["Grit", "Night classes", "Caffeine"],
  },
  {
    id: "iquartic",
    status: "Wrangled healthcare data @ iQuartic",
    title: "Analyst",
    company: "iQuartic",
    logo: "/logos/iquartic_llc_logo.jpeg",
    url: "https://iquartic.com/",
    period: "2014 – 2015",
    duration: "1 yr",
    summary:
      "Part of a four-person agile team at a startup focused on healthcare data science.",
    points: [
      "Guided the workflow and UI design of the product using deep knowledge of electronic health records and the preferences of professional medical coders",
      "Automated test-data creation in Python, reducing a full day's work to about 30 minutes",
    ],
    stack: ["Python", "EHR", "Agile"],
  },
]

export type Project = {
  id: string
  title: string
  where: string
  // homepage for `where`, when it's an organization
  whereUrl?: string
  when: string
  description: string
  stack: string[]
  visual: "ocr" | "trees" | "segmentation" | "attention" | "graph"
}

export const projects: Project[] = [
  {
    id: "esg",
    title: "ESG Information Research",
    where: "Boston, MA",
    when: "Sep 2019 – Sep 2020",
    description:
      "Scraped PDFs from corporate websites and used Spark to OCR 20K documents in just a few hours, then loaded everything into Elasticsearch to power several features.",
    stack: ["Spark", "OCR", "Elasticsearch", "Scraping"],
    visual: "ocr",
  },
  {
    id: "olympus",
    title: "Machine Learning Research Intern",
    where: "Olympus",
    whereUrl: "https://www.olympus-global.com/",
    when: "May – Aug 2018",
    description:
      "Experimented with decision trees, linear regression, SVMs, random forests, and other ensembles, improving accuracy from 70% to over 98% and outperforming the existing statistical approach.",
    stack: ["Random Forest", "SVM", "Ensembles"],
    visual: "trees",
  },
  {
    id: "traffic",
    title: "Traffic Levels from Satellite Imagery",
    where: "Amherst, MA",
    when: "Sep – Dec 2018",
    description:
      "Deep convolutional networks using a Fully Convolutional Network architecture for semantic segmentation with transfer learning, detecting roads and cars in Google satellite imagery to estimate traffic.",
    stack: ["CNN", "FCN", "Transfer Learning"],
    visual: "segmentation",
  },
  {
    id: "nmt",
    title: "Neural Machine Translation",
    where: "Amherst, MA",
    when: "Jan – May 2019",
    description:
      "Implemented Google's state-of-the-art machine translation paper using an encoder–decoder architecture with attention.",
    stack: ["Seq2Seq", "Attention", "PyTorch"],
    visual: "attention",
  },
  {
    id: "neo4j",
    title: "Language Model on a Graph Database",
    where: "Boston, MA",
    when: "Jun – Sep 2017",
    description:
      "Built a language model on Neo4j to analyze sentiment about individual product features, not just the product as a whole.",
    stack: ["Neo4j", "Sentiment", "NLP"],
    visual: "graph",
  },
]

export type Degree = {
  school: string
  degree: string
  where: string
  when: string
  detail: string
  courses: string[]
  gpa?: string
  logo?: string
}

export const education: Degree[] = [
  {
    school: "UMass Amherst CICS",
    logo: "/logos/umassamherst_logo.jpeg",
    degree: "MS Computer Science (AI focus)",
    where: "Amherst, MA",
    when: "2017 – 2019",
    gpa: "3.7",
    detail: "Plus a research project on probabilistic models.",
    courses: [
      "Machine Learning",
      "Advanced Algorithms",
      "Artificial Intelligence",
      "Data Visualization",
      "UI",
      "Neural Networks",
      "Mathematical Statistics",
      "Deep Learning for NLP",
    ],
  },
  {
    school: "University of Liverpool",
    logo: "/logos/university_of_liverpool_logo.jpeg",
    degree: "BA Business Economics",
    where: "Liverpool, UK",
    when: "2011 – 2014",
    detail: "Where the love of numbers started.",
    courses: [
      "Mathematics",
      "Statistics for Economics",
      "Micro & Macro",
      "Managerial Economics",
      "Operations",
      "International Business",
    ],
  },
]

export type SkillGroup = { id: string; label: string; skills: string[] }

export const skillGroups: SkillGroup[] = [
  {
    id: "llm",
    label: "LLMs & Agents",
    skills: ["LangGraph", "LiveKit", "RAG", "OpenTelemetry", "Evals", "Prompting"],
  },
  {
    id: "dl",
    label: "Deep Learning",
    skills: ["PyTorch", "HuggingFace", "Transformers", "LSTMs", "Attention", "CNNs / FCNs"],
  },
  {
    id: "ds",
    label: "Data Science",
    skills: ["Pandas", "scikit-learn", "LightGBM", "spaCy", "NLTK", "flairNLP", "sparkNLP"],
  },
  {
    id: "data",
    label: "Big Data",
    skills: ["Spark", "SparkSQL", "Hadoop", "Hive", "Delta Lake", "Databricks", "Elasticsearch"],
  },
  {
    id: "eng",
    label: "Engineering",
    skills: ["Python", "SQL", "JavaScript", "R", "C", "Java", "FastAPI", "Flask", "React", "D3.js", "PostgreSQL", "Docker", "Git", "pytest"],
  },
]

// The "training run" — career milestones plotted as a loss curve
export const trainingRun = [
  { year: 2011, loss: 0.95, label: "Init: BA Business Economics", note: "University of Liverpool" },
  { year: 2014, loss: 0.82, label: "First startup", note: "Analyst @ iQuartic, healthcare data" },
  { year: 2016, loss: 0.74, label: "Night classes", note: "Furniture store by day, Harvard Extension by night" },
  { year: 2017, loss: 0.6, label: "Fine-tune: MS CS", note: "UMass Amherst, AI focus" },
  { year: 2019, loss: 0.42, label: "Scale up", note: "100TB of IoT data @ Schneider Electric" },
  { year: 2021, loss: 0.28, label: "NLP in production", note: "Gradient AI, first standalone NLP products" },
  { year: 2024, loss: 0.16, label: "Staff", note: "Tech lead, GenAI & RAG" },
  { year: 2025, loss: 0.08, label: "Agents", note: "Long-horizon voice agents @ Liberate AI" },
]

export const stats = [
  { value: 7, suffix: "+", label: "years shipping ML" },
  { value: 100, suffix: "TB", label: "IoT data tamed" },
  { value: 100, suffix: "×", label: "faster queries" },
  { value: 75, suffix: "%", label: "less alarm noise" },
  { value: 98, suffix: "%", label: "accuracy, from 70%" },
]

export type Post = {
  slug: string
  title: string
  summary: string
  tags: string[]
  // set date + url when a post goes live; until then it shows as a draft
  date?: string
  readingTime?: string
  url?: string
}

export const posts: Post[] = [
  {
    slug: "long-horizon-voice-agents",
    title: "Keeping voice agents on track for 20-minute calls",
    summary: "State, memory, and guardrails for agents that have to stay coherent long after the first turn.",
    tags: ["agents", "voice", "LLMs"],
  },
  {
    slug: "llm-evals-that-matter",
    title: "Evals that actually catch regressions",
    summary: "What changed when testing every prompt change went from hours by hand to minutes in CI.",
    tags: ["evals", "testing"],
  },
  {
    slug: "100tb-of-iot",
    title: "Lessons from 100TB of IoT telemetry",
    summary: "Partitioning, Spark tuning, and why most alarms are noise.",
    tags: ["Spark", "data engineering"],
  },
  {
    slug: "economics-to-ml",
    title: "From economics to ML, one night class at a time",
    summary: "The long way into machine learning, and what it taught me about learning.",
    tags: ["career"],
  },
]
