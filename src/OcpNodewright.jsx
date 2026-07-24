import { useEffect, useMemo, useState } from 'react';
import './ocp-nodewright.css';
import { recordLotjarrsGameResult } from './gameStats';

const STORAGE_KEY = 'soteria_ocp_nodewright_v1';
const TUTORIAL_KEY = 'soteria_ocp_nodewright_tutorial_v1';


const NODEWRIGHT_HINTS = [
  'Start with Nodes. Bestow all five nodes, then drag them into the silent route.',
  'A LOW Magus risk means the mimicry contract is aligned. HIGH means a method, endpoint, path, or formula is wrong.',
  'Select any node and open Config to inspect its input_fields, output_fields, endpoint, and formula.',
  'Use Connect on the source node, then Connect on the next node to forge an edge.',
  'Run Tuning Calls before validation. The silent report only seals after the service result exists.',
];
const TUTORIAL_STEPS = [
  {
    title: 'Welcome to the Relay',
    speaker: 'Scribe Liora',
    text: 'Soteria has a damaged civic relay. Your job is to read Java like a field engineer, turn the important values into JSON, then wire them into a Nodewright relay canvas. For the clearest canvas view, rotate your device sideways or play in a desktop browser.',
  },
  {
    title: 'Read Before You Build',
    speaker: 'Castor of the Relay',
    text: 'Java tells you what the service does. Look for the public method, the request values it reads, and the reply values it returns. Those become the inputs and outputs of your node.',
  },
  {
    title: 'Think in Relay Nodes',
    speaker: 'Warden Ione',
    text: 'Relay flows are built from nodes connected by edges. A bestowed service node can call an endpoint, map JSON paths into output fields, and pass those fields into the next node.',
  },
  {
    title: 'Earn the Seal',
    speaker: 'Argus the Tester',
    text: 'Each challenge seals part of the relay. You gain XP, ranks, and relics as you prove you can read code, shape JSON, connect nodes, and test an API contract.',
  },
];


const BESTOWED_NODE_TYPES = [
  'Alpha', 'Alphanumeric', 'Numeric', 'Amount', 'Date', 'Date Range', 'Text',
  'Intent', 'Entity', 'Ask', 'YesNo', 'Announcement', 'Intelli', 'Web Service',
  'Corpus Collection', 'Flow', 'Shared Flow', 'Condition', 'Anything Else?',
  'Transfer', 'Set Field', 'Log', 'Concierge Agent', 'Task Agent', 'Q&A Agent', 'Router Agent',
];

const API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const FIELD_HINTS = {
  type: 'For this mission, the tuning and census calls behave like Web Service nodes, the count behaves like Intelli, and the report behaves like Announcement.',
  input_fields: 'Map local relay fields into the node. The census node needs mimicryBand, location, and includeApprentices.',
  output_fields: 'The count node must produce TotalObserved and MagusRisk for the silent report.',
  output_paths: 'The census node must map $.citizenCount and $.apprenticeCount exactly.',
  method: 'The mimicry tuning call uses POST. The College census call uses GET.',
  endpoint: 'The mission endpoints are /api/v2/whythryn/mimicry/tune and /api/v2/college-of-magic/census?wizards=true&includeApprentices=true.',
  request_body: 'The mimicry call body identifies the armor unit, doctrine, and requested scope.',
  query_params: 'The census query asks for wizards, apprentices, and College of Magic location.',
  formula: 'The count node formula must be citizenCount + apprenticeCount.',
  message: 'The final report should preserve the LOW Magus risk result after the count resolves.',
};
const REWARDS = [
  { xp: 80, title: 'Apprentice Reader', item: 'Copper Syntax Lens' },
  { xp: 170, title: 'Field Mapper', item: 'Relay Port Compass' },
  { xp: 280, title: 'Canvas Nodewright', item: 'Soterian Flow Seal' },
  { xp: 400, title: 'API Adept', item: 'Glass Endpoint Key' },
  { xp: 560, title: 'Whythryn Nodewright', item: 'Quiet Cogmail Tuning Key' },
];

const MISSIONS = [
  {
    id: 'synod-flow',
    title: 'Tune the Whyth Census Flow',
    role: 'Whyth Stonemaster Veyr',
    brief: 'Tune Whythryn armor to mimic a harmless arcane signal and count wizard citizens and apprentices without waking the Magus.',
    episode: 'Main Quest - Whythryn Mimicry Relay',
    story: 'The Whyth have found a way to tune their armor so it mimics magic instead of severing it outright. Build the flow like a Nodewright relay: intake the armor signal, tune the mimicry layer, query the College census, count wizard citizens and apprentices, then return a silent report.',
    challenge: 'Configure the nodes exactly. A wrong method, endpoint, JSON path, or formula will fail the connection or raise Magus detection risk.',
    xp: 160,
  },
  {
    id: 'java-reader',
    title: 'Read the Service',
    role: 'Scribe Liora',
    brief: 'Decode the Java handler before it becomes a bestowed service node.',
    episode: 'Episode I - The Silent Registry',
    story: 'A citizen registry under Albion has gone quiet. Liora has recovered one Java class from the relay archive, but the field names are buried in the code.',
    challenge: 'Identify the public method, the request inputs, and the reply outputs. This teaches you to scan Java for useful data flow instead of trying to understand every word at once.',
    xp: 80,
  },
  {
    id: 'json-mapper',
    title: 'Bind Inputs and Outputs',
    role: 'Castor of the Relay',
    brief: 'Map Java and JSON fields into the Nodewright node configuration.',
    episode: 'Episode II - The Port Compass',
    story: 'Castor opens the relay housing and finds a half-valid node manifest. If the field names do not line up, the next node will hear silence.',
    challenge: 'Keep the JSON valid while mapping Java request values into Nodewright input_fields and service response values into output_fields.',
    xp: 90,
  },
  {
    id: 'canvas-forge',
    title: 'Connect the Canvas',
    role: 'Warden Ione',
    brief: 'Arrange nodes and edges like an Nodewright relay flow.',
    episode: 'Episode III - The Glass Causeway',
    story: 'The relay can speak again, but the path through it is broken. Ione needs the nodes laid out in the order a real conversation would travel.',
    challenge: 'Build the route: greet the user, call the Web Service, branch on the returned status, then announce the result.',
    xp: 110,
  },
  {
    id: 'api-contract',
    title: 'Seal the API Contract',
    role: 'Argus the Tester',
    brief: 'Choose the method, endpoint, JSON paths, and success condition.',
    episode: 'Episode IV - The Verification Gate',
    story: 'Argus will not let the relay deploy until the API contract is exact. One wrong path means the flow cannot find the status it needs.',
    challenge: 'Enter the endpoint, output JSON paths, and success condition that would let a bestowed service node pull the right values from a response.',
    xp: 120,
  },
];

const JAVA_SNIPPET = `public class SoteriaStatusService {
  public SoteriaReply lookup(SoteriaRequest request) {
    String citizenId = request.getCitizenId();
    String ward = request.getWard();

    ApiResult result = registryClient.fetchStatus(citizenId, ward);

    return new SoteriaReply(
      result.getCaseId(),
      result.getStatus(),
      result.getNextStep()
    );
  }
}`;

const START_JSON = `{
  "title": "Soteria_Status_WS",
  "configuration": {
    "input_fields": {
      "citizenId": "CitizenId",
      "ward": "Ward"
    },
    "output_fields": [
      {
        "miniapp_name": "caseId",
        "local_name": "CaseId",
        "optional": false,
        "locked": true
      },
      {
        "miniapp_name": "status",
        "local_name": "CaseStatus",
        "optional": false,
        "locked": true
      },
      {
        "miniapp_name": "nextStep",
        "local_name": "NextStep",
        "optional": false,
        "locked": true
      }
    ],
    "referents": []
  }
}`;

const SYNOD_WIZARD_ROSTER = [
  { id: 'grey-one', name: 'The Grey One', aliases: ['grey one', 'the grey one'], className: 'Wizard', rank: 'Bound Archwizard', apprentices: 3, location: 'Fubin Threshold', synodContact: true },
  { id: 'malakar-adnan', name: 'Malakar Adnan', aliases: ['malakar', 'malakar adnan'], className: 'Darkweaver', rank: 'Forbidden Founder', apprentices: 0, location: 'Historical Record', synodContact: false },
  { id: 'castor-relay', name: 'Castor of the Relay', aliases: ['castor', 'castor of the relay'], className: 'Castor', rank: 'Relay Magus', apprentices: 2, location: 'Zephyrian Synod Relay', synodContact: true },
  { id: 'liora-scribe', name: 'Scribe Liora', aliases: ['liora', 'scribe liora'], className: 'Scribe', rank: 'Archive Wizard', apprentices: 4, location: 'College of Magic', synodContact: true },
  { id: 'ione-warden', name: 'Warden Ione', aliases: ['ione', 'warden ione'], className: 'Warden', rank: 'Nullward Tutor', apprentices: 1, location: 'College of Magic', synodContact: true },
  { id: 'argus-tester', name: 'Argus the Tester', aliases: ['argus', 'argus the tester'], className: 'Sage', rank: 'Contract Examiner', apprentices: 2, location: 'College of Magic', synodContact: true },
  { id: 'maelis-vey', name: 'Maelis Vey', aliases: ['maelis', 'maelis vey'], className: 'Magus', rank: 'Synod Contact', apprentices: 5, location: 'College of Magic', synodContact: true },
  { id: 'tor-vance', name: 'Tor Vance', aliases: ['tor', 'tor vance'], className: 'Wizard', rank: 'Synod Contact', apprentices: 2, location: 'College of Magic', synodContact: true },
];

function normalizeQuery(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findWizardIdentity(message) {
  const normalized = normalizeQuery(message);
  return SYNOD_WIZARD_ROSTER.find((wizard) => wizard.aliases.some((alias) => normalized.includes(alias)) || normalized.includes(normalizeQuery(wizard.name)));
}

function countWizardClass(className) {
  return SYNOD_WIZARD_ROSTER.filter((wizard) => wizard.className.toLowerCase() === String(className || '').toLowerCase()).length;
}

function countWizardApprentices(wizardId) {
  const wizard = SYNOD_WIZARD_ROSTER.find((entry) => entry.id === wizardId);
  return wizard?.apprentices || 0;
}

const SYNOD_CONTACTS_LEDGER = [
  { contactId: 'ZEP-001', name: 'Maelis Vey', synodTier: 'Aurum', location: 'College of Magic', presence: 'present', channel: 'arcane-ledger' },
  { contactId: 'ZEP-002', name: 'Orren Caldus', synodTier: 'Argent', location: 'College of Magic', presence: 'present', channel: 'voice-vault' },
  { contactId: 'ZEP-003', name: 'Seraphine Tallow', synodTier: 'Aurum', location: 'Zephyrian Annex', presence: 'present', channel: 'arcane-ledger' },
  { contactId: 'ZEP-004', name: 'Nadir Sol', synodTier: 'Obsidian', location: 'College of Magic', presence: 'away', channel: 'sealed-scroll' },
  { contactId: 'ZEP-005', name: 'Ilyra Penn', synodTier: 'Argent', location: 'College of Magic', presence: 'present', channel: 'voice-vault' },
  { contactId: 'ZEP-006', name: 'Tor Vance', synodTier: 'Aurum', location: 'College of Magic', presence: 'present', channel: 'arcane-ledger' },
  { contactId: 'ZEP-007', name: 'Cindra Oath', synodTier: 'Argent', location: 'North Scriptorium', presence: 'present', channel: 'sealed-scroll' },
];

const REQUIRED_SYNOD_FLOW = ['wizard-intake', 'synod-auth', 'college-presence', 'presence-count', 'wizard-report'];
const REQUIRED_SYNOD_EDGES = REQUIRED_SYNOD_FLOW.slice(0, -1).map((nodeId, index) => [nodeId, REQUIRED_SYNOD_FLOW[index + 1]]);

const SYNOD_NODE_BLUEPRINTS = [
  {
    id: 'wizard-intake',
    title: 'Whyth Armor Intake',
    type: 'Announcement',
    routingRole: 'Armor signal intake',
    x: 72,
    y: 112,
    purpose: 'Collects the Whythryn armor signal and opens the silent census flow.',
    config: {
      input_fields: {},
      output_fields: { armorUnitId: 'WhythArmorUnitId', requestTopic: 'RequestTopic' },
      message: 'Whythryn armor requests a low-echo census of wizard citizens and apprentices.',
    },
  },
  {
    id: 'synod-auth',
    title: 'Mimicry Tuning API',
    type: 'Web Service',
    routingRole: 'Arcane mimicry tuning',
    x: 315,
    y: 72,
    purpose: 'Tunes the armor signature so the request resembles ordinary College maintenance traffic.',
    config: {
      method: 'POST',
      endpoint: '/api/v2/whythryn/mimicry/tune',
      input_fields: { armorUnitId: 'WhythArmorUnitId', requestedScope: 'college.census.read' },
      request_body: { armorUnitId: 'WHY-044', doctrine: 'Heart and Hand', requestedScope: 'college.census.read' },
      output_paths: { tuned: '$.tuned', mimicryBand: '$.mimicryBand', magusRisk: '$.magusRisk' },
    },
    responseJson: { tuned: true, mimicryBand: 'LOW_ECHO_ARCANE', magusRisk: 'LOW' },
  },
  {
    id: 'college-presence',
    title: 'College Census API',
    type: 'Web Service',
    routingRole: 'College census inquiry',
    x: 555,
    y: 152,
    purpose: 'Queries the College census through the tuned armor signal.',
    config: {
      method: 'GET',
      endpoint: '/api/v2/college-of-magic/census?wizards=true&includeApprentices=true',
      input_fields: { mimicryBand: 'LOW_ECHO_ARCANE', location: 'College of Magic', includeApprentices: true },
      query_params: { wizards: true, includeApprentices: true, location: 'College of Magic' },
      output_paths: { citizenCount: '$.citizenCount', apprenticeCount: '$.apprenticeCount', magusRisk: '$.magusRisk' },
    },
    responseJson: {
      location: 'College of Magic',
      citizenCount: getWhythWizardCitizenCount(),
      apprenticeCount: getWhythWizardApprenticeCount(),
      magusRisk: 'LOW',
    },
  },
  {
    id: 'presence-count',
    title: 'Count Citizens and Apprentices',
    type: 'Function',
    routingRole: 'Census count aggregation',
    x: 790,
    y: 92,
    purpose: 'Aggregates the census response into the counts the Whyth need.',
    config: {
      input_fields: { citizenCount: 'WizardCitizenCount', apprenticeCount: 'WizardApprenticeCount' },
      formula: 'citizenCount + apprenticeCount',
      output_fields: { totalObserved: 'TotalObserved', magusRisk: 'MagusRisk' },
    },
  },
  {
    id: 'wizard-report',
    title: 'Silent Whyth Report',
    type: 'Announcement',
    routingRole: 'Whyth-facing silent report',
    x: 1015,
    y: 160,
    purpose: 'Returns the counts to the Whyth without broadcasting a magical signature.',
    config: {
      input_fields: { totalObserved: 'TotalObserved', magusRisk: 'MagusRisk' },
      message: 'Whythryn scan complete: 5 wizard citizens and 14 apprentices observed. Magus risk remains LOW.',
      output_fields: { reportDelivered: 'WhythReportDelivered' },
    },
  },
];

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config || {}));
}

function createFlowNode(blueprint) {
  return { ...blueprint, config: cloneConfig(blueprint.config) };
}

function createDefaultConfigForType(type) {
  const normalized = String(type || '').toLowerCase();
  const base = { input_fields: {}, output_fields: { result: 'NodeResult' } };
  if (normalized === 'web service') {
    return {
      ...base,
      method: 'GET',
      endpoint: '/api/v2/nodewright/example',
      headers: { 'x-relay-sigil': '#RelaySigil' },
      query_params: {},
      request_body: {},
      output_paths: { result: '$.result' },
      timeout_ms: 12000,
    };
  }
  if (normalized === 'intelli') return { ...base, formula: 'inputValue' };
  if (normalized === 'announcement') return { ...base, message: 'Relay message.' };
  if (normalized === 'condition') return { ...base, conditions: [{ field: 'Status', operator: 'equals', value: 'READY' }] };
  if (normalized === 'set field') return { ...base, field_action: 'set', field_name: 'RelayField', field_value: '#NodeResult' };
  if (normalized === 'transfer') return { ...base, target: 'RelayDesk' };
  if (normalized.includes('agent')) return { ...base, tools: [], instructions: 'Resolve the assigned relay task.' };
  if (['alpha', 'alphanumeric', 'numeric', 'amount', 'date', 'date range', 'text', 'entity', 'ask', 'yesno', 'intent'].includes(normalized)) {
    return { ...base, prompt: `Collect ${type}.`, validation: { required: true } };
  }
  return base;
}

function createCustomNode(type, index) {
  const id = `custom-${Date.now()}-${index}`;
  return {
    id,
    title: `${type} Node`,
    type,
    routingRole: 'Learner configured node',
    x: 140 + (index % 5) * 220,
    y: 180 + Math.floor(index / 5) * 150,
    purpose: `Bestowed ${type} node configured by the learner.`,
    config: createDefaultConfigForType(type),
  };
}

function buildApiTesterPayload(selectedNode, apiRun) {
  if (!selectedNode) {
    return {
      status: 'NO_NODE_SELECTED',
      helper: 'Select a node to inspect its request, config, and expected response.',
    };
  }
  return {
    node: {
      id: selectedNode.id,
      title: selectedNode.title,
      bestowed_type: selectedNode.type,
      routing_role: selectedNode.routingRole,
    },
    request_config: {
      method: selectedNode.config.method || 'INTERNAL',
      endpoint: selectedNode.config.endpoint || null,
      timeout_ms: selectedNode.config.timeout_ms || null,
      headers: selectedNode.config.headers || {},
      query_params: selectedNode.config.query_params || {},
      request_body: selectedNode.config.request_body || {},
      form_data: selectedNode.config.form_data || {},
    },
    response_mapping: {
      output_paths: selectedNode.config.output_paths || {},
      output_fields: selectedNode.config.output_fields || {},
    },
    local_logic: {
      formula: selectedNode.config.formula || null,
      message: selectedNode.config.message || null,
      conditions: selectedNode.config.conditions || [],
    },
    latest_test_result: apiRun || 'Run tuning calls to inspect the latest service result.',
  };
}

function getWhythWizardCitizens() {
  return SYNOD_WIZARD_ROSTER.filter((wizard) => wizard.synodContact && wizard.location === 'College of Magic');
}

function getWhythWizardCitizenCount() {
  return getWhythWizardCitizens().length;
}

function getWhythWizardApprenticeCount() {
  return getWhythWizardCitizens().reduce((total, wizard) => total + wizard.apprentices, 0);
}

function getWhythCensusTotal() {
  return getWhythWizardCitizenCount() + getWhythWizardApprenticeCount();
}

function edgeId(source, target) {
  return `${source}->${target}`;
}

function hasEdge(edges, source, target) {
  return edges.some((edge) => edge.source === source && edge.target === target);
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { xp: 0, complete: [] };
  } catch {
    return { xp: 0, complete: [] };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function hasSeenTutorial() {
  return localStorage.getItem(TUTORIAL_KEY) === '1';
}

function getRank(xp) {
  return [...REWARDS].reverse().find((reward) => xp >= reward.xp) || { title: 'Initiate', item: 'Blank Canvas Token' };
}

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

function configEditorValue(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '{}';
  return prettyJson(value);
}

export default function OcpNodewright({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenTutorial());
  const [tutorialStep, setTutorialStep] = useState(0);
  const [missionId, setMissionId] = useState('synod-flow');
  const [answers, setAnswers] = useState({
    method: '',
    inputs: [],
    outputs: [],
    nodeOrder: [],
    endpoint: '',
    pathCase: '',
    pathStatus: '',
    condition: '',
  });
  const [jsonText, setJsonText] = useState(START_JSON);
  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [connectionSource, setConnectionSource] = useState(null);
  const [connectionDrag, setConnectionDrag] = useState(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [apiRun, setApiRun] = useState(null);
  const [toast, setToast] = useState('');
  const [scribeOpen, setScribeOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [scribeInput, setScribeInput] = useState('');
  const [scribeIdentity, setScribeIdentity] = useState(null);
  const [scribeMessages, setScribeMessages] = useState([
    { from: 'scribe', text: 'Scribe test ready. Try: I am The Grey One. Then ask: class count or apprentice count.' },
  ]);

  const activeMission = MISSIONS.find((mission) => mission.id === missionId) || MISSIONS[0];
  const rank = getRank(progress.xp);
  const completed = new Set(progress.complete);
  const nextReward = REWARDS.find((reward) => progress.xp < reward.xp);
  const selectedNode = flowNodes.find((node) => node.id === selectedNodeId) || flowNodes[flowNodes.length - 1] || null;
  const apiTesterText = useMemo(() => prettyJson(buildApiTesterPayload(selectedNode, apiRun)), [apiRun, selectedNode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHintIndex((index) => (index + 1) % NODEWRIGHT_HINTS.length);
      setHintVisible(true);
    }, 22000);
    return () => window.clearInterval(timer);
  }, []);
  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setShowTutorial(false);
  };

  const nextTutorial = () => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) closeTutorial();
    else setTutorialStep((step) => step + 1);
  };

  const award = (id) => {
    const mission = MISSIONS.find((item) => item.id === id);
    if (!mission) return;
    if (completed.has(id)) {
      setToast('Already sealed. Review it anytime from the Codex panel.');
      return;
    }
    const updated = {
      xp: progress.xp + mission.xp,
      complete: [...progress.complete, id],
    };
    setProgress(updated);
    saveProgress(updated);
    recordLotjarrsGameResult('ocp-nodewright', { playerName: 'Nodewright', outcome: 'complete', score: mission.xp, scoreLabel: `${mission.xp} XP`, meta: { mission: mission.id } });
    setToast(`Mission complete: +${mission.xp} XP. ${getRank(updated.xp).item} added to your vault.`);
  };

  const toggleListAnswer = (key, value) => {
    setAnswers((current) => {
      const set = new Set(current[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...current, [key]: [...set] };
    });
  };

  const chooseNode = (node) => {
    setAnswers((current) => {
      if (current.nodeOrder.includes(node)) return current;
      return { ...current, nodeOrder: [...current.nodeOrder, node].slice(0, 4) };
    });
  };

  const addFlowNode = (nodeId) => {
    const blueprint = SYNOD_NODE_BLUEPRINTS.find((node) => node.id === nodeId);
    if (!blueprint) return;
    if (flowNodes.some((node) => node.id === nodeId)) {
      setToast(`${blueprint.title} is already on the canvas.`);
      return;
    }
    setFlowNodes((nodes) => [...nodes, createFlowNode(blueprint)]);
    setSelectedNodeId(nodeId);
    setToast(`${blueprint.title} added to the canvas.`);
  };

  const removeFlowNode = (nodeId) => {
    setFlowNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    setFlowEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId(null);
    setConnectionSource(null);
    setApiRun(null);
  };

  const clearFlow = () => {
    setFlowNodes([]);
    setFlowEdges([]);
    setSelectedNodeId(null);
    setConnectionSource(null);
    setApiRun(null);
    setToast('Canvas cleared. Rebuild the Whyth mimicry flow.');
  };

  const updateFlowNodePosition = (nodeId, x, y) => {
    setFlowNodes((nodes) => nodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node)));
  };


  const addCustomFlowNode = (type) => {
    const node = createCustomNode(type, flowNodes.length);
    setFlowNodes((nodes) => [...nodes, node]);
    setSelectedNodeId(node.id);
    setToast(`${type} node bestowed on the canvas.`);
  };

  const updateFlowNodeFields = (nodeId, patch) => {
    setFlowNodes((nodes) => nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)));
    setApiRun(null);
  };
  const updateFlowNodeConfig = (nodeId, key, value) => {
    setFlowNodes((nodes) => nodes.map((node) => (
      node.id === nodeId ? { ...node, config: { ...node.config, [key]: value } } : node
    )));
    setApiRun(null);
  };

  const connectFlowNode = (nodeId, port = 'right', targetNodeId = null, targetPort = 'left') => {
    if (targetNodeId) {
      if (nodeId === targetNodeId) return;
      const id = edgeId(nodeId, targetNodeId);
      setFlowEdges((edges) => (edges.some((edge) => edge.id === id) ? edges : [...edges, { id, source: nodeId, target: targetNodeId, sourcePort: port, targetPort }]));
      setConnectionSource(null);
      setApiRun(null);
      setToast('Edge connected.');
      return;
    }
    if (!connectionSource) {
      setConnectionSource({ nodeId, port });
      setToast('Connection started. Select any side port on the next node.');
      return;
    }
    if (connectionSource.nodeId === nodeId) {
      setConnectionSource(null);
      setToast('Connection cancelled.');
      return;
    }
    const id = edgeId(connectionSource.nodeId, nodeId);
    setFlowEdges((edges) => (edges.some((edge) => edge.id === id) ? edges : [...edges, { id, source: connectionSource.nodeId, target: nodeId, sourcePort: connectionSource.port, targetPort: port }]));
    setConnectionSource(null);
    setApiRun(null);
    setToast('Edge connected.');
  };

  const removeFlowEdge = (edgeIdToRemove) => {
    setFlowEdges((edges) => edges.filter((edge) => edge.id !== edgeIdToRemove));
    setApiRun(null);
  };

  const adjustCanvasZoom = (delta) => {
    setCanvasZoom((zoom) => Math.max(0.48, Math.min(1.45, Number((zoom + delta).toFixed(2)))));
  };

  const resetCanvasZoom = () => setCanvasZoom(1);

  const focusSelectedNode = () => {
    if (!selectedNodeId) {
      setToast('Select a node first, then focus it on the canvas.');
      return;
    }
    window.requestAnimationFrame(() => {
      document.getElementById(`nw-canvas-node-${selectedNodeId}`)?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    });
  };

  const runSynodApis = () => {
    const authNode = flowNodes.find((node) => node.id === 'synod-auth');
    const censusNode = flowNodes.find((node) => node.id === 'college-presence');
    const countNode = flowNodes.find((node) => node.id === 'presence-count');
    const configOk = authNode?.config?.method === 'POST'
      && authNode?.config?.endpoint === '/api/v2/whythryn/mimicry/tune'
      && censusNode?.config?.method === 'GET'
      && censusNode?.config?.endpoint === '/api/v2/college-of-magic/census?wizards=true&includeApprentices=true'
      && censusNode?.config?.output_paths?.citizenCount === '$.citizenCount'
      && censusNode?.config?.output_paths?.apprenticeCount === '$.apprenticeCount'
      && countNode?.config?.formula === 'citizenCount + apprenticeCount'
      && countNode?.config?.output_fields?.totalObserved === 'TotalObserved'
      && countNode?.config?.output_fields?.magusRisk === 'MagusRisk';
    const citizenCount = getWhythWizardCitizenCount();
    const apprenticeCount = getWhythWizardApprenticeCount();
    const magusRisk = configOk ? 'LOW' : 'HIGH';
    setApiRun({
      mimicry: configOk ? SYNOD_NODE_BLUEPRINTS.find((node) => node.id === 'synod-auth').responseJson : { tuned: false, mimicryBand: 'UNSTABLE_ECHO', magusRisk },
      census: configOk ? {
        location: 'College of Magic',
        citizenCount,
        apprenticeCount,
        magusRisk,
      } : {
        status: 'CONNECTION_FAILED',
        failureReason: 'Armor mimicry signature does not match the College census contract.',
        magusRisk,
      },
      answer: configOk
        ? `Whythryn scan complete: ${citizenCount} wizard citizens and ${apprenticeCount} apprentices observed. Magus risk remains ${magusRisk}.`
        : 'Connection failed. The Magus may sense the unstable armor echo unless the node contract is corrected.',
    });
    setToast(configOk
      ? `Tuning calls completed. Census returned ${citizenCount} citizens, ${apprenticeCount} apprentices, Magus risk LOW.`
      : 'Tuning failed: contract mismatch raised Magus detection risk to HIGH. Check method, endpoint, JSON paths, and formula.');
  };

  const checkSynodFlow = () => {
    const nodesOk = REQUIRED_SYNOD_FLOW.every((nodeId) => flowNodes.some((node) => node.id === nodeId)) && flowNodes.length === REQUIRED_SYNOD_FLOW.length;
    const edgesOk = REQUIRED_SYNOD_EDGES.every(([source, target]) => hasEdge(flowEdges, source, target)) && flowEdges.length === REQUIRED_SYNOD_EDGES.length;
    const authNode = flowNodes.find((node) => node.id === 'synod-auth');
    const presenceNode = flowNodes.find((node) => node.id === 'college-presence');
    const countNode = flowNodes.find((node) => node.id === 'presence-count');
    const configOk = authNode?.config?.method === 'POST'
      && authNode?.config?.endpoint === '/api/v2/whythryn/mimicry/tune'
      && presenceNode?.config?.method === 'GET'
      && presenceNode?.config?.endpoint === '/api/v2/college-of-magic/census?wizards=true&includeApprentices=true'
      && presenceNode?.config?.output_paths?.citizenCount === '$.citizenCount'
      && presenceNode?.config?.output_paths?.apprenticeCount === '$.apprenticeCount'
      && countNode?.config?.formula === 'citizenCount + apprenticeCount'
      && countNode?.config?.output_fields?.totalObserved === 'TotalObserved'
      && countNode?.config?.output_fields?.magusRisk === 'MagusRisk';
    const apiOk = apiRun?.census?.citizenCount === getWhythWizardCitizenCount() && apiRun?.census?.apprenticeCount === getWhythWizardApprenticeCount() && apiRun?.census?.magusRisk === 'LOW';
    if (nodesOk && edgesOk && configOk && apiOk) award('synod-flow');
    else if (!nodesOk) setToast('Add all five required nodes to the canvas.');
    else if (!edgesOk) setToast('Connect the route: Armor Intake -> Mimicry Tuning -> Census Query -> Count -> Silent Report.');
    else if (!configOk) setToast('Contract mismatch: the connection will fail or the Magus may sense the Whythryn echo. Check method, endpoint, JSON paths, and formula.');
    else setToast('Run the tuning calls before validating the silent flow.');
  };

  const checkJavaReader = () => {
    const inputOk = ['citizenId', 'ward'].every((item) => answers.inputs.includes(item)) && answers.inputs.length === 2;
    const outputOk = ['caseId', 'status', 'nextStep'].every((item) => answers.outputs.includes(item)) && answers.outputs.length === 3;
    if (answers.method === 'lookup' && inputOk && outputOk) award('java-reader');
    else setToast('Look for the public method name, values read from request, and values returned in SoteriaReply.');
  };

  const checkJsonMapper = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const config = parsed.configuration || {};
      const inputs = config.input_fields || {};
      const outputs = config.output_fields || [];
      const outputNames = outputs.map((item) => item.local_name);
      if (
        inputs.citizenId === 'CitizenId' &&
        inputs.ward === 'Ward' &&
        outputNames.includes('CaseId') &&
        outputNames.includes('CaseStatus') &&
        outputNames.includes('NextStep')
      ) {
        award('json-mapper');
      } else {
        setToast('Your JSON parses, but the Nodewright mappings need citizenId, ward, CaseId, CaseStatus, and NextStep.');
      }
    } catch {
      setToast('The JSON has a syntax break. Fix the comma, quote, bracket, or brace before sealing it.');
    }
  };

  const checkCanvas = () => {
    const correct = ['Announcement', 'Web Service', 'Condition', 'Announcement'];
    if (correct.every((node, index) => answers.nodeOrder[index] === node)) award('canvas-forge');
    else setToast('The flow should greet, call the API, branch on status, then announce the resolution.');
  };

  const runScribeTest = () => {
    const message = scribeInput.trim();
    if (!message) return;
    const identity = findWizardIdentity(message) || scribeIdentity;
    const asksApprentices = /apprentice|apprentices/i.test(message);
    const asksClass = /class count|same class|class/i.test(message);
    let reply = '';

    if (!identity) {
      reply = 'I need a wizard identity first. Try: I am The Grey One, I am Castor, or I am Maelis Vey.';
    } else if (asksApprentices) {
      reply = `${identity.name} is registered as ${identity.rank}. Apprentice count: ${countWizardApprentices(identity.id)}.`;
      setScribeIdentity(identity);
    } else if (asksClass) {
      reply = `${identity.name} is classed as ${identity.className}. Current roster count for ${identity.className}: ${countWizardClass(identity.className)}.`;
      setScribeIdentity(identity);
    } else if (findWizardIdentity(message)) {
      reply = `Identity accepted: ${identity.name}. Class: ${identity.className}. Location: ${identity.location}. Ask for class count or apprentice count to test the flow.`;
      setScribeIdentity(identity);
    } else {
      reply = `${identity.name} remains the active test identity. Ask for class count or apprentice count.`;
      setScribeIdentity(identity);
    }

    setScribeMessages((messages) => [...messages, { from: 'user', text: message }, { from: 'scribe', text: reply }].slice(-8));
    setScribeInput('');
  };

  const checkApi = () => {
    if (
      answers.endpoint.trim() === '/soteria/status' &&
      answers.pathCase.trim() === '$.caseId' &&
      answers.pathStatus.trim() === '$.status' &&
      answers.condition.trim().toUpperCase() === 'VERIFIED'
    ) {
      award('api-contract');
    } else {
      setToast('Match the contract: /soteria/status, $.caseId, $.status, and the VERIFIED condition.');
    }
  };

  const guideWindow = useDraggableWindow({ x: 14, y: 96 });
  const exportWindow = useDraggableWindow({ x: Math.max(16, window.innerWidth - 346), y: 96 });

  return (
    <div className="nodewright-shell">
      <div className="nodewright-bg" />
      <header className="nodewright-topbar">
        <button className="nw-back" type="button" onClick={onExit}>Back to Bag</button>
        <div>
          <p className="nw-kicker">Soteria Nodewright Training Overlay</p>
          <h1>Nodewright: Java Relay</h1>
        </div>
        <div className="nw-top-actions">
          <button type="button" onClick={() => setGuideOpen((open) => !open)} title="Open Current Guide">Guide</button>
          <button type="button" onClick={() => setExportOpen((open) => !open)} title="Open API tester">API Tester</button>
          <button type="button" onClick={() => setScribeOpen((open) => !open)} title="Open Scribe orchestrator test">Scribe</button>
          <button type="button" onClick={() => { setTutorialStep(0); setShowTutorial(true); }} title="Replay opening tutorial">Intro</button>
          <div className="nw-rank">
            <span>{rank.title}</span>
            <strong>{progress.xp} XP</strong>
          </div>
        </div>
      </header>

      <main className="nodewright-grid">
        {guideOpen && (
        <aside
          className={`nw-panel nw-sidebar nw-floating-palette ${guideWindow.dragging ? 'dragging' : ''}`}
          style={{ left: guideWindow.position.x, top: guideWindow.position.y }}
          onPointerMove={guideWindow.moveDrag}
          onPointerUp={guideWindow.endDrag}
          onPointerCancel={guideWindow.endDrag}
        >
          <div className="nw-character nw-drag-handle" onPointerDown={guideWindow.beginDrag}>
            <div className="nw-avatar">S</div>
            <div>
              <span>Current guide</span>
              <strong>{activeMission.role}</strong>
            </div>
          </div>

          <nav className="nw-missions" aria-label="Nodewright missions">
            {MISSIONS.map((mission) => (
              <button
                key={mission.id}
                type="button"
                className={mission.id === missionId ? 'active' : ''}
                onClick={() => setMissionId(mission.id)}
              >
                <span>{completed.has(mission.id) ? 'SEALED' : `${mission.xp} XP`}</span>
                <strong>{mission.title}</strong>
              </button>
            ))}
          </nav>

          <button className="nw-tutorial-button" type="button" onClick={() => { setTutorialStep(0); setShowTutorial(true); }}>
            Replay Tutorial
          </button>

          <div className="nw-reward">
            <span>Vault reward</span>
            <strong>{nextReward ? nextReward.item : 'Master Relay Sigil'}</strong>
            <p>{nextReward ? `${nextReward.xp - progress.xp} XP until ${nextReward.title}.` : 'All current rewards unlocked.'}</p>
          </div>
        </aside>
        )}

        <section className="nw-panel nw-stage">
          <div className="nw-stage-head">
            <div>
              <p className="nw-kicker">{activeMission.brief}</p>
              <h2>{activeMission.title}</h2>
            </div>
            <span className={completed.has(activeMission.id) ? 'nw-badge done' : 'nw-badge'}>{completed.has(activeMission.id) ? 'Complete' : 'Open'}</span>
          </div>

          <StoryPanel mission={activeMission} completed={completed.has(activeMission.id)} />
          <div className="nw-progression-strip" aria-label="Training progress">
            <div>
              <span>Current rank</span>
              <strong>{rank.title}</strong>
            </div>
            <div>
              <span>Mission seals</span>
              <strong>{progress.complete.length}/{MISSIONS.length}</strong>
            </div>
            <div>
              <span>Next vault reward</span>
              <strong>{nextReward ? `${nextReward.item} in ${nextReward.xp - progress.xp} XP` : 'All rewards unlocked'}</strong>
            </div>
          </div>
          {missionId === 'synod-flow' && (
            <SynodFlowBuilder
              flowNodes={flowNodes}
              selectedNode={selectedNode}
              flowEdges={flowEdges}
              apiRun={apiRun}
              dragState={dragState}
              connectionSource={connectionSource}
              connectionDrag={connectionDrag}
              canvasZoom={canvasZoom}
              onAddNode={addFlowNode}
              onAddCustomNode={addCustomFlowNode}
              onSelectNode={setSelectedNodeId}
              onRemoveNode={removeFlowNode}
              onRemoveEdge={removeFlowEdge}
              onClear={clearFlow}
              onRunApis={runSynodApis}
              onValidate={checkSynodFlow}
              onStartDrag={setDragState}
              onDragNode={updateFlowNodePosition}
              onEndDrag={() => setDragState(null)}
              onConnectNode={connectFlowNode}
              onStartConnectionDrag={setConnectionDrag}
              onUpdateConfig={updateFlowNodeConfig}
              onUpdateNode={updateFlowNodeFields}
              onZoomIn={() => adjustCanvasZoom(0.12)}
              onZoomOut={() => adjustCanvasZoom(-0.12)}
              onResetZoom={resetCanvasZoom}
              onFocusSelected={focusSelectedNode}
              onOpenScribe={() => setScribeOpen(true)}
            />
          )}

          {missionId === 'java-reader' && (
            <JavaReader answers={answers} toggleListAnswer={toggleListAnswer} setAnswers={setAnswers} onCheck={checkJavaReader} />
          )}

          {missionId === 'json-mapper' && (
            <JsonMapper jsonText={jsonText} setJsonText={setJsonText} onCheck={checkJsonMapper} />
          )}

          {missionId === 'canvas-forge' && (
            <CanvasForge answers={answers} chooseNode={chooseNode} setAnswers={setAnswers} onCheck={checkCanvas} />
          )}

          {missionId === 'api-contract' && (
            <ApiContract answers={answers} setAnswers={setAnswers} onCheck={checkApi} />
          )}

          {toast && <div className="nw-toast" role="status">{toast}</div>}
        </section>

        {exportOpen && (
        <aside
          className={`nw-panel nw-codex nw-floating-palette ${exportWindow.dragging ? 'dragging' : ''}`}
          style={{ left: exportWindow.position.x, top: exportWindow.position.y }}
          onPointerMove={exportWindow.moveDrag}
          onPointerUp={exportWindow.endDrag}
          onPointerCancel={exportWindow.endDrag}
        >
          <div className="nw-codex-head nw-drag-handle" onPointerDown={exportWindow.beginDrag}>
            <span>API tester</span>
            <strong>Requests and Config</strong>
          </div>
          <pre className="nw-export"><code>{apiTesterText}</code></pre>
          <div className="nw-note">
            <strong>Nodewright contract rules</strong>
            <p>Inspect the selected node request, body, headers, output paths, output fields, formulas, and latest test result. The mission still requires exact contract outputs to seal.</p>
          </div>
        </aside>
        )}
      </main>

      <ScribeTestPanel
        open={scribeOpen}
        input={scribeInput}
        identity={scribeIdentity}
        messages={scribeMessages}
        onToggle={() => setScribeOpen((open) => !open)}
        onInput={setScribeInput}
        onRun={runScribeTest}
      />


      {hintVisible && (
        <aside className="nw-hint-card" role="status" aria-live="polite">
          <div>
            <span>Stonemaster hint</span>
            <strong>{NODEWRIGHT_HINTS[hintIndex]}</strong>
          </div>
          <button type="button" onClick={() => setHintVisible(false)} aria-label="Dismiss hint">Dismiss</button>
        </aside>
      )}
      {showTutorial && (
        <TutorialOverlay
          step={TUTORIAL_STEPS[tutorialStep]}
          index={tutorialStep}
          total={TUTORIAL_STEPS.length}
          onNext={nextTutorial}
          onSkip={closeTutorial}
        />
      )}
    </div>
  );
}



function useDraggableWindow(initialPosition) {
  const [position, setPosition] = useState(initialPosition);
  const [drag, setDrag] = useState(null);

  const beginDrag = (event) => {
    if (event.target.closest('button, input, textarea, select, a')) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ offsetX: event.clientX - position.x, offsetY: event.clientY - position.y });
  };

  const moveDrag = (event) => {
    if (!drag) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    setPosition({
      x: Math.max(8, Math.min(event.clientX - drag.offsetX, width - 120)),
      y: Math.max(8, Math.min(event.clientY - drag.offsetY, height - 60)),
    });
  };

  const endDrag = () => setDrag(null);

  return { position, dragging: Boolean(drag), beginDrag, moveDrag, endDrag };
}

function ScribeTestPanel({ open, input, identity, messages, onToggle, onInput, onRun }) {
  const dragWindow = useDraggableWindow({ x: Math.max(12, window.innerWidth - 380), y: Math.max(12, window.innerHeight - 430) });
  return (
    <aside
      className={`nw-scribe-test ${open ? 'open' : 'closed'} ${dragWindow.dragging ? 'dragging' : ''}`}
      style={{ left: dragWindow.position.x, top: dragWindow.position.y }}
      onPointerMove={dragWindow.moveDrag}
      onPointerUp={dragWindow.endDrag}
      onPointerCancel={dragWindow.endDrag}
      aria-label="Scribe orchestrator test"
    >
      <button className="nw-scribe-tab" type="button" onClick={onToggle}>{open ? 'Hide Scribe' : 'Scribe Test'}</button>
      {open && (
        <div className="nw-scribe-body">
          <div className="nw-scribe-head nw-drag-handle" onPointerDown={dragWindow.beginDrag}>
            <span>Scribe Test</span>
            <strong>{identity ? identity.name : 'No wizard selected'}</strong>
          </div>
          <div className="nw-scribe-log">
            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`nw-scribe-msg ${message.from}`}>{message.text}</div>
            ))}
          </div>
          <div className="nw-scribe-examples">
            <button type="button" onClick={() => onInput('I am The Grey One')}>I am The Grey One</button>
            <button type="button" onClick={() => onInput('What is my class count?')}>Class count</button>
            <button type="button" onClick={() => onInput('What is my apprentice count?')}>Apprentice count</button>
          </div>
          <div className="nw-scribe-input">
            <input
              value={input}
              onChange={(event) => onInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') onRun(); }}
              placeholder="I am Castor. What is my class count?"
            />
            <button type="button" onClick={onRun}>Test</button>
          </div>
        </div>
      )}
    </aside>
  );
}

function TutorialOverlay({ step, index, total, onNext, onSkip }) {
  const dragWindow = useDraggableWindow({ x: Math.max(16, window.innerWidth / 2 - 280), y: Math.max(16, window.innerHeight / 2 - 210) });
  return (
    <div className="nw-tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="nw-tutorial-title">
      <div
        className={`nw-tutorial-card ${dragWindow.dragging ? 'dragging' : ''}`}
        style={{ left: dragWindow.position.x, top: dragWindow.position.y }}
        onPointerMove={dragWindow.moveDrag}
        onPointerUp={dragWindow.endDrag}
        onPointerCancel={dragWindow.endDrag}
      >
        <div className="nw-tutorial-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="nw-drag-handle nw-tutorial-drag" onPointerDown={dragWindow.beginDrag}>
          <p className="nw-kicker">{step.speaker}</p>
          <h2 id="nw-tutorial-title">{step.title}</h2>
        </div>
        <p>{step.text}</p>
        <div className="nw-tutorial-progress" aria-label={`Tutorial step ${index + 1} of ${total}`}>
          {Array.from({ length: total }, (_, item) => (
            <span key={item} className={item <= index ? 'active' : ''} />
          ))}
        </div>
        <div className="nw-tutorial-actions">
          <button className="nw-secondary" type="button" onClick={onSkip}>Skip Briefing</button>
          <button className="nw-primary" type="button" onClick={onNext}>{index === total - 1 ? 'Begin Nodewright' : 'Continue'}</button>
        </div>
      </div>
    </div>
  );
}

function StoryPanel({ mission, completed }) {
  return (
    <div className="nw-story-panel">
      <div>
        <span>{mission.episode}</span>
        <strong>{completed ? 'Relay segment sealed' : mission.story}</strong>
      </div>
      <p>{mission.challenge}</p>
    </div>
  );
}


function SynodFlowBuilder({
  flowNodes,
  flowEdges,
  selectedNode,
  apiRun,
  dragState,
  connectionSource,
  connectionDrag,
  canvasZoom,
  onAddNode,
  onAddCustomNode,
  onSelectNode,
  onRemoveNode,
  onRemoveEdge,
  onClear,
  onRunApis,
  onValidate,
  onStartDrag,
  onDragNode,
  onEndDrag,
  onConnectNode,
  onStartConnectionDrag,
  onUpdateConfig,
  onUpdateNode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFocusSelected,
  onOpenScribe,
}) {
  const citizenCount = getWhythWizardCitizenCount();
  const apprenticeCount = getWhythWizardApprenticeCount();
  const totalObserved = getWhythCensusTotal();
  const nodeMap = new Map(flowNodes.map((node) => [node.id, node]));
  const canvasWorld = { width: 1360, height: 680 };
  const requiredAdded = REQUIRED_SYNOD_FLOW.filter((nodeId) => flowNodes.some((node) => node.id === nodeId)).length;
  const requiredConnected = REQUIRED_SYNOD_EDGES.filter(([source, target]) => hasEdge(flowEdges, source, target)).length;
  const magusRisk = apiRun?.census?.magusRisk || apiRun?.mimicry?.magusRisk || 'UNKNOWN';
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [pinchStart, setPinchStart] = useState(null);
  const [customType, setCustomType] = useState(BESTOWED_NODE_TYPES[0]);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [panState, setPanState] = useState(null);
  const authNode = flowNodes.find((node) => node.id === 'synod-auth');
  const censusNode = flowNodes.find((node) => node.id === 'college-presence');
  const countNode = flowNodes.find((node) => node.id === 'presence-count');
  const configOk = authNode?.config?.method === 'POST'
    && authNode?.config?.endpoint === '/api/v2/whythryn/mimicry/tune'
    && censusNode?.config?.method === 'GET'
    && censusNode?.config?.endpoint === '/api/v2/college-of-magic/census?wizards=true&includeApprentices=true'
    && censusNode?.config?.output_paths?.citizenCount === '$.citizenCount'
    && censusNode?.config?.output_paths?.apprenticeCount === '$.apprenticeCount'
    && countNode?.config?.formula === 'citizenCount + apprenticeCount'
    && countNode?.config?.output_fields?.totalObserved === 'TotalObserved'
    && countNode?.config?.output_fields?.magusRisk === 'MagusRisk';
  const apiOk = apiRun?.census?.citizenCount === citizenCount && apiRun?.census?.apprenticeCount === apprenticeCount && apiRun?.census?.magusRisk === 'LOW';
  const nextMissingNode = SYNOD_NODE_BLUEPRINTS.find((node) => !flowNodes.some((flowNode) => flowNode.id === node.id));
  const nextMissingEdge = REQUIRED_SYNOD_EDGES.find(([source, target]) => !hasEdge(flowEdges, source, target));
  const nextMissingEdgeLabel = nextMissingEdge
    ? `${nodeMap.get(nextMissingEdge[0])?.title || nextMissingEdge[0]} -> ${nodeMap.get(nextMissingEdge[1])?.title || nextMissingEdge[1]}`
    : '';
  const currentObjective = (() => {
    if (requiredAdded < REQUIRED_SYNOD_FLOW.length) return `Bestow ${nextMissingNode?.title || 'the remaining mission node'} from Nodes.`;
    if (requiredConnected < REQUIRED_SYNOD_EDGES.length) return `Forge the next edge: ${nextMissingEdgeLabel}.`;
    if (!configOk) return 'Open Config and align method, endpoint, output paths, output fields, and formula.';
    if (!apiOk) return 'Run Tuning Calls to test the contract against the census ledger.';
    return 'Validate Silent Flow to seal the mission and claim the XP.';
  })();
  const questSteps = [
    { label: 'Bestow', done: requiredAdded === REQUIRED_SYNOD_FLOW.length, value: `${requiredAdded}/5` },
    { label: 'Connect', done: requiredConnected === REQUIRED_SYNOD_EDGES.length, value: `${requiredConnected}/4` },
    { label: 'Configure', done: configOk, value: configOk ? 'ready' : 'check' },
    { label: 'Test', done: apiOk, value: apiOk ? 'pass' : 'run' },
    { label: 'Seal', done: apiOk && magusRisk === 'LOW', value: magusRisk },
  ];


  const toggleTool = (tool) => {
    setBriefOpen((open) => tool === 'brief' ? !open : false);
    setLibraryOpen((open) => tool === 'library' ? !open : false);
    setConfigOpen((open) => tool === 'config' ? !open : false);
    setResultsOpen((open) => tool === 'results' ? !open : false);
  };

  const handleViewportWheel = (event) => {
    if (!event.altKey) return;
    event.preventDefault();
    if (event.deltaY > 0) onZoomOut();
    else onZoomIn();
  };

  const getTouchDistance = (touches) => {
    const [first, second] = touches;
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  };

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) setPinchStart(getTouchDistance(event.touches));
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 2 || !pinchStart) return;
    event.preventDefault();
    const nextDistance = getTouchDistance(event.touches);
    if (Math.abs(nextDistance - pinchStart) < 14) return;
    if (nextDistance > pinchStart) onZoomIn();
    else onZoomOut();
    setPinchStart(nextDistance);
  };

  const handleTouchEnd = () => setPinchStart(null);


  const getPortPoint = (node, port) => {
    const width = 172;
    const height = 110;
    if (port === 'top') return { x: node.x + width / 2, y: node.y };
    if (port === 'bottom') return { x: node.x + width / 2, y: node.y + height };
    if (port === 'left') return { x: node.x, y: node.y + height / 2 };
    return { x: node.x + width, y: node.y + height / 2 };
  };

  const getEdgePath = (start, end, sourcePort, targetPort) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const sourceHorizontal = sourcePort === 'left' || sourcePort === 'right';
    const targetHorizontal = targetPort === 'left' || targetPort === 'right';
    const sourceBias = sourceHorizontal ? { x: sourcePort === 'left' ? -80 : 80, y: 0 } : { x: 0, y: sourcePort === 'top' ? -80 : 80 };
    const targetBias = targetHorizontal ? { x: targetPort === 'left' ? -80 : 80, y: 0 } : { x: 0, y: targetPort === 'top' ? -80 : 80 };
    const c1 = { x: start.x + sourceBias.x + (sourceHorizontal ? Math.max(0, Math.abs(dx) * 0.18) * Math.sign(sourceBias.x || dx || 1) : 0), y: start.y + sourceBias.y + (!sourceHorizontal ? Math.max(0, Math.abs(dy) * 0.18) * Math.sign(sourceBias.y || dy || 1) : 0) };
    const c2 = { x: end.x + targetBias.x + (targetHorizontal ? Math.max(0, Math.abs(dx) * 0.18) * Math.sign(targetBias.x || -dx || -1) : 0), y: end.y + targetBias.y + (!targetHorizontal ? Math.max(0, Math.abs(dy) * 0.18) * Math.sign(targetBias.y || -dy || -1) : 0) };
    return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
  };

  const selectedEdge = flowEdges.find((edge) => edge.id === selectedEdgeId);
  const selectedEdgeSource = selectedEdge ? nodeMap.get(selectedEdge.source) : null;
  const selectedEdgeTarget = selectedEdge ? nodeMap.get(selectedEdge.target) : null;
  const selectedEdgePoint = selectedEdgeSource && selectedEdgeTarget
    ? (() => {
      const start = getPortPoint(selectedEdgeSource, selectedEdge.sourcePort || 'right');
      const end = getPortPoint(selectedEdgeTarget, selectedEdge.targetPort || 'left');
      return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    })()
    : null;

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    onRemoveEdge(selectedEdgeId);
    setSelectedEdgeId(null);
  };

  const beginPortDrag = (event, node, port) => {
    event.stopPropagation();
    event.preventDefault();
    const rect = event.currentTarget.closest('.nw-canvas-lane').getBoundingClientRect();
    const start = getPortPoint(node, port);
    onStartConnectionDrag({ source: node.id, sourcePort: port, start, current: { x: (event.clientX - rect.left) / canvasZoom, y: (event.clientY - rect.top) / canvasZoom } });
  };

  const movePortDrag = (event) => {
    if (!connectionDrag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onStartConnectionDrag({ ...connectionDrag, current: { x: (event.clientX - rect.left) / canvasZoom, y: (event.clientY - rect.top) / canvasZoom } });
  };

  const endPortDrag = () => {
    if (connectionDrag) onStartConnectionDrag(null);
  };

  const completePortDrag = (event, node, port) => {
    event.stopPropagation();
    if (!connectionDrag) return;
    if (connectionDrag.source !== node.id) onConnectNode(connectionDrag.source, connectionDrag.sourcePort, node.id, port);
    onStartConnectionDrag(null);
  };
  const handleCanvasPointerDown = (event) => {
    if (event.target !== event.currentTarget) return;
    const viewport = event.currentTarget.closest('.nw-canvas-viewport');
    if (!viewport) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setSelectedEdgeId(null);
    setPanState({
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    });
  };

  const handleCanvasPointerMove = (event) => {
    movePortDrag(event);
    if (panState && !dragState) {
      const viewport = event.currentTarget.closest('.nw-canvas-viewport');
      if (!viewport) return;
      viewport.scrollLeft = panState.scrollLeft - (event.clientX - panState.startX);
      viewport.scrollTop = panState.scrollTop - (event.clientY - panState.startY);
      return;
    }
    if (!dragState) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(8, Math.min((event.clientX - rect.left) / canvasZoom - dragState.offsetX, canvasWorld.width - 190));
    const y = Math.max(8, Math.min((event.clientY - rect.top) / canvasZoom - dragState.offsetY, canvasWorld.height - 122));
    onDragNode(dragState.nodeId, Math.round(x), Math.round(y));
  };

  const handleCanvasPointerEnd = (event) => {
    onEndDrag(event);
    endPortDrag();
    setPanState(null);
  };

  const handleNodePointerDown = (event, node) => {
    if (event.target.closest('.nw-node-port, .nw-node-config-action')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onStartDrag({ nodeId: node.id, offsetX: (event.clientX - rect.left) / canvasZoom, offsetY: (event.clientY - rect.top) / canvasZoom });
    onSelectNode(node.id);
  };

  return (
    <div className="nw-synod-builder">
      <div className="nw-canvas-command-dock" aria-label="Canvas tools">
        <button type="button" className={briefOpen ? 'active' : ''} onClick={() => toggleTool('brief')}>Brief</button>
        <button type="button" className={libraryOpen ? 'active' : ''} onClick={() => toggleTool('library')}>Nodes</button>
        <button type="button" className={configOpen ? 'active' : ''} onClick={() => toggleTool('config')}>Config</button>
        <button type="button" className={resultsOpen ? 'active' : ''} onClick={() => toggleTool('results')}>Results</button>
        <button type="button" onClick={onOpenScribe}>Test Scribe</button>
        <span>{requiredAdded}/5 nodes</span>
        <span>{requiredConnected}/4 edges</span>
        <span>{selectedNode ? selectedNode.title : 'No node selected'}</span>
        <span className={'nw-risk-pill ' + magusRisk.toLowerCase()}>Magus risk: {magusRisk}</span>
      </div>

      <div className="nw-quest-tracker" aria-label="Current mission path">
        <div className="nw-current-objective">
          <span>Current objective</span>
          <strong>{currentObjective}</strong>
        </div>
        <div className="nw-quest-steps">
          {questSteps.map((step, index) => (
            <div key={step.label} className={step.done ? 'done' : index === questSteps.findIndex((item) => !item.done) ? 'active' : ''}>
              <span>{step.label}</span>
              <strong>{step.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {briefOpen && (
        <div className="nw-start-here nw-tool-panel">
          <div>
            <span>Start here</span>
            <strong>Build the Whyth mimicry call flow left to right.</strong>
          </div>
          <ol>
            <li>Add all five nodes from the Node Library.</li>
            <li>Drag nodes into order on the canvas.</li>
            <li>Click <b>Connect</b> on a source node, then <b>Connect</b> on the next node.</li>
            <li>Select each node and review its Inputs, Outputs, and service configuration.</li>
            <li>Run Tuning Calls, then Validate Silent Flow.</li>
          </ol>
        </div>
      )}

      <div className="nw-builder-grid ocp-like">
        {libraryOpen && (<section className="nw-node-market nw-tool-panel" aria-label="Available Whyth census nodes">
          <h3>Node Library</h3>
          <div className="nw-custom-node-maker">
            <label>
              Bestow any node type
              <select value={customType} onChange={(event) => setCustomType(event.target.value)}>
                {BESTOWED_NODE_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <button type="button" className="nw-primary" onClick={() => onAddCustomNode(customType)}>Bestow Node</button>
          </div>
          {SYNOD_NODE_BLUEPRINTS.map((node, index) => {
            const isAdded = flowNodes.some((flowNode) => flowNode.id === node.id);
            return (
              <button type="button" key={node.id} className={isAdded ? 'added' : ''} onClick={() => onAddNode(node.id)}>
                <span>Step {index + 1} / {node.type}</span>
                <strong>{node.title}</strong>
                <em>{isAdded ? 'Added to canvas' : node.routingRole}</em>
              </button>
            );
          })}
        </section>)}

        <section className="nw-live-canvas" aria-label="Whyth census call-flow canvas">
          <div className="nw-canvas-toolbar">
            <span>Mimicry canvas</span>
            <div>
              <em>{connectionSource ? 'Now click any side port on the next tuned node.' : 'Drag canvas to pan. Alt + scroll to zoom.'}</em>
              <button className="nw-secondary" type="button" onClick={onZoomOut}>-</button>
              <strong>{Math.round(canvasZoom * 100)}%</strong>
              <button className="nw-secondary" type="button" onClick={onZoomIn}>+</button>
              <button className="nw-secondary" type="button" onClick={onResetZoom}>Reset</button>
              <button className="nw-secondary" type="button" onClick={onFocusSelected}>Focus</button>
              <button className="nw-secondary" type="button" onClick={onClear}>Clear</button>
            </div>
          </div>
          <div className="nw-canvas-viewport" onWheel={handleViewportWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div
              className="nw-canvas-lane ocp-grid"
              style={{ width: canvasWorld.width, height: canvasWorld.height, transform: `scale(${canvasZoom})` }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerEnd}
              onPointerLeave={handleCanvasPointerEnd}
            >
            <svg className="nw-edge-layer" width={canvasWorld.width} height={canvasWorld.height} aria-label="Canvas connector lines">
              {flowEdges.map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;
                const start = getPortPoint(source, edge.sourcePort || 'right');
                const end = getPortPoint(target, edge.targetPort || 'left');
                const path = getEdgePath(start, end, edge.sourcePort || 'right', edge.targetPort || 'left');
                const selected = selectedEdgeId === edge.id;
                return (
                  <g key={edge.id} className={selected ? 'selected' : ''}>
                    <path
                      className="nw-edge-hit"
                      d={path}
                      role="button"
                      tabIndex="0"
                      aria-label={`Select connection from ${source.title} to ${target.title}`}
                      onClick={(event) => { event.stopPropagation(); setSelectedEdgeId(edge.id); }}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedEdgeId(edge.id); }}
                    />
                    <path className="nw-edge-visible" d={path} />
                    <circle cx={end.x} cy={end.y} r={selected ? '6' : '4'} />
                  </g>
                );
              })}
              {connectionDrag && (
                <path className="nw-edge-preview" d={getEdgePath(connectionDrag.start, connectionDrag.current, connectionDrag.sourcePort, 'left')} />
              )}
            </svg>
            {selectedEdge && selectedEdgePoint && (
              <div
                className="nw-edge-popover"
                style={{ left: `${selectedEdgePoint.x}px`, top: `${selectedEdgePoint.y}px` }}
                role="dialog"
                aria-label="Selected connection actions"
              >
                <span>Connection selected</span>
                <strong>{nodeMap.get(selectedEdge.source)?.title || selectedEdge.source} {'->'} {nodeMap.get(selectedEdge.target)?.title || selectedEdge.target}</strong>
                <div>
                  <button type="button" onClick={deleteSelectedEdge}>Delete</button>
                  <button type="button" onClick={() => setSelectedEdgeId(null)}>Cancel</button>
                </div>
              </div>
            )}
            {flowNodes.length === 0 && (
              <div className="nw-empty-canvas">
                <span>Start here</span>
                <strong>Bestow the Whyth Armor Intake node.</strong>
                <p>The mission teaches the full loop: node type, inputs, outputs, service request, response mapping, and validation.</p>
                <div>
                  <button type="button" onClick={() => setLibraryOpen(true)}>Open Nodes</button>
                  <button type="button" onClick={() => onAddNode('wizard-intake')}>Bestow First Node</button>
                </div>
              </div>
            )}
            {flowNodes.map((node, index) => (
              <div
                role="button"
                tabIndex="0"
                key={node.id}
                id={`nw-canvas-node-${node.id}`}
                className={`nw-canvas-node ${selectedNode?.id === node.id ? 'selected' : ''} ${connectionSource?.nodeId === node.id ? 'connecting' : ''}`}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                onClick={() => onSelectNode(node.id)}
                onPointerDown={(event) => handleNodePointerDown(event, node)}
                onKeyDown={(event) => { if (event.key === 'Enter') onSelectNode(node.id); }}
              >
                {['top', 'right', 'bottom', 'left'].map((port) => (
                  <button
                    key={port}
                    className={`nw-node-port ${port}`}
                    type="button"
                    aria-label={`${port} connector for ${node.title}`}
                    onPointerDown={(event) => beginPortDrag(event, node, port)}
                    onPointerUp={(event) => completePortDrag(event, node, port)}
                    onClick={(event) => { event.stopPropagation(); onConnectNode(node.id, port); }}
                  />
                ))}
                <div className="nw-node-order">{index + 1}</div>
                <span>{node.type}</span>
                <strong>{node.title}</strong>
                <em>{node.routingRole}</em>
              </div>
            ))}
          </div>
          </div>
          <div className="nw-flow-controls">
            <button className="nw-secondary" type="button" onClick={onRunApis}>Run Tuning Calls</button>
            <button className="nw-primary" type="button" onClick={onValidate}>Validate Silent Flow</button>
          </div>
        </section>

        {configOpen && <NodeConfigInspector selectedNode={selectedNode} flowEdges={flowEdges} onUpdateConfig={onUpdateConfig} onUpdateNode={onUpdateNode} onRemoveNode={onRemoveNode} onRemoveEdge={onRemoveEdge} />}
      </div>

      {resultsOpen && (<section className="nw-api-sim full-width nw-tool-panel">
        <h3>Whythryn Census Ledger and Service Results</h3>
        <div className="nw-db-count"><span>Expected answer</span><strong>{totalObserved}</strong></div>
        <pre><code>{prettyJson({
          resource: 'whythryn_college_census_ledger',
          filter: { location: 'College of Magic', wizards: true, includeApprentices: true },
          citizenCount,
          apprenticeCount,
          totalObserved,
          rows: getWhythWizardCitizens(),
        })}</code></pre>
        {apiRun && <pre><code>{prettyJson(apiRun)}</code></pre>}
      </section>)}
    </div>
  );
}

function HintButton({ hintKey }) {
  return <button className="nw-hint-button" type="button" onClick={() => window.alert(FIELD_HINTS[hintKey] || 'Inspect the mission contract and keep the required output intact.')}>?</button>;
}

function NodeConfigInspector({ selectedNode, flowEdges, onUpdateConfig, onUpdateNode, onRemoveNode, onRemoveEdge }) {
  const updateText = (key, value) => onUpdateConfig(selectedNode.id, key, value);
  const updateJson = (key, value) => {
    try {
      onUpdateConfig(selectedNode.id, key, JSON.parse(value || '{}'));
    } catch {
      onUpdateConfig(selectedNode.id, key, value);
    }
  };
  const updateNodeType = (type) => {
    onUpdateNode(selectedNode.id, { type, config: { ...createDefaultConfigForType(type), ...selectedNode.config } });
  };

  return (
    <section className="nw-node-inspector ocp-inspector">
      <h3>Internal Configuration</h3>
      {selectedNode ? (
        <div>
          <div className="nw-inspector-title">
            <strong>{selectedNode.title}</strong>
            <span>{selectedNode.type}</span>
          </div>
          <p>{selectedNode.purpose}</p>

          <div className="nw-config-section">
            <span>Node identity</span>
            <label>
              Display title
              <input value={selectedNode.title} onChange={(event) => onUpdateNode(selectedNode.id, { title: event.target.value })} />
            </label>
            <div className="nw-field-row">
              <label>
                Bestowed type
                <select value={selectedNode.type} onChange={(event) => updateNodeType(event.target.value)}>
                  {BESTOWED_NODE_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <HintButton hintKey="type" />
            </div>
            <label>
              Routing role
              <input value={selectedNode.routingRole} onChange={(event) => onUpdateNode(selectedNode.id, { routingRole: event.target.value })} />
            </label>
            <label>
              Purpose
              <textarea value={selectedNode.purpose} onChange={(event) => onUpdateNode(selectedNode.id, { purpose: event.target.value })} />
            </label>
          </div>

          <div className="nw-config-section">
            <span>Inputs</span>
            <div className="nw-field-row">
              <label>
                input_fields
                <textarea value={configEditorValue(selectedNode.config.input_fields)} onChange={(event) => updateJson('input_fields', event.target.value)} spellCheck="false" />
              </label>
              <HintButton hintKey="input_fields" />
            </div>
          </div>

          <div className="nw-config-section">
            <span>Outputs</span>
            <div className="nw-field-row">
              <label>
                output_fields
                <textarea value={configEditorValue(selectedNode.config.output_fields)} onChange={(event) => updateJson('output_fields', event.target.value)} spellCheck="false" />
              </label>
              <HintButton hintKey="output_fields" />
            </div>
            <div className="nw-field-row">
              <label>
                output_paths
                <textarea value={configEditorValue(selectedNode.config.output_paths)} onChange={(event) => updateJson('output_paths', event.target.value)} spellCheck="false" />
              </label>
              <HintButton hintKey="output_paths" />
            </div>
          </div>

          <div className="nw-config-section">
            <span>API and logic</span>
            <div className="nw-field-row">
              <label>
                Method
                <select value={selectedNode.config.method || 'GET'} onChange={(event) => updateText('method', event.target.value)}>
                  {API_METHODS.map((method) => <option key={method}>{method}</option>)}
                </select>
              </label>
              <HintButton hintKey="method" />
            </div>
            <div className="nw-field-row">
              <label>
                Endpoint
                <input value={selectedNode.config.endpoint || ''} onChange={(event) => updateText('endpoint', event.target.value)} />
              </label>
              <HintButton hintKey="endpoint" />
            </div>
            <label>
              headers
              <textarea value={configEditorValue(selectedNode.config.headers)} onChange={(event) => updateJson('headers', event.target.value)} spellCheck="false" />
            </label>
            <div className="nw-field-row">
              <label>
                request_body
                <textarea value={configEditorValue(selectedNode.config.request_body)} onChange={(event) => updateJson('request_body', event.target.value)} spellCheck="false" />
              </label>
              <HintButton hintKey="request_body" />
            </div>
            <div className="nw-field-row">
              <label>
                query_params
                <textarea value={configEditorValue(selectedNode.config.query_params)} onChange={(event) => updateJson('query_params', event.target.value)} spellCheck="false" />
              </label>
              <HintButton hintKey="query_params" />
            </div>
            <label>
              form_data
              <textarea value={configEditorValue(selectedNode.config.form_data)} onChange={(event) => updateJson('form_data', event.target.value)} spellCheck="false" />
            </label>
            <div className="nw-field-row">
              <label>
                Formula
                <input value={selectedNode.config.formula || ''} onChange={(event) => updateText('formula', event.target.value)} />
              </label>
              <HintButton hintKey="formula" />
            </div>
            <div className="nw-field-row">
              <label>
                Message
                <textarea value={selectedNode.config.message || ''} onChange={(event) => updateText('message', event.target.value)} />
              </label>
              <HintButton hintKey="message" />
            </div>
          </div>

          <div className="nw-edge-list">
            <span>Connected edges</span>
            {flowEdges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id).length === 0 && <p>No edges connected yet.</p>}
            {flowEdges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id).map((edge) => (
              <button type="button" key={edge.id} onClick={() => onRemoveEdge(edge.id)}>{edge.source}:{edge.sourcePort || 'right'} {'->'} {edge.target}:{edge.targetPort || 'left'}</button>
            ))}
          </div>
          <button className="nw-secondary nw-node-config-action" type="button" onClick={() => onRemoveNode(selectedNode.id)}>Remove Node</button>
        </div>
      ) : (
        <div className="nw-config-empty">
          <strong>Select a node to configure it.</strong>
          <p>You can edit type, inputs, outputs, API method, endpoint, body, headers, output paths, formulas, and messages here.</p>
        </div>
      )}
    </section>
  );
}
function JavaReader({ answers, setAnswers, toggleListAnswer, onCheck }) {
  return (
    <div className="nw-work">
      <pre className="nw-code"><code>{JAVA_SNIPPET}</code></pre>
      <div className="nw-choices">
        <ChoiceGroup label="Which Java method becomes the action?" items={['fetchStatus', 'lookup', 'getStatus']} value={answers.method} onPick={(value) => setAnswers((current) => ({ ...current, method: value }))} />
        <ToggleGroup label="Request inputs" items={['citizenId', 'ward', 'caseId', 'nextStep']} selected={answers.inputs} onToggle={(value) => toggleListAnswer('inputs', value)} />
        <ToggleGroup label="Reply outputs" items={['caseId', 'status', 'nextStep', 'registryClient']} selected={answers.outputs} onToggle={(value) => toggleListAnswer('outputs', value)} />
        <button className="nw-primary" type="button" onClick={onCheck}>Seal Java Reading</button>
      </div>
    </div>
  );
}

function JsonMapper({ jsonText, setJsonText, onCheck }) {
  return (
    <div className="nw-work single">
      <div className="nw-instruction">
        <strong>Objective</strong>
        <p>Keep this valid JSON and preserve the Nodewright contract: input_fields map bestowed node inputs to relay fields, output_fields map endpoint values to local fields.</p>
      </div>
      <textarea className="nw-json" value={jsonText} onChange={(event) => setJsonText(event.target.value)} spellCheck="false" />
      <button className="nw-primary" type="button" onClick={onCheck}>Validate Relay JSON</button>
    </div>
  );
}

function CanvasForge({ answers, chooseNode, setAnswers, onCheck }) {
  const nodes = ['Announcement', 'Web Service', 'Condition', 'Flow'];
  return (
    <div className="nw-work single">
      <div className="nw-flow-board">
        {[0, 1, 2, 3].map((slot) => (
          <div className="nw-flow-slot" key={slot}>
            <span>Node {slot + 1}</span>
            <strong>{answers.nodeOrder[slot] || 'Empty'}</strong>
          </div>
        ))}
      </div>
      <div className="nw-node-palette">
        {nodes.map((node) => (
          <button type="button" key={node} onClick={() => chooseNode(node)}>{node}</button>
        ))}
      </div>
      <div className="nw-actions">
        <button type="button" className="nw-secondary" onClick={() => setAnswers((current) => ({ ...current, nodeOrder: [] }))}>Clear Board</button>
        <button className="nw-primary" type="button" onClick={onCheck}>Connect Edges</button>
      </div>
    </div>
  );
}

function ApiContract({ answers, setAnswers, onCheck }) {
  const update = (key, value) => setAnswers((current) => ({ ...current, [key]: value }));
  return (
    <div className="nw-contract">
      <label>
        API method
        <select value="GET" disabled>
          <option>GET</option>
        </select>
      </label>
      <label>
        Endpoint path
        <input value={answers.endpoint} onChange={(event) => update('endpoint', event.target.value)} placeholder="/soteria/status" />
      </label>
      <label>
        caseId JSON path
        <input value={answers.pathCase} onChange={(event) => update('pathCase', event.target.value)} placeholder="$.caseId" />
      </label>
      <label>
        status JSON path
        <input value={answers.pathStatus} onChange={(event) => update('pathStatus', event.target.value)} placeholder="$.status" />
      </label>
      <label>
        Success condition value
        <input value={answers.condition} onChange={(event) => update('condition', event.target.value)} placeholder="VERIFIED" />
      </label>
      <button className="nw-primary" type="button" onClick={onCheck}>Run Contract Test</button>
    </div>
  );
}

function ChoiceGroup({ label, items, value, onPick }) {
  return (
    <fieldset className="nw-choice-group">
      <legend>{label}</legend>
      {items.map((item) => (
        <button className={value === item ? 'selected' : ''} type="button" key={item} onClick={() => onPick(item)}>{item}</button>
      ))}
    </fieldset>
  );
}

function ToggleGroup({ label, items, selected, onToggle }) {
  return (
    <fieldset className="nw-choice-group">
      <legend>{label}</legend>
      {items.map((item) => (
        <button className={selected.includes(item) ? 'selected' : ''} type="button" key={item} onClick={() => onToggle(item)}>{item}</button>
      ))}
    </fieldset>
  );
}















































