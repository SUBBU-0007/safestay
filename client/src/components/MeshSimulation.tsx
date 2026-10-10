import React, { useState } from 'react';
import { Radio, CheckCircle2, ArrowRight, ShieldCheck, Cpu, Smartphone, Wifi, Activity } from 'lucide-react';
import { bluetoothRelay, INITIAL_MESH_NODES, MeshHopEvent, SosPacket } from '../services/bluetooth.js';

interface MeshSimulationProps {
  initialPacket: SosPacket;
  onDelivered: (packet: SosPacket) => void;
  onClose: () => void;
}

export const MeshSimulation: React.FC<MeshSimulationProps> = ({ initialPacket, onDelivered, onClose }) => {
  const [nodes, setNodes] = useState(INITIAL_MESH_NODES);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState<MeshHopEvent | null>(null);

  const startSimulation = async () => {
    setIsSimulating(true);
    setIsCompleted(false);
    setCurrentStep(0);
    setLogs(['[MESH] Initializing BLE 2.4GHz broadcast beacon on Phone A (0 cellular signal)...']);

    await bluetoothRelay.simulateMeshTransmission(initialPacket, (event: MeshHopEvent) => {
      setCurrentStep(event.stepIndex);
      setCurrentEvent(event);
      setLogs((prev) => [
        `[HOP ${event.stepIndex}] ${event.fromNode.label} -> ${event.toNode.label} (RSSI: ${event.rssiDb} dBm, TTL: ${event.packet.ttl - event.stepIndex})`,
        ...prev
      ]);
    });

    setIsSimulating(false);
    setIsCompleted(true);
    setLogs((prev) => [
      '✅ [GATEWAY REACHED] SDRF Satellite Uplink delivered SOS packet to Emergency Dispatch Server!',
      ...prev
    ]);
    onDelivered(initialPacket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">Level 3: Bluetooth Mesh Relay Simulation</h2>
                <span className="text-[10px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded font-mono">
                  DEMO MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Off-grid packet hopping from phone to phone until reaching an internet-connected gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            Close
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Visual Mesh Topology Pipeline */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Simulated Device Network Topology
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
              {nodes.map((node, idx) => {
                const isActive = currentStep === idx;
                const isPassed = currentStep > idx;

                return (
                  <div
                    key={node.id}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isActive
                        ? 'bg-purple-900/40 border-purple-500 shadow-lg shadow-purple-900/50 scale-105'
                        : isPassed
                        ? 'bg-emerald-950/40 border-emerald-600/70'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div className="relative mb-2">
                      {node.role === 'gateway' ? (
                        <Wifi
                          className={`w-6 h-6 ${
                            isPassed || isActive ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                      ) : (
                        <Smartphone
                          className={`w-6 h-6 ${
                            isActive ? 'text-purple-400 animate-bounce' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                      )}
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping"></span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {node.label.split(' ')[0]} {node.label.split(' ')[1]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {node.hasInternet ? '🛰️ 4G/Sat Gateway' : '📶 0 Cell Bars'}
                    </div>
                    {isPassed && (
                      <span className="mt-1 text-[9px] text-emerald-400 font-bold">Relayed ✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Hop Status Card */}
          {currentEvent && (
            <div className="bg-purple-950/40 border border-purple-600/70 rounded-xl p-4 text-purple-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-purple-300">
                  HOP #{currentEvent.stepIndex}: {currentEvent.fromNode.label} &rarr; {currentEvent.toNode.label}
                </span>
                <span className="bg-purple-900 px-2 py-0.5 rounded text-[11px]">
                  RSSI: {currentEvent.rssiDb} dBm
                </span>
              </div>
              <p className="text-xs text-purple-200">{currentEvent.explanation}</p>
            </div>
          )}

          {/* Packet Payload Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300">
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              Encrypted SOS Packet Payload:
            </div>
            <pre className="text-[11px] overflow-x-auto text-emerald-400">
              {JSON.stringify(
                {
                  id: initialPacket.id,
                  coords: [initialPacket.lat, initialPacket.lng],
                  triage: initialPacket.triage,
                  peopleCount: initialPacket.peopleCount,
                  hops: currentStep,
                  ttlRemaining: Math.max(0, 6 - currentStep)
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* Live Hop Log */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1 font-mono text-[11px]">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('✅') ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            In production: Deployed via native BLE background advertiser & Apple Multipeer.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {!isCompleted ? (
              <button
                onClick={startSimulation}
                disabled={isSimulating}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-900/50 flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>{isSimulating ? 'Hopping BLE Packets...' : 'Start Mesh Hop Simulation'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SOS Delivered via Mesh — Return</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
