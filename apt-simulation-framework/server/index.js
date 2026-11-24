const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Simulation State
let simulationState = {
  running: false,
  phase: 'idle', // idle, recon, access, execution, persistence, escalation, lateral, exfil
  nodes: [
    { id: 'ext-router', label: 'External Router', type: 'network', status: 'secure', x: 100, y: 300 },
    { id: 'dmz-web', label: 'Web Server (DMZ)', type: 'server', status: 'secure', x: 300, y: 150 },
    { id: 'dmz-db', label: 'DB Server (DMZ)', type: 'database', status: 'secure', x: 300, y: 450 },
    { id: 'int-app', label: 'App Server (Internal)', type: 'server', status: 'secure', x: 500, y: 300 },
    { id: 'ws-1', label: 'Workstation 1', type: 'workstation', status: 'secure', x: 700, y: 150 },
    { id: 'ws-2', label: 'Workstation 2', type: 'workstation', status: 'secure', x: 700, y: 450 },
    { id: 'dc-1', label: 'Domain Controller', type: 'server', status: 'secure', x: 900, y: 300 },
  ],
  connections: [
    { source: 'ext-router', target: 'dmz-web' },
    { source: 'ext-router', target: 'dmz-db' },
    { source: 'dmz-web', target: 'int-app' },
    { source: 'dmz-db', target: 'int-app' },
    { source: 'int-app', target: 'ws-1' },
    { source: 'int-app', target: 'ws-2' },
    { source: 'ws-1', target: 'dc-1' },
    { source: 'ws-2', target: 'dc-1' },
  ],
  logs: [],
  threatLevel: 0,
};

const PHASES = [
  { id: 'recon', name: 'Reconnaissance', description: 'Scanning external perimeter...' },
  { id: 'access', name: 'Initial Access', description: 'Exploiting Web Server vulnerability...' },
  { id: 'execution', name: 'Execution', description: 'Deploying payload on DMZ server...' },
  { id: 'persistence', name: 'Persistence', description: 'Establishing backdoor access...' },
  { id: 'escalation', name: 'Privilege Escalation', description: 'Gaining root access on Internal App Server...' },
  { id: 'lateral', name: 'Lateral Movement', description: 'Moving from workstations to Domain Controller...' },
  { id: 'exfil', name: 'Exfiltration', description: 'Compressing and stealing sensitive data...' },
];

let simulationInterval = null;
let logCounter = 0;

const addLog = (message, type = 'info') => {
  const log = {
    id: `${Date.now()}-${++logCounter}`,
    timestamp: new Date().toLocaleTimeString(),
    message,
    type, // info, attack, defense, alert
  };
  simulationState.logs.unshift(log);
  if (simulationState.logs.length > 50) simulationState.logs.pop();
  io.emit('log_added', log);
};

const updateNodeStatus = (nodeId, status) => {
  const node = simulationState.nodes.find(n => n.id === nodeId);
  if (node) {
    node.status = status;
    io.emit('node_updated', node);
  }
};

const runSimulationStep = () => {
  const currentPhaseIndex = PHASES.findIndex(p => p.id === simulationState.phase);
  const nextPhase = PHASES[currentPhaseIndex + 1];

  if (!nextPhase) {
    addLog('Simulation complete. APT objective achieved.', 'attack');
    simulationState.running = false;
    clearInterval(simulationInterval);
    io.emit('simulation_ended');
    return;
  }

  simulationState.phase = nextPhase.id;
  addLog(`Entering Phase: ${nextPhase.name}`, 'info');
  addLog(nextPhase.description, 'attack');

  // Logic for each phase
  switch (nextPhase.id) {
    case 'recon':
      updateNodeStatus('ext-router', 'alert');
      simulationState.threatLevel = 20;
      break;
    case 'access':
      updateNodeStatus('dmz-web', 'compromised');
      simulationState.threatLevel = 40;
      addLog('Defensive alert: Unusual traffic detected on Web Server', 'alert');
      break;
    case 'execution':
      updateNodeStatus('dmz-db', 'compromised');
      simulationState.threatLevel = 50;
      addLog('EDR: Blocked suspicious execution attempt on DB Server', 'defense');
      addLog('Attacker: Bypassed EDR with obfuscated payload', 'attack');
      break;
    case 'persistence':
      updateNodeStatus('int-app', 'alert');
      simulationState.threatLevel = 60;
      break;
    case 'escalation':
      updateNodeStatus('int-app', 'compromised');
      simulationState.threatLevel = 75;
      break;
    case 'lateral':
      updateNodeStatus('ws-1', 'compromised');
      updateNodeStatus('ws-2', 'compromised');
      simulationState.threatLevel = 90;
      addLog('SIEM: Lateral movement detected between workstations', 'alert');
      break;
    case 'exfil':
      updateNodeStatus('dc-1', 'compromised');
      simulationState.threatLevel = 100;
      addLog('Firewall: Large data transfer to unknown IP', 'alert');
      break;
  }

  io.emit('state_updated', simulationState);
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('initial_state', simulationState);

  socket.on('start_simulation', () => {
    if (simulationState.running) return;
    
    // Reset state
    simulationState.running = true;
    simulationState.phase = 'idle';
    simulationState.threatLevel = 0;
    simulationState.nodes.forEach(n => n.status = 'secure');
    simulationState.logs = [];
    
    addLog('Simulation started.', 'info');
    io.emit('state_updated', simulationState);

    simulationInterval = setInterval(runSimulationStep, 5000);
  });

  socket.on('stop_simulation', () => {
    simulationState.running = false;
    clearInterval(simulationInterval);
    addLog('Simulation stopped by user.', 'info');
    io.emit('state_updated', simulationState);
  });

  socket.on('reset_simulation', () => {
    simulationState.running = false;
    clearInterval(simulationInterval);
    simulationState.phase = 'idle';
    simulationState.threatLevel = 0;
    simulationState.nodes.forEach(n => n.status = 'secure');
    simulationState.logs = [];
    addLog('Simulation reset.', 'info');
    io.emit('state_updated', simulationState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
