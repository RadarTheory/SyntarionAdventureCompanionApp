import { useMemo, useState } from 'react';
import type { Authority, Scope } from './types';
import {
  writingAssistantFolders,
  writingAssistantModes,
  writingAssistantRules,
  writingAssistantSubfolders,
} from './writingAssistantSettings';

const authorities: Authority[] = ['Canon', 'Draft', 'Reference', 'Historical', 'Inspiration'];
const scopes: Scope[] = ['Global', 'Series', 'Campaign', 'Private'];

const systems = [
  { id: 'brain', label: 'Brain' },
  { id: 'scribe', label: 'Scribe' },
  { id: 'atlas', label: 'Atlas' },
  { id: 'integration', label: 'Integration' },
  { id: 'settings', label: 'Settings' },
] as const;

const sampleDocuments = [
  { title: 'Soteria World Primer', authority: 'Canon', scope: 'Global', status: 'Indexed', chunks: 128, conflicts: 0 },
  { title: 'Avalora Campaign Notes', authority: 'Draft', scope: 'Campaign', status: 'Needs Review', chunks: 44, conflicts: 2 },
  { title: 'Grimoire Fragment Index', authority: 'Historical', scope: 'Series', status: 'Indexed', chunks: 76, conflicts: 1 },
] satisfies Array<{ title: string; authority: Authority; scope: Scope; status: string; chunks: number; conflicts: number }>;

const evidence = [
  {
    kind: 'Fact',
    authority: 'Canon',
    source: 'Soteria World Primer',
    text: 'The Canon Brain is the source of approved world knowledge for Oracle.',
  },
  {
    kind: 'Inference',
    authority: 'Draft',
    source: 'Avalora Campaign Notes',
    text: 'Campaign-local notes suggest two rival accounts of the southern pass.',
  },
  {
    kind: 'Fact',
    authority: 'Historical',
    source: 'Grimoire Fragment Index',
    text: 'Historical fragments remain searchable but do not supersede canon.',
  },
];

const approvals = [
  ['Fact Update', 'Promote Avalora pass name', 'Conflicts with Soteria World Primer'],
  ['Relationship', 'Link Theryn to the Verdeliere route', 'Requires campaign scope confirmation'],
  ['Canon Correction', 'Archive old Zephyria college spelling', 'Historical source only'],
];

const pins = [
  { name: 'Avalora', type: 'City', x: 37, y: 34 },
  { name: 'Chronolithe Wastes', type: 'Region', x: 61, y: 48 },
  { name: 'Zephyria College', type: 'Landmark', x: 72, y: 27 },
  { name: 'Razor Point', type: 'Port', x: 48, y: 70 },
];

const integrationDomains = ['Characters', 'Campaigns', 'Combat', 'Story Events', 'Quests', 'Relationships', 'Grimoire', 'Journals'];

function App() {
  const [activeSystem, setActiveSystem] = useState<(typeof systems)[number]['id']>('brain');
  const [title, setTitle] = useState('');
  const [authority, setAuthority] = useState<Authority>('Draft');
  const [scope, setScope] = useState<Scope>('Private');
  const [query, setQuery] = useState('What do we know about Avalora routes?');
  const [draft, setDraft] = useState('Outline the next chapter with canon citations and flag anything inferred.');
  const [documents, setDocuments] = useState(sampleDocuments);

  const authorityMix = useMemo(() => {
    return authorities
      .map((item) => ({ authority: item, count: documents.filter((doc) => doc.authority === item).length }))
      .filter((item) => item.count > 0);
  }, [documents]);

  const stageDocument = () => {
    if (!title.trim()) return;
    setDocuments((current) => [
      { title: title.trim(), authority, scope, status: 'Staged', chunks: 0, conflicts: 0 },
      ...current,
    ]);
    setTitle('');
    setAuthority('Draft');
    setScope('Private');
  };

  return (
    <main className="oracle-shell">
      <header className="topbar">
        <div>
          <p className="kicker">Syntarion Knowledge Platform</p>
          <h1>Oracle</h1>
        </div>
        <div className="status"><span /> Approval Locked</div>
      </header>

      <section className="command">
        <div>
          <p className="kicker">Persistent creative intelligence</p>
          <h2>Canon Brain, Scribe, Atlas, and Syntarion signals in one durable system.</h2>
          <p>
            Oracle retrieves before generating, separates facts from inference, keeps source authority visible,
            and sends every canon-changing idea through approval.
          </p>
        </div>
        <label className="query-box">
          <span>Retrieval prompt</span>
          <textarea value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="button">Retrieve Evidence</button>
        </label>
      </section>

      <nav className="tabs" aria-label="Oracle systems">
        {systems.map((system) => (
          <button
            type="button"
            key={system.id}
            className={activeSystem === system.id ? 'active' : ''}
            onClick={() => setActiveSystem(system.id)}
          >
            {system.label}
          </button>
        ))}
      </nav>

      {activeSystem === 'brain' && (
        <section className="grid brain-grid">
          <section className="panel span-2">
            <PanelHeader kicker="Canon Brain" title="Document Intake" pill="No auto-canon" />
            <div className="upload-row">
              <input aria-label="Document title" placeholder="Document title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <select aria-label="Authority" value={authority} onChange={(event) => setAuthority(event.target.value as Authority)}>
                {authorities.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select aria-label="Scope" value={scope} onChange={(event) => setScope(event.target.value as Scope)}>
                {scopes.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" onClick={stageDocument}>Stage Source</button>
            </div>
            <div className="document-list">
              {documents.map((document) => (
                <article key={`${document.title}-${document.authority}`}>
                  <div>
                    <strong>{document.title}</strong>
                    <small>{document.authority} / {document.scope}</small>
                  </div>
                  <div>
                    <span>{document.status}</span>
                    <small>{document.chunks} chunks / {document.conflicts} conflicts</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <p className="kicker">Knowledge Shape</p>
            <div className="stat-grid">
              {[
                ['3', 'Documents', '2 indexed, 1 review'],
                ['248', 'Structured Facts', '31 awaiting approval'],
                ['96', 'Relationships', 'entities linked'],
                ['3', 'Conflicts', 'explain before merge'],
              ].map(([value, label, detail]) => (
                <article className="stat" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{detail}</small>
                </article>
              ))}
            </div>
            <div className="bars">
              {authorityMix.map((item) => (
                <div key={item.authority}>
                  <span>{item.authority}</span>
                  <i style={{ width: `${Math.max(18, item.count * 24)}%` }} />
                </div>
              ))}
            </div>
          </section>

          <EvidencePanel />
          <ApprovalPanel />
        </section>
      )}

      {activeSystem === 'scribe' && (
        <section className="grid">
          <section className="panel span-2">
            <PanelHeader kicker="Scribe" title="Writing Workspace" pill="Citations required" />
            <textarea className="draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
            <div className="action-row">
              <button type="button">Outline</button>
              <button type="button">Summarize</button>
              <button type="button">Consistency Check</button>
              <button type="button">Propose Canon Update</button>
            </div>
          </section>
          <GuardrailPanel />
          <ApprovalPanel />
        </section>
      )}

      {activeSystem === 'atlas' && (
        <section className="grid">
          <section className="panel span-2">
            <PanelHeader kicker="Atlas" title="Structured World Map" pill="Tile-ready" />
            <div className="map">
              {pins.map((pin) => (
                <button
                  type="button"
                  key={pin.name}
                  className="pin"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  title={`${pin.name} / ${pin.type}`}
                />
              ))}
            </div>
          </section>
          <section className="panel">
            <p className="kicker">Geographic Reasoning</p>
            <ul className="checklist">
              <li>Pins, regions, roads, and routes are structured data.</li>
              <li>Distance tools use coordinates and scale metadata.</li>
              <li>Notes cite source documents and campaign state.</li>
              <li>AI answers from map records, not image guessing.</li>
            </ul>
          </section>
          <section className="panel span-3 table">
            {pins.map((pin) => (
              <article key={pin.name}>
                <strong>{pin.name}</strong>
                <span>{pin.type}</span>
                <small>{pin.x}, {pin.y}</small>
              </article>
            ))}
          </section>
        </section>
      )}

      {activeSystem === 'integration' && (
        <section className="grid">
          <section className="panel span-2">
            <PanelHeader kicker="Integration Layer" title="Syntarion Signal Bus" pill="Read live state" />
            <div className="domain-grid">
              {integrationDomains.map((domain) => (
                <article key={domain}>
                  <strong>{domain}</strong>
                  <small>Authenticated API consumer</small>
                </article>
              ))}
            </div>
          </section>
          <section className="panel">
            <p className="kicker">Boundary Rule</p>
            <p className="body-copy">
              Syntarion remains the source of live gameplay state. Oracle reads, cites, and proposes;
              it never edits Syntarion directly.
            </p>
          </section>
          <ApprovalPanel />
        </section>
      )}
      {activeSystem === 'settings' && (
        <section className="grid">
          <section className="panel span-2">
            <PanelHeader kicker="Writing Assistant" title="Settings Package" pill="Drive-shaped" />
            <p className="body-copy">
              Oracle uses the current Soteria Google Drive organization as the retrieval schema for writing.
              These settings tell the assistant where to look, how to rank sources, and which outputs require approval.
            </p>
            <div className="folder-grid">
              {writingAssistantFolders.map((folder) => (
                <article key={folder.key}>
                  <strong>{folder.order}. {folder.label}</strong>
                  <span>{folder.driveTitle}</span>
                  <small>{folder.driveFolderId}</small>
                  <p>{folder.purpose}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <p className="kicker">Assistant Modes</p>
            <div className="chip-grid">
              {writingAssistantModes.map((mode) => (
                <span key={mode}>{mode.replaceAll('_', ' ')}</span>
              ))}
            </div>
          </section>

          <section className="panel">
            <p className="kicker">Settings Folders</p>
            <div className="subfolder-list">
              {writingAssistantSubfolders.map((folder) => (
                <code key={folder}>{folder}</code>
              ))}
            </div>
          </section>

          <section className="panel span-2">
            <PanelHeader kicker="Rules" title="Writing Guardrails" pill="Always on" />
            <ul className="checklist">
              {writingAssistantRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </section>
      )}
    </main>
  );
}

function PanelHeader({ kicker, title, pill }: { kicker: string; title: string; pill: string }) {
  return (
    <div className="panel-header">
      <div>
        <p className="kicker">{kicker}</p>
        <h3>{title}</h3>
      </div>
      <span className="pill">{pill}</span>
    </div>
  );
}

function EvidencePanel() {
  return (
    <section className="panel span-2">
      <PanelHeader kicker="Retrieval" title="Evidence Before Generation" pill="Query staged" />
      <div className="evidence-list">
        {evidence.map((item) => (
          <article key={item.source}>
            <span>{item.kind}</span>
            <p>{item.text}</p>
            <small>{item.source} / {item.authority}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApprovalPanel() {
  return (
    <section className="panel">
      <PanelHeader kicker="Approval Queue" title="User-Gated Canon" pill={`${approvals.length} waiting`} />
      <div className="approval-list">
        {approvals.map(([type, title, risk]) => (
          <article key={title}>
            <strong>{title}</strong>
            <span>{type}</span>
            <p>{risk}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function GuardrailPanel() {
  return (
    <section className="panel">
      <p className="kicker">Guardrails</p>
      <ul className="checklist">
        <li>Retrieve canon and draft sources first.</li>
        <li>Mark inference separately from fact.</li>
        <li>Show contradictions before revisions.</li>
        <li>Queue canon changes for approval.</li>
      </ul>
    </section>
  );
}

export default App;
