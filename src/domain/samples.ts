export interface Template {
  readonly id: string;
  readonly name: string;
  readonly code: string;
}

export const TEMPLATES: readonly Template[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    code: `flowchart LR
  A(Write) --> B(Preview)
  B --> C(Export)
  B --> D(Docs Asset)`,
  },
  {
    id: 'sequence',
    name: 'Sequence',
    code: `sequenceDiagram
  participant U as User
  participant A as API
  participant D as Database
  U->>A: POST /orders
  A->>D: Insert order
  D-->>A: Order id
  A-->>U: 201 Created`,
  },
  {
    id: 'class',
    name: 'Class',
    code: `classDiagram
  class Order {
    +String id
    +Money total
    +place()
  }
  class LineItem {
    +String sku
    +int quantity
  }
  class Customer {
    +String email
  }
  Customer "1" --> "*" Order
  Order "1" *-- "*" LineItem`,
  },
  {
    id: 'er',
    name: 'Entity-Relationship',
    code: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "ordered in"
  CUSTOMER {
    string id PK
    string email
  }
  ORDER {
    string id PK
    date created
  }`,
  },
  {
    id: 'gantt',
    name: 'Gantt',
    code: `gantt
  title Release plan
  dateFormat YYYY-MM-DD
  section Build
  Design        :done, d1, 2026-01-05, 5d
  Implement     :active, i1, after d1, 10d
  section Ship
  QA            :q1, after i1, 4d
  Launch        :milestone, after q1, 0d`,
  },
  {
    id: 'state',
    name: 'State',
    code: `stateDiagram-v2
  [*] --> Draft
  Draft --> Review : submit
  Review --> Draft : request changes
  Review --> Published : approve
  Published --> [*]`,
  },
];

export const DEFAULT_CODE = TEMPLATES[0]?.code ?? 'flowchart LR\n  A --> B';

export const SAMPLE_API_GATEWAY = `flowchart LR
  client[Web / Mobile Client] --> gw[API Gateway]
  gw --> auth[Auth Check]
  gw --> rate[Rate Limit]
  auth --> users[User Service]
  auth --> orders[Order Service]
  auth --> billing[Billing Service]
  users --> udb[(User DB)]
  orders --> odb[(Order DB)]
  billing --> pay[Payment Provider]
  rate --> obs[Observability]`;

export const SAMPLE_GIT_GRAPH = `gitGraph
  commit id: "main"
  branch feature/auth
  commit id: "login"
  commit id: "tests"
  checkout main
  merge feature/auth
  branch release/v1
  commit id: "rc"
  checkout main
  merge release/v1 tag: "v1.0"
  branch hotfix
  commit id: "patch"
  checkout main
  merge hotfix tag: "v1.0.1"`;

export const SAMPLE_PIE = `pie title Export formats in docs
  "PNG" : 48
  "SVG" : 32
  "WebP" : 20`;

export const SAMPLE_PIPELINE = `flowchart LR
  push[Push to main] --> ci[CI build]
  ci --> test{Tests pass?}
  test -->|yes| image[Build image]
  image --> stage[Deploy to staging]
  test -->|no| notify[Notify author]`;

/** Card preview sample per theme, mirroring the reference gallery. */
export const THEME_SAMPLES: Readonly<Record<string, string>> = {
  'clean-docs': SAMPLE_API_GATEWAY,
  'github-readme': SAMPLE_GIT_GRAPH,
  'github-dark': SAMPLE_PIPELINE,
  editorial: SAMPLE_API_GATEWAY,
  'whiteboard-sketch': SAMPLE_GIT_GRAPH,
  'warm-editorial': SAMPLE_PIE,
  'aurora-noir': SAMPLE_API_GATEWAY,
  blueprint: SAMPLE_GIT_GRAPH,
  champagne: SAMPLE_PIE,
  'emerald-suite': SAMPLE_API_GATEWAY,
};
