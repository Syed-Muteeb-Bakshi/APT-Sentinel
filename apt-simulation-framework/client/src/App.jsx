import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { 
  Shield, 
  Skull, 
  Activity, 
  Terminal, 
  Network, 
  AlertTriangle, 
  Play, 
  Square, 
  RefreshCcw,
  Server,
  Database,
  Monitor,
  Wifi,
  Lock,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:3001');

const APTDashboard = () => {
  const [state, setState] = useState({
    running: false,
    phase: 'idle',
    nodes: [],
    connections: [],
    logs: [],
    threatLevel: 0
  });

  const logEndRef = useRef(null);

  useEffect(() => {
    const onInitialState = (initialState) => {
      setState(initialState);
    };

    const onStateUpdated = (updatedState) => {
      setState(updatedState);
    };

    const onLogAdded = (log) => {
      setState(prev => ({
        ...prev,
        logs: [log, ...prev.logs].slice(0, 50)
      }));
    };

    const onNodeUpdated = (updatedNode) => {
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
      }));
    };

    socket.on('initial_state', onInitialState);
    socket.on('state_updated', onStateUpdated);
    socket.on('log_added', onLogAdded);
    socket.on('node_updated', onNodeUpdated);

    return () => {
      socket.off('initial_state', onInitialState);
      socket.off('state_updated', onStateUpdated);
      socket.off('log_added', onLogAdded);
      socket.off('node_updated', onNodeUpdated);
    };
  }, []);

  const handleStart = () => socket.emit('start_simulation');
  const handleStop = () => socket.emit('stop_simulation');
  const handleReset = () => socket.emit('reset_simulation');

  const getStatusColor = (status) => {
    switch (status) {
      case 'secure': return '#00ff88';
      case 'alert': return '#ffaa00';
      case 'compromised': return '#ff007a';
      default: return '#8e8e9a';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'network': return <Wifi size={20} />;
      case 'server': return <Server size={20} />;
      case 'database': return <Database size={20} />;
      case 'workstation': return <Monitor size={20} />;
      default: return <Shield size={20} />;
    }
  };

  const phases = [
    { id: 'recon', label: 'Reconnaissance', icon: <Search size={16} /> },
    { id: 'access', label: 'Initial Access', icon: <Lock size={16} /> },
    { id: 'execution', label: 'Execution', icon: <Play size={16} /> },
    { id: 'persistence', label: 'Persistence', icon: <RefreshCcw size={16} /> },
    { id: 'escalation', label: 'Privilege Escalation', icon: <ChevronRight size={16} /> },
    { id: 'lateral', label: 'Lateral Movement', icon: <Network size={16} /> },
    { id: 'exfil', label: 'Exfiltration', icon: <Skull size={16} /> },
  ];

  const dataStreams = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${15 + Math.random() * 20}s`,
    delay: `${Math.random() * 10}s`,
    content: Array.from({ length: 20 }).map(() => Math.round(Math.random())).join('')
  }));

  return (
    <div className="relative min-h-screen p-6 text-[#f8f8fc] flex flex-col gap-6 select-none font-['Outfit']">
      {/* Immersive Background */}
      <div className="cyber-grid" />
      <div className="bg-mesh" />
      <div className="scanline-overlay" />
      
      {/* Background Data Streams */}
      {dataStreams.map(stream => (
        <div 
          key={stream.id}
          className="data-stream"
          style={{ 
            left: stream.left, 
            animationDuration: stream.duration,
            animationDelay: stream.delay
          }}
        >
          {stream.content}
        </div>
      ))}
      
      {/* Header - Tactical HUD */}
      <header className="glass px-10 py-6 flex justify-between items-center z-20 border-b border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <motion.div 
              className={`p-4 rounded-2xl transition-all duration-700 ${state.running ? 'bg-[#00f2ff]/20 shadow-[0_0_30px_rgba(0,242,255,0.4)]' : 'bg-white/5'}`}
              animate={state.running ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Activity className={state.running ? 'text-[#00f2ff] neon-primary' : 'text-[#7a7a8a]'} size={32} />
            </motion.div>
            <div className="absolute -inset-2 bg-gradient-to-r from-[#00f2ff] to-[#ff007a] opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-full" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none mb-1 gradient-text-hero glitch cursor-pointer">
              APT <span className="opacity-80">SENTINEL</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${state.running ? 'bg-[#00ff88] shadow-[0_0_10px_#00ff88]' : 'bg-gray-600'}`} />
              <p className="text-[12px] font-extrabold tracking-[0.3em] uppercase text-[#7a7a8a]">
                Command & Control Interface // <span className="text-[#00f2ff]">Active</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-16">
          <div className="text-right">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7a7a8a]">Threat Probability</span>
              <span className={`text-lg font-mono font-black ${state.threatLevel > 70 ? 'text-[#ff007a] neon-secondary' : 'text-[#00f2ff] neon-primary'}`}>
                {state.threatLevel}%
              </span>
            </div>
            <div className="w-64 h-2 bg-black/40 rounded-full overflow-hidden p-[2px] border border-white/5 shadow-inner">
              <motion.div 
                className={`h-full rounded-full relative ${state.threatLevel > 70 ? 'bg-gradient-to-r from-[#ff007a] to-[#ff4444]' : 'bg-gradient-to-r from-[#00f2ff] to-[#7000ff]'}`}
                initial={{ width: 0 }}
                animate={{ width: `${state.threatLevel}%` }}
                transition={{ type: "spring", stiffness: 40 }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>

          <div className="flex gap-4">
            {!state.running ? (
              <button 
                onClick={handleStart} 
                className="cyber-button px-8 py-3 bg-[#00f2ff] text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.3)]"
              >
                Initialize Ops
              </button>
            ) : (
              <button 
                onClick={handleStop} 
                className="cyber-button px-8 py-3 bg-[#ff007a] text-white font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,0,122,0.3)]"
              >
                Abort Protocol
              </button>
            )}
            <button 
              onClick={handleReset} 
              className="p-3 glass rounded-xl hover:bg-white/10 active:rotate-180 transition-all duration-500 text-[#7a7a8a] hover:text-white border border-white/5"
            >
              <RefreshCcw size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex gap-6 relative z-10" style={{ height: 'calc(100vh - 160px)', minHeight: '560px', overflow: 'hidden' }}>
        {/* Left: Tactical Kill Chain Dashboard */}
        <aside className="w-84 flex flex-col gap-6 flex-shrink-0">
          <div className="glass flex-1 flex flex-col p-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#7a7a8a] flex items-center gap-3">
                <Skull size={18} className="text-[#ff007a] neon-secondary" /> KILL CHAIN HUD
              </h3>
              <div className="px-3 py-1 bg-[#00f2ff]/10 rounded border border-[#00f2ff]/20 text-[10px] font-black text-[#00f2ff]">SEC-OP-9</div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-3 flex flex-col gap-4 custom-scrollbar">
              {phases.map((p, i) => {
                const isActive = state.phase === p.id;
                const isPast = phases.findIndex(x => x.id === state.phase) > i;
                
                return (
                  <motion.div 
                    key={p.id}
                    initial={false}
                    animate={isActive ? { x: 10, scale: 1.02 } : { x: 0, scale: 1 }}
                    className={`group relative flex items-center gap-5 p-5 rounded-2xl border transition-all duration-500 ${
                      isActive ? 'bg-[#00f2ff]/10 border-[#00f2ff]/40 text-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.1)]' : 
                      isPast ? 'bg-[#ff007a]/5 border-[#ff007a]/20 text-[#ff007a]' : 
                      'border-white/5 text-[#7a7a8a] opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-all duration-500 ${isActive ? 'bg-[#00f2ff]/20 neon-primary' : 'bg-white/5'}`}>
                      {p.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-black tracking-tight">{p.label}</span>
                      {isActive && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Processing...</span>
                      )}
                    </div>
                    {isPast && (
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007a] neon-secondary" />
                        <Shield size={12} className="opacity-50" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#00f2ff] rounded-full neon-primary shadow-[0_0_10px_#00f2ff]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="glass p-8">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[#7a7a8a] mb-6 flex items-center gap-3">
              <Shield size={18} className="text-[#00ff88] neon-primary" /> DEFENSE COUNTERS
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 group hover:border-[#ffaa00]/30 transition-all">
                <p className="text-[10px] text-[#7a7a8a] font-black uppercase mb-2 tracking-widest">Incursions</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black text-[#ffaa00] neon-primary">{state.logs.filter(l => l.type === 'alert').length}</p>
                  <AlertTriangle size={20} className="text-[#ffaa00] opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 group hover:border-[#00ff88]/30 transition-all">
                <p className="text-[10px] text-[#7a7a8a] font-black uppercase mb-2 tracking-widest">Mitigated</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black text-[#00ff88] neon-primary">{state.logs.filter(l => l.type === 'defense').length}</p>
                  <Shield size={20} className="text-[#00ff88] opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Interactive Network Visualization */}
        <main className="flex-1 glass relative overflow-hidden flex flex-col border border-white/10">
          {/* HUD Grids Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-[#00f2ff]/20 rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-[#00f2ff]/20 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-[#00f2ff]/20 rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-[#00f2ff]/20 rounded-br-3xl" />
          </div>
          
          <div className="absolute top-8 left-10 flex items-center gap-8 z-20 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5">
            {['secure', 'alert', 'compromised'].map(status => (
              <div key={status} className="flex items-center gap-3 text-[11px] font-black tracking-[0.2em] uppercase">
                <div className={`w-4 h-4 rounded-md border-2 rotate-45 transition-all ${
                  status === 'secure' ? 'bg-[#00ff88]/10 border-[#00ff88] shadow-[0_0_10px_#00ff88]' :
                  status === 'alert' ? 'bg-[#ffaa00]/10 border-[#ffaa00] shadow-[0_0_10px_#ffaa00]' :
                  'bg-[#ff007a]/10 border-[#ff007a] shadow-[0_0_10px_#ff007a]'
                }`} />
                <span className={
                   status === 'secure' ? 'text-[#00ff88]' :
                   status === 'alert' ? 'text-[#ffaa00]' :
                   'text-[#ff007a]'
                }>{status}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
              {/* Data Flow & Connections */}
              {state.connections.map((conn, i) => {
                const source = state.nodes.find(n => n.id === conn.source);
                const target = state.nodes.find(n => n.id === conn.target);
                if (!source || !target) return null;
                
                const isCompromised = source.status === 'compromised' && target.status === 'compromised';
                
                return (
                  <g key={i}>
                    {/* Visual Connection Glow */}
                    <line 
                      x1={source.x} y1={source.y} 
                      x2={target.x} y2={target.y} 
                      stroke={isCompromised ? 'rgba(255, 0, 122, 0.4)' : 'rgba(0, 242, 255, 0.05)'} 
                      strokeWidth={isCompromised ? 6 : 2}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                    
                    {/* Active Link Path */}
                    <line 
                      x1={source.x} y1={source.y} 
                      x2={target.x} y2={target.y} 
                      stroke={isCompromised ? '#ff007a' : 'rgba(255, 255, 255, 0.1)'} 
                      strokeWidth={isCompromised ? 3 : 1}
                      strokeLinecap="round"
                      strokeDasharray={isCompromised ? "10,15" : "none"}
                    >
                      {isCompromised && (
                        <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite" />
                      )}
                    </line>
                    
                    {/* Data Signal Pulse */}
                    {state.running && (
                      <circle r="2.5" fill={isCompromised ? "#ff007a" : "#00f2ff"} className="neon-primary">
                        <animateMotion 
                          path={`M ${source.x} ${source.y} L ${target.x} ${target.y}`} 
                          dur={`${1 + Math.random() * 1.5}s`} 
                          repeatCount="indefinite" 
                        />
                        <animate attributeName="r" values="1.5;3;1.5" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Node Command Units */}
              {state.nodes.map((node) => (
                <g key={node.id} transform={`translate(${node.x},${node.y})`} className="group">
                  {/* Interaction Radius */}
                  <circle r={60} fill="transparent" />

                  {/* Pulsing Command Aura */}
                  <AnimatePresence>
                    {(node.status === 'compromised' || node.status === 'alert') && (
                      <motion.circle 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        r={40}
                        fill="none"
                        stroke={getStatusColor(node.status)}
                        strokeWidth={2}
                      />
                    )}
                  </AnimatePresence>

                  {/* Node Core Geometry */}
                  <motion.g whileHover={{ scale: 1.15 }}>
                    {/* Secondary Ring */}
                    <circle 
                      r={36}
                      fill="none"
                      stroke={getStatusColor(node.status)}
                      strokeWidth={1}
                      strokeDasharray="8,8"
                      opacity={0.3}
                    >
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite" />
                    </circle>

                    {/* Main Hexagon Background (SVG Path) */}
                    <path 
                      d="M 0 -30 L 26 -15 L 26 15 L 0 30 L -26 15 L -26 -15 Z"
                      fill={node.status === 'compromised' ? 'rgba(255, 0, 122, 0.2)' : 'rgba(8, 8, 12, 0.95)'}
                      stroke={getStatusColor(node.status)}
                      strokeWidth={3}
                      className="backdrop-blur-xl transition-all duration-500"
                    />

                    {/* Central Icon */}
                    <foreignObject x="-14" y="-14" width="28" height="28">
                      <div 
                        style={{ color: getStatusColor(node.status) }} 
                        className={`flex items-center justify-center transition-all duration-500 ${node.status !== 'secure' ? 'neon-primary scale-110' : 'opacity-60'}`}
                      >
                        {getNodeIcon(node.type)}
                      </div>
                    </foreignObject>
                  </motion.g>

                  {/* Cyber Label HUD */}
                  <g transform="translate(0, 55)">
                    <rect x="-60" y="-12" width="120" height="24" rx="12" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" className="backdrop-blur-md" />
                    <text 
                      textAnchor="middle" 
                      y="4"
                      className="text-[11px] font-black tracking-[0.2em] fill-white uppercase"
                    >
                      {node.label}
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>
        </main>

        {/* Right: Signal Operations & Intel */}
        <aside className="w-100 flex flex-col gap-6 flex-shrink-0">
          <div className="glass flex-1 flex flex-col min-h-0 overflow-hidden border border-white/10 relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <Terminal size={22} className="text-[#00f2ff] neon-primary" />
                <div>
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[#f8f8fc]">Signal Log // RT-Alpha</span>
                  <p className="text-[9px] font-bold text-[#7a7a8a] tracking-widest">ENCRYPTED STREAM ACTIVE</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_10px_#00ff88]" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[12px] flex flex-col-reverse gap-5 custom-scrollbar">
              <AnimatePresence initial={false}>
                {state.logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 group hover:scale-[1.02] ${
                      log.type === 'attack' ? 'border-[#ff007a]/40 bg-[#ff007a]/5 text-[#ff007a]' :
                      log.type === 'defense' ? 'border-[#00ff88]/40 bg-[#00ff88]/5 text-[#00ff88]' :
                      log.type === 'alert' ? 'border-[#ffaa00]/40 bg-[#ffaa00]/5 text-[#ffaa00]' :
                      'border-white/10 bg-white/5 text-[#7a7a8a]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                          {log.type} PROTOCOL
                        </span>
                      </div>
                      <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                        {log.timestamp}
                      </span>
                    </div>
                    <div className="leading-relaxed font-bold tracking-tight">
                      <span className="text-[#00f2ff] mr-3 font-black">&raquo;</span>
                      {log.message}
                    </div>
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-40 transition-opacity">
                      {log.type === 'attack' ? <Skull size={40} /> : log.type === 'defense' ? <Shield size={40} /> : <Terminal size={40} />}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <motion.div 
            animate={state.threatLevel > 80 ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`glass p-8 transition-all duration-700 relative overflow-hidden ${state.threatLevel > 80 ? 'bg-[#ff007a]/20 border-[#ff007a]/50 shadow-[0_0_40px_rgba(255,0,122,0.2)]' : 'bg-black/60 border-white/10'}`}
          >
            <div className="flex items-center gap-6 relative z-10">
              <div className={`p-4 rounded-2xl transition-all duration-500 ${state.threatLevel > 80 ? 'bg-[#ff007a] text-white' : 'bg-[#00f2ff]/20 text-[#00f2ff] neon-primary'}`}>
                <AlertTriangle size={32} className={state.threatLevel > 80 ? 'animate-bounce' : ''} />
              </div>
              <div>
                <p className={`text-[12px] font-black uppercase tracking-[0.3em] mb-2 ${state.threatLevel > 80 ? 'text-white' : 'text-[#7a7a8a]'}`}>
                  {state.threatLevel > 80 ? 'SYSTEM CRITICAL // APT DETECTED' : 'System Intelligence'}
                </p>
                <p className="text-[16px] font-extrabold text-white leading-tight">
                  {state.phase === 'idle' ? 'All subsystems operational. No active threats.' : `Phase ${state.phase.toUpperCase()} in progress. Analyzing adversarial TTPs...`}
                </p>
              </div>
            </div>
            {state.threatLevel > 80 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[scanline_2s_linear_infinite]" />
            )}
          </motion.div>
        </aside>
      </div>
    </div>
  );
};

export default APTDashboard;
