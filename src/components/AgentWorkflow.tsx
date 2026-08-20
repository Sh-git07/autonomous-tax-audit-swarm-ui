import { useEffect, useRef, useState } from "react";
import type { AgentStateDetail } from "../types";

interface Props {
  agents?: AgentStateDetail[];
  onNodeClick?: (agent: string) => void;
  selectedAgent?: string | null;
}

const DEFAULT_AGENTS: AgentStateDetail[] = [
  { agent: "extractor", status: "active", processing_speed: 1450, token_usage: 78000, state: "Parsing OCR line items & GSTINs" },
  { agent: "reconciler", status: "active", processing_speed: 1450, token_usage: 76000, state: "Cross-matching GSTR-2A & E-way bills" },
  { agent: "filer", status: "active", processing_speed: 30000, token_usage: 42000, state: "Generating GSTR-3B liability matrix" },
];

const AGENT_LABELS: Record<string, { title: string; role: string; color: string; model: string; queue: number; rules: number }> = {
  extractor: { title: "EXTRACTOR", role: "Active Perception", color: "#4ade80", model: "Claude Sonnet 5 (Vision)", queue: 14, rules: 18 },
  reconciler: { title: "RECONCILER", role: "Active Cognition", color: "#4ade80", model: "Claude Sonnet 5 (CoT)", queue: 8, rules: 34 },
  filer: { title: "FILER", role: "Active Action", color: "#4ade80", model: "Deterministic Rule Engine + Claude", queue: 3, rules: 12 },
};

function fmtSpeed(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k inv/min` : `${n} inv/min`;
}

function fmtTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

interface Particle {
  id: number;
  lane: 0 | 1;
  progress: number;
  speed: number;
}

export default function AgentWorkflow({ agents = DEFAULT_AGENTS, onNodeClick, selectedAgent: propSelectedAgent }: Props) {
  const [internalSelected, setInternalSelected] = useState<string | null>("reconciler");
  const [isSwarmRunning, setIsSwarmRunning] = useState(true);
  const [cycleCount, setCycleCount] = useState(482);
  const [particles, setParticles] = useState<{ left: Particle[]; right: Particle[] }>({
    left: [],
    right: [],
  });
  const frameRef = useRef<number>(0);
  const nextId = useRef(0);

  const activeAgent = propSelectedAgent !== undefined ? propSelectedAgent : internalSelected;

  function handleAgentClick(agentName: string) {
    setInternalSelected((prev) => (prev === agentName ? null : agentName));
    onNodeClick?.(agentName);
  }

  function triggerCycle() {
    setIsSwarmRunning(true);
    setCycleCount((c) => c + 1);
  }

  useEffect(() => {
    let lastTime = performance.now();

    function spawnParticle(side: "left" | "right") {
      if (!isSwarmRunning) return;
      const id = nextId.current++;
      const particle: Particle = { id, lane: Math.random() > 0.5 ? 0 : 1, progress: 0, speed: 0.005 + Math.random() * 0.007 };
      setParticles((prev) => ({ ...prev, [side]: [...prev[side], particle] }));
      setTimeout(() => {
        setParticles((prev) => ({ ...prev, [side]: prev[side].filter((p) => p.id !== id) }));
      }, 2400);
    }

    let spawnAccum = 0;
    function frame(now: number) {
      const dt = now - lastTime;
      lastTime = now;
      if (isSwarmRunning) {
        spawnAccum += dt;
        if (spawnAccum > 150) {
          spawnAccum = 0;
          if (Math.random() > 0.25) spawnParticle("left");
          if (Math.random() > 0.25) spawnParticle("right");
        }
        setParticles((prev) => ({
          left: prev.left.map((p) => ({ ...p, progress: p.progress + p.speed * dt * 0.016 })),
          right: prev.right.map((p) => ({ ...p, progress: p.progress + p.speed * dt * 0.016 })),
        }));
      }
      frameRef.current = requestAnimationFrame(frame);
    }

    frameRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isSwarmRunning]);

  const agentList = agents.length === 3 ? agents : DEFAULT_AGENTS;
  const currentInspector = activeAgent ? AGENT_LABELS[activeAgent] : null;
  const activeAgentData = activeAgent ? agentList.find((a) => a.agent === activeAgent) : null;

  return (
    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Sub-header with swarm metrics and controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 2 }}>
        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          {agentList.map((ag) => {
            const isSelected = activeAgent === ag.agent;
            return (
              <div
                key={ag.agent}
                onClick={() => handleAgentClick(ag.agent)}
                className="interactive-hover"
                style={{
                  flex: 1,
                  background: isSelected ? "#293724" : "#1b2318",
                  borderRadius: 6,
                  padding: "6px 10px",
                  border: isSelected ? "1px solid #4ade80" : "1px solid #2d3d27",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: isSelected ? "#4ade80" : "#7a9a70", fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600, textTransform: "uppercase" }}>
                    {ag.agent}
                  </span>
                  <span style={{ color: "#4a6442", fontSize: 9, fontFamily: "var(--font-mono)" }}>
                    {fmtSpeed(ag.processing_speed)}
                  </span>
                </div>
                <div style={{ color: "#7a9a70", fontSize: 9, fontFamily: "var(--font-mono)", marginTop: 2 }}>
                  Tokens: <span style={{ color: "#d8e8ce" }}>{fmtTokens(ag.token_usage)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Swarm Run Controls */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button
            onClick={() => setIsSwarmRunning(!isSwarmRunning)}
            title={isSwarmRunning ? "Pause Swarm Cycle" : "Resume Swarm"}
            className="button-interactive"
            style={{
              background: isSwarmRunning ? "#293724" : "#3a5c38",
              border: `1px solid ${isSwarmRunning ? "#3a4c34" : "#4ade80"}`,
              borderRadius: 5,
              padding: "4px 8px",
              color: "#d8e8ce",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{isSwarmRunning ? "❚❚ Pause" : "▶ Resume"}</span>
          </button>
          <button
            onClick={triggerCycle}
            title="Trigger Full Swarm Consensus Cycle"
            className="button-interactive"
            style={{
              background: "#1a3d38",
              border: "1px solid #2dd4bf",
              borderRadius: 5,
              padding: "4px 8px",
              color: "#2dd4bf",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            ⚡ Cycle #{cycleCount}
          </button>
        </div>
      </div>

      {/* Agent nodes */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative", minHeight: 116 }}>
        {agentList.map((ag, idx) => {
          const meta = AGENT_LABELS[ag.agent];
          const isSelected = activeAgent === ag.agent;
          return (
            <div key={ag.agent} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              {/* Node */}
              <div
                onClick={() => handleAgentClick(ag.agent)}
                className={`agent-node-card ${isSelected ? "ring-1 ring-[#4ade80]" : "animate-pulse-glow"}`}
                style={{
                  flex: 1,
                  background: isSelected ? "#2f3f2a" : "#293724",
                  border: isSelected ? `2px solid #4ade80` : `1.5px solid ${meta.color}`,
                  borderRadius: 8,
                  padding: "13px 12px",
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                  minWidth: 0,
                  boxShadow: isSelected ? "0 0 16px rgba(74, 222, 128, 0.4)" : "none",
                }}
              >
                <div style={{ color: "#7a9a70", fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSwarmRunning && ag.status === "active" ? "#4ade80" : "#eab308", display: "inline-block", boxShadow: isSwarmRunning ? "0 0 6px #4ade80" : "none" }} />
                    {isSwarmRunning ? ag.status : "paused"}
                  </span>
                </div>
                <div style={{ color: meta.color, fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: 3 }}>
                  {meta.title}
                </div>
                <div style={{ color: "#7a9a70", fontSize: 10, fontFamily: "var(--font-mono)" }}>{meta.role}</div>
                <div style={{ color: "#d8e8ce", fontSize: 9, marginTop: 5, fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ag.state}
                </div>
              </div>

              {/* Connector + particles */}
              {idx < agentList.length - 1 && (
                <div style={{ width: 56, height: 60, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Top label */}
                  <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", color: "#4a6442", fontSize: 8, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    consensus
                  </div>

                  {/* Connector lines */}
                  <svg width={56} height={30} viewBox="0 0 56 30" style={{ position: "absolute" }}>
                    <line x1={0} y1={10} x2={56} y2={10} stroke="#3a4c34" strokeWidth={1} strokeDasharray="3,3" />
                    <line x1={0} y1={20} x2={56} y2={20} stroke="#3a4c34" strokeWidth={1} strokeDasharray="3,3" />
                  </svg>

                  {/* Flowing particles */}
                  <svg width={56} height={30} viewBox="0 0 56 30" style={{ position: "absolute" }}>
                    {(idx === 0 ? particles.left : particles.right).slice(0, 8).map((p) => (
                      <circle
                        key={p.id}
                        cx={p.progress * 56}
                        cy={p.lane === 0 ? 10 : 20}
                        r={2.2}
                        fill="#4ade80"
                        opacity={Math.min(1, Math.min(p.progress, 1 - p.progress) * 8)}
                        filter="drop-shadow(0 0 3px #4ade80)"
                      />
                    ))}
                  </svg>

                  {/* Arrow */}
                  <div style={{ color: "#4ade80", opacity: 0.6, fontSize: 14, position: "absolute" }}>›</div>

                  {/* Bottom label */}
                  <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", color: "#4a6442", fontSize: 8, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    data stream
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Agent Inspector Detail Banner */}
      {currentInspector && activeAgentData && (
        <div
          className="animate-slide-in"
          style={{
            background: "#1b2318",
            border: "1px solid #3a4c34",
            borderRadius: 6,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ color: "#4ade80", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              [{currentInspector.title} INSPECTOR]
            </span>
            <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              Model: <span style={{ color: "#d8e8ce" }}>{currentInspector.model}</span>
            </span>
            <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              Rules: <span style={{ color: "#d8e8ce" }}>{currentInspector.rules} active</span>
            </span>
            <span style={{ color: "#7a9a70", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              Queue: <span style={{ color: "#4ade80" }}>{currentInspector.queue} jobs</span>
            </span>
          </div>
          <span style={{ color: "#4a6442", fontSize: 10, fontFamily: "var(--font-mono)" }}>
            Click node again to deselect
          </span>
        </div>
      )}
    </div>
  );
}
