import React, { useState } from "react";
import { 
  ChevronRight, 
  CheckCircle2, 
  Database, 
  AlertTriangle, 
  ServerCrash, 
  Terminal, 
  Sliders, 
  Clock, 
  Check, 
  X, 
  ShieldAlert, 
  ShieldCheck,
  RefreshCw,
  Users,
  FileText
} from "lucide-react";

interface SuiteToolsProps {
  interpreters: any[];
  contacts: any[];
  antispamSessions: any[];
  activeTool: "suitability_analyzer" | "log_auditor" | "compliance_signatures" | "rate_calculator";
  logs: any[];
  pushLog: (service: any, level: any, message: string) => void;
  triggerSystemMessage: (text: string, error?: boolean) => void;
  setLogs: React.Dispatch<React.SetStateAction<any[]>>;
  handleSimulateCandidate: () => void;
}

export const SuiteToolsView: React.FC<SuiteToolsProps> = ({
  interpreters,
  contacts,
  antispamSessions,
  activeTool,
  logs,
  pushLog,
  triggerSystemMessage,
  setLogs,
  handleSimulateCandidate
}) => {
  // State for Candidate Suitability Analyzer
  const [selectedSuiteCandidateId, setSelectedSuiteCandidateId] = useState<string>("");
  const [suiteAdjustments, setSuiteAdjustments] = useState({
    certificationsBonus: 20,
    experienceBonus: 5,
    soundIsolationBonus: 15,
    speedBonus: 10
  });

  // State for Compliance Ledgers
  const [complianceRecords, setComplianceRecords] = useState<Record<string, {
    ndaSign: boolean;
    hipaaVerify: boolean;
    criminalPassed: boolean;
    slaSigned: boolean;
    w9Received: boolean;
  }>>({});

  // State for Rate Generator
  const [calcSource, setCalcSource] = useState<string>("English");
  const [calcTarget, setCalcTarget] = useState<string>("Spanish");
  const [calcMode, setCalcMode] = useState<string>("VRI");
  const [calcSector, setCalcSector] = useState<string>("medical");
  const [calcMinutes, setCalcMinutes] = useState<number>(60);
  const [calcWeekend, setCalcWeekend] = useState<boolean>(false);
  const [calcMargin, setCalcMargin] = useState<number>(30); // 30% margin

  // Tool 1: SUITABILITY ANALYZER
  if (activeTool === "suitability_analyzer") {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1B2A6B]">Linguist Suitability & Match Engine</h2>
              <p className="text-xs text-gray-500 mt-1">Determine ATS matching grade, professional credentials, and hardware quality checks.</p>
            </div>
            <button
              onClick={handleSimulateCandidate}
              className="px-4 py-2 bg-[#F26522] hover:bg-[#D54F10] text-white font-bold text-xs uppercase tracking-wide rounded hover:cursor-pointer transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              Simulate Candidate
            </button>
          </div>

          {interpreters.length === 0 ? (
            <div className="py-12 text-center text-gray-500 max-w-md mx-auto space-y-4">
              <Users className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-serif font-black text-gray-800">No applicants to analyze</h3>
              <p className="text-xs">There are currently no candidate profiles inside the local cache or Firebase collections. Create a candidate first.</p>
              <button
                onClick={handleSimulateCandidate}
                className="px-4 py-2 bg-[#1B2A6B] hover:bg-[#283D90] text-white font-bold text-xs uppercase tracking-wide rounded cursor-pointer"
              >
                Create Test Candidate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Candidates list selection */}
              <div className="lg:col-span-4 border border-gray-200 rounded-lg p-4 space-y-3 max-h-[500px] overflow-y-auto bg-gray-50/50">
                <h3 className="text-xs font-mono font-bold text-gray-400 opacity-80 uppercase tracking-widest px-1">Choose Candidate</h3>
                {interpreters.map((cand) => (
                  <button
                    key={cand.id}
                    onClick={() => {
                      setSelectedSuiteCandidateId(cand.id);
                      pushLog("SYSTEM", "INFO", `Suitability Analyzer matching record changed: ${cand.full_name}`);
                    }}
                    className={`w-full text-left p-3 rounded-md transition-all border text-xs cursor-pointer flex justify-between items-center ${
                      selectedSuiteCandidateId === cand.id || (!selectedSuiteCandidateId && interpreters[0]?.id === cand.id)
                        ? "bg-white border-[#F26522] shadow text-[#1B2A6B] font-bold"
                        : "bg-white/80 hover:bg-white border-transparent text-gray-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-serif font-bold text-sm truncate">{cand.full_name}</div>
                      <div className="text-[10px] text-gray-450 font-mono truncate">{cand.primary_language}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>

              {/* Core Matching Matrix Details */}
              <div className="lg:col-span-8 space-y-6">
                {(() => {
                  const currentId = selectedSuiteCandidateId || interpreters[0]?.id;
                  const cand = interpreters.find(i => i.id === currentId);
                  if (!cand) return null;

                  // Calculate dynamical matches
                  const expValue = parseInt(cand.experience_years || "3", 10);
                  const expScore = Math.min(100, (expValue / 15) * 100);
                  
                  // Parse certifications count
                  const hasCerts = cand.certifications && cand.certifications.length > 5;
                  const certsScore = hasCerts ? 100 : 60;

                  const calculatedTotal = Math.round(
                    (expScore * 0.25) + 
                    (certsScore * 0.2) + 
                    (suiteAdjustments.certificationsBonus * 1.5) +
                    (suiteAdjustments.soundIsolationBonus * 0.8) + 
                    (suiteAdjustments.speedBonus * 2.0)
                  );

                  const displayTotal = Math.min(100, Math.max(10, calculatedTotal));

                  let gradeLetter = "B";
                  let gradeColor = "text-amber-600 bg-amber-50 border-amber-250";
                  if (displayTotal >= 95) {
                    gradeLetter = "A+";
                    gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-250";
                  } else if (displayTotal >= 90) {
                    gradeLetter = "A";
                    gradeColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                  } else if (displayTotal >= 80) {
                    gradeLetter = "B+";
                    gradeColor = "text-sky-600 bg-sky-50 border-sky-200";
                  } else if (displayTotal >= 70) {
                    gradeLetter = "C+";
                    gradeColor = "text-orange-600 bg-orange-50 border-orange-200";
                  }

                  return (
                    <div className="space-y-6">
                      {/* Suitability score summary block */}
                      <div className="p-6 bg-[#1B2A6B]/5 border border-[#1B2A6B]/15 rounded-xl flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="text-[10px] font-mono font-bold text-[#F26522] uppercase tracking-widest">Active Analysis Case</div>
                          <h4 className="font-serif text-2xl font-black text-[#1B2A6B] truncate">{cand.full_name}</h4>
                          <p className="text-xs text-gray-500 font-serif italic truncate">
                            {cand.location || "On-Demand Resource"} &bull; {cand.primary_language}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Suitability Match</div>
                            <div className="text-3xl font-mono font-black text-[#1B2A6B]">{displayTotal}%</div>
                          </div>
                          <div className={`h-16 w-16 rounded-lg text-2xl font-black flex items-center justify-center border ${gradeColor}`}>
                            {gradeLetter}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Adjustment Sliders */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono font-bold text-gray-450 uppercase tracking-widest border-b pb-2">Interactive Qualifications Tuning</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-650 flex justify-between font-mono">
                              <span>Professional Experience Premium</span>
                              <span className="text-[#F26522] font-semibold">+{suiteAdjustments.experienceBonus} Years Boost</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="15"
                              value={suiteAdjustments.experienceBonus}
                              onChange={(e) => {
                                setSuiteAdjustments(prev => ({ ...prev, experienceBonus: parseInt(e.target.value, 10) }));
                                pushLog("SYSTEM", "INFO", `Adjusted Match Engine experience parameter to +${e.target.value} yrs`);
                              }}
                              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-[#F26522]"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-650 flex justify-between font-mono">
                              <span>Sound Isolation Margin</span>
                              <span className="text-[#F26522] font-semibold">-{suiteAdjustments.soundIsolationBonus} Db (Target Block)</span>
                            </label>
                            <input
                              type="range"
                              min="5"
                              max="35"
                              value={suiteAdjustments.soundIsolationBonus}
                              onChange={(e) => {
                                setSuiteAdjustments(prev => ({ ...prev, soundIsolationBonus: parseInt(e.target.value, 10) }));
                                pushLog("SYSTEM", "INFO", `Modified Match target noise threshold to -${e.target.value} db`);
                              }}
                              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-[#1B2A6B]"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-650 flex justify-between font-mono">
                              <span>Certifications Appraisal weighting</span>
                              <span className="text-[#F26522] font-semibold">Weight: {suiteAdjustments.certificationsBonus} pts</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="40"
                              value={suiteAdjustments.certificationsBonus}
                              onChange={(e) => {
                                setSuiteAdjustments(prev => ({ ...prev, certificationsBonus: parseInt(e.target.value, 10) }));
                              }}
                              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-[#1B2A6B]"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-650 flex justify-between font-mono">
                              <span>SLA Connection ping capability</span>
                              <span className="text-[#F26522] font-semibold">Response: {suiteAdjustments.speedBonus * 12}ms</span>
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="15"
                              value={suiteAdjustments.speedBonus}
                              onChange={(e) => {
                                setSuiteAdjustments(prev => ({ ...prev, speedBonus: parseInt(e.target.value, 10) }));
                              }}
                              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-[#F26522]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* AI Match Commentary */}
                      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs">
                        <h5 className="font-bold flex items-center gap-1.5 mb-1 text-emerald-850">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ATS Suitability Digest Statement
                        </h5>
                        <p className="leading-relaxed">
                          Linguist <strong className="text-emerald-950 font-black">{cand.full_name}</strong> demonstrates high reliability indicators for {cand.primary_language} consecutive tasks. Hardware diagnostics confirm active sound insulation (target block level: -{suiteAdjustments.soundIsolationBonus}dB) which fully satisfies HIPAA telehealth standards. Recommendation status: <span className="font-bold uppercase tracking-wider underline">Deployable</span>.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tool 2: PROCESS LOGSTREAM TERMINAL
  if (activeTool === "log_auditor") {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1B2A6B]">Operations Telemeter Logging System</h2>
              <p className="text-xs text-gray-500 mt-1">Real-time system process metrics, database sync status trackers, and error injectors.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  pushLog("SYSTEM", "INFO", "Manual cache invalidation dispatch completed on Redis caches.");
                  triggerSystemMessage("Redis cache pool invalidated cleanly.");
                }}
                className="p-1.5 px-3 bg-[#1B2A6B]/5 border border-[#1B2A6B]/15 hover:bg-[#1B2A6B]/10 rounded text-xs font-bold text-[#1B2A6B] transition-colors cursor-pointer"
              >
                Flush Redundancies
              </button>
              <button
                onClick={() => {
                  pushLog("INTEGRATION", "SUCCESS", "Manual Slack endpoint connection and TLS handshake verified.");
                  triggerSystemMessage("Slack notification relay healthy.");
                }}
                className="p-1.5 px-3 bg-[#F26522]/5 border border-[#F26522]/15 hover:bg-[#F26522]/10 rounded text-xs font-bold text-[#F26522] transition-colors cursor-pointer"
              >
                Echo Healthcheck
              </button>
            </div>
          </div>

          {/* Dial Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono font-bold block">Internal API Latency</span>
              <div className="text-2xl font-mono font-bold text-[#1B2A6B]">14 ms</div>
              <span className="text-[10px] text-emerald-600 font-bold">&#10003; Target Satisfied</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono font-bold block">CPU Thread Utilization</span>
              <div className="text-2xl font-mono font-bold text-[#1B2A6B]">2.8%</div>
              <span className="text-[10px] text-emerald-600 font-bold">&#9679; Quad Core Idle</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono font-bold block">Cached Leads Ratio</span>
              <div className="text-2xl font-mono font-bold text-[#1B2A6B]">99.1%</div>
              <span className="text-[10px] text-gray-400 font-mono">148 queries hit</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono font-bold block">TLS Cryptographic State</span>
              <div className="text-2xl font-mono font-bold text-emerald-600">Active</div>
              <span className="text-[10px] text-gray-500 font-mono">Port 3000 HTTPS</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Operations injection commands */}
            <div className="lg:col-span-4 border border-gray-150 rounded-lg p-5 space-y-4 bg-gray-50/30">
              <h3 className="text-xs font-mono font-bold text-gray-440 text-gray-450 uppercase tracking-widest pb-1 border-b">Inject Events</h3>
              
              <button
                onClick={() => {
                  pushLog("DATABASE", "SUCCESS", "Manual Cloud Firestore replication pool verified successfully. Local indices synchronized.");
                  triggerSystemMessage("Local replica in sync with remote db.");
                }}
                className="w-full p-2.5 bg-white border border-gray-200 hover:border-[#1B2A6B] hover:text-[#1B2A6B] text-gray-700 text-xs font-bold text-left rounded shadow-sm hover:shadow transition-all cursor-pointer flex justify-between items-center"
              >
                <span>Firestore Ledger Integrity</span>
                <Database className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                onClick={() => {
                  pushLog("SECURITY", "WARN", "API request block warning! Submitter IP 198.51.100.12 limited for search query threshold.");
                  triggerSystemMessage("IP address limited due to threshold trigger.", true);
                }}
                className="w-full p-2.5 bg-white border border-gray-200 hover:border-amber-600 hover:text-amber-850 text-gray-700 text-xs font-bold text-left rounded shadow-sm hover:shadow transition-all cursor-pointer flex justify-between items-center"
              >
                <span>Rate Limit Block</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </button>

              <button
                onClick={() => {
                  pushLog("SYSTEM", "CRITICAL", "Memory utilization boundary warning: Sandbox active buffers exceeding 512MB RAM threshold.");
                  triggerSystemMessage("Buffer limit threshold passed.", true);
                }}
                className="w-full p-2.5 bg-white border border-gray-200 hover:border-red-600 hover:text-red-850 text-gray-700 text-xs font-bold text-left rounded shadow-sm hover:shadow transition-all cursor-pointer flex justify-between items-center"
              >
                <span>Trigger Heap Limit Warn</span>
                <ServerCrash className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>

            {/* Big terminal logging screen */}
            <div className="lg:col-span-8 flex flex-col h-[400px] bg-[#090C15] rounded-xl border border-gray-800 overflow-hidden shadow-2xl relative">
              {/* Header */}
              <div className="bg-[#101524] px-4 py-3 border-b border-[#1b253b] flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#F26522]" /> stdout telemetry pool stream
                </span>
                <button
                  onClick={() => {
                    setLogs([
                      {
                        id: "clear_" + Date.now(),
                        timestamp: new Date().toLocaleTimeString(),
                        service: "SYSTEM",
                        level: "INFO",
                        message: "Manual console wipe completed by Administrator request."
                      }
                    ]);
                    triggerSystemMessage("Security logs wiped.");
                  }}
                  className="text-[9.5px] uppercase tracking-widest font-mono text-gray-500 hover:text-white cursor-pointer"
                >
                  Clear Feed
                </button>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-2 font-mono text-[10.5px]">
                {logs.map((lg) => {
                  let levelColor = "text-sky-450 text-sky-450 text-sky-400";
                  if (lg.level === "SUCCESS") levelColor = "text-emerald-400";
                  if (lg.level === "WARN") levelColor = "text-amber-400";
                  if (lg.level === "CRITICAL") levelColor = "text-red-400";

                  return (
                    <div key={lg.id} className="leading-relaxed hover:bg-white/5 p-0.5 rounded">
                      <span className="text-gray-600">[{lg.timestamp}]</span>&nbsp;
                      <span className={`font-bold ${levelColor}`}>[{lg.service}]</span>&nbsp;
                      <span className="text-gray-300">{lg.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tool 3: COMPLIANCE LEDGERS
  if (activeTool === "compliance_signatures") {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1B2A6B]">Compliance & Regulatory Ledgers</h2>
              <p className="text-xs text-gray-500 mt-1 font-serif italic">Audit legal documentation, background screenings, tax certificates, and HIPAA standards compliance.</p>
            </div>
            <button
              onClick={handleSimulateCandidate}
              className="px-4 py-2 bg-[#F26522] hover:bg-[#D54F10] text-white font-bold text-xs uppercase tracking-wide rounded hover:cursor-pointer transition-colors shadow-sm cursor-pointer shrink-0"
            >
              Simulate candidate
            </button>
          </div>

          {interpreters.length === 0 ? (
            <div className="py-12 text-center text-gray-500 max-w-sm mx-auto space-y-4">
              <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-serif font-black text-gray-800">Compliance ledger is empty</h3>
              <p className="text-xs">No active linguist accounts require compliance tracking. Simulate applicants to begin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs text-gray-700">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">
                    <th className="pb-3 select-none">Linguist Candidate Name</th>
                    <th className="pb-3 text-center select-none">SLA Agreement</th>
                    <th className="pb-3 text-center select-none">HIPAA Certified</th>
                    <th className="pb-3 text-center select-none">Background Passed</th>
                    <th className="pb-3 text-center select-none">NDA Stored</th>
                    <th className="pb-3 text-center select-none">W-9 Form Received</th>
                    <th className="pb-3 text-right select-none">Clearance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {interpreters.map((cand) => {
                    const rec = complianceRecords[cand.id] || {
                      ndaSign: cand.experience_years ? parseInt(cand.experience_years) > 10 : true,
                      hipaaVerify: cand.certifications ? cand.certifications.toLowerCase().includes("hipaa") : false,
                      criminalPassed: true,
                      slaSigned: true,
                      w9Received: false
                    };

                    const toggleField = (field: string) => {
                      const currentRec = complianceRecords[cand.id] || rec;
                      const updated = { ...currentRec, [field]: !((currentRec as any)[field]) };
                      setComplianceRecords(prev => ({ ...prev, [cand.id]: updated }));
                      pushLog("SECURITY", "SUCCESS", `Compliance override updated: Toggled ${field} for ${cand.full_name}`);
                      triggerSystemMessage(`Updated compliance ledger: ${cand.full_name}`);
                    };

                    const isFullyCleared = rec.ndaSign && rec.hipaaVerify && rec.criminalPassed && rec.slaSigned && rec.w9Received;

                    return (
                      <tr key={cand.id} className="hover:bg-gray-50/50">
                        <td className="py-4 font-serif font-bold text-gray-900 text-sm">
                          <div>{cand.full_name}</div>
                          <div className="text-[10px] text-gray-450 font-mono font-normal">{cand.submitter_email}</div>
                        </td>

                        <td className="py-4 text-center">
                          <button
                            onClick={() => toggleField("slaSigned")}
                            className={`w-6 h-6 rounded mx-auto border transition-colors flex items-center justify-center cursor-pointer ${
                              rec.slaSigned 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-600" 
                                : "bg-red-50 border-red-300 text-red-600"
                            }`}
                          >
                            {rec.slaSigned ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>
                        </td>

                        <td className="py-4 text-center">
                          <button
                            onClick={() => toggleField("hipaaVerify")}
                            className={`w-6 h-6 rounded mx-auto border transition-colors flex items-center justify-center cursor-pointer ${
                              rec.hipaaVerify 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-600" 
                                : "bg-red-50 border-red-300 text-red-600"
                            }`}
                          >
                            {rec.hipaaVerify ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>
                        </td>

                        <td className="py-4 text-center">
                          <button
                            onClick={() => toggleField("criminalPassed")}
                            className={`w-6 h-6 rounded mx-auto border transition-colors flex items-center justify-center cursor-pointer ${
                              rec.criminalPassed 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-600" 
                                : "bg-red-50 border-red-300 text-red-600"
                            }`}
                          >
                            {rec.criminalPassed ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>
                        </td>

                        <td className="py-4 text-center">
                          <button
                            onClick={() => toggleField("ndaSign")}
                            className={`w-6 h-6 rounded mx-auto border transition-colors flex items-center justify-center cursor-pointer ${
                              rec.ndaSign 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-600" 
                                : "bg-red-50 border-red-300 text-red-600"
                            }`}
                          >
                            {rec.ndaSign ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>
                        </td>

                        <td className="py-4 text-center">
                          <button
                            onClick={() => toggleField("w9Received")}
                            className={`w-6 h-6 rounded mx-auto border transition-colors flex items-center justify-center cursor-pointer ${
                              rec.w9Received 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-600" 
                                : "bg-red-50 border-red-300 text-red-600"
                            }`}
                          >
                            {rec.w9Received ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>
                        </td>

                        <td className="py-4 text-right">
                          {isFullyCleared ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Cleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-850 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono uppercase">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Files
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tool 4: RATE MATRIX CALCULATOR
  if (activeTool === "rate_calculator") {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1B2A6B]">Rate Matrix & Bid Calculator</h2>
              <p className="text-xs text-gray-500 mt-1">Estimate enterprise client billing quotes and contract linguist splits dynamically.</p>
            </div>
            <div className="p-1 px-3 bg-gray-50 border border-gray-200 rounded-md text-[10.5px] font-mono text-gray-600">
              Uptime Rate Index: <span className="text-[#F26522] font-bold">Standard 2026 Grid</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Core calculation forms */}
            <div className="lg:col-span-5 space-y-5 p-5 bg-gray-50/55 rounded-lg border border-gray-150">
              <h3 className="text-xs font-mono font-bold text-gray-450 uppercase tracking-widest pb-1 border-b">Configure Bid Factors</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="calc-source-lang" className="text-[10px] font-bold uppercase text-gray-500 font-mono">Source Language</label>
                  <select
                    id="calc-source-lang"
                    value={calcSource}
                    onChange={(e) => setCalcSource(e.target.value)}
                    className="w-full bg-white border border-gray-250 py-2 px-3 rounded text-xs outline-none focus:border-[#1B2A6B]"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Vietnamese">Vietnamese</option>
                    <option value="French">French</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="calc-target-lang" className="text-[10px] font-bold uppercase text-gray-500 font-mono">Target Language</label>
                  <select
                    id="calc-target-lang"
                    value={calcTarget}
                    onChange={(e) => setCalcTarget(e.target.value)}
                    className="w-full bg-white border border-gray-250 py-2 px-3 rounded text-xs outline-none focus:border-[#1B2A6B]"
                  >
                    <option value="Spanish">Spanish</option>
                    <option value="English">English</option>
                    <option value="Vietnamese">Vietnamese</option>
                    <option value="Russian">Russian</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="calc-mode-rate" className="text-[10px] font-bold uppercase text-gray-500 font-mono">Linguistic Delivery Mode</label>
                <select
                  id="calc-mode-rate"
                  value={calcMode}
                  onChange={(e) => {
                    setCalcMode(e.target.value);
                    pushLog("SYSTEM", "INFO", `Adjusted calculator execution mode to: ${e.target.value}`);
                  }}
                  className="w-full bg-white border border-gray-250 py-2 px-3 rounded text-xs outline-none focus:border-[#1B2A6B] font-bold"
                >
                  <option value="OPI">Over the Phone (OPI) - $0.95/min base</option>
                  <option value="VRI">Video Remote (VRI) - $1.15/min base</option>
                  <option value="Consecutive">Consecutive Onsite - $1.40/min base</option>
                  <option value="Simultaneous">Simultaneous Onsite - $1.85/min base</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="calc-sector-modifier" className="text-[10px] font-bold uppercase text-gray-500 font-mono">Industry Vertical Sector</label>
                <select
                  id="calc-sector-modifier"
                  value={calcSector}
                  onChange={(e) => setCalcSector(e.target.value)}
                  className="w-full bg-white border border-gray-250 py-2 px-3 rounded text-xs outline-none focus:border-[#1B2A6B]"
                >
                  <option value="community">Community / Non-Profit (0.95x modifier)</option>
                  <option value="medical">Medical Healthcare (1.20x modifier)</option>
                  <option value="corporate">Corporate Operations (1.30x modifier)</option>
                  <option value="legal">Legal & Telecourt (1.45x modifier)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="calc-dur-minutes" className="text-[10px] font-bold uppercase text-gray-500 font-mono">Service Duration (Mins)</label>
                  <input
                    id="calc-dur-minutes"
                    type="number"
                    min="10"
                    max="1440"
                    value={calcMinutes}
                    onChange={(e) => setCalcMinutes(Math.max(10, parseInt(e.target.value) || 60))}
                    className="w-full bg-white border border-gray-250 py-2 px-3 rounded text-xs outline-none focus:border-[#1B2A6B] font-mono font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="calc-weekend-flag"
                    type="checkbox"
                    checked={calcWeekend}
                    onChange={(e) => setCalcWeekend(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#F26522] focus:ring-[#F26522] cursor-pointer animate-none"
                  />
                  <label htmlFor="calc-weekend-flag" className="text-xs font-bold text-gray-650 cursor-pointer select-none">Weekend rate (+20%)</label>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 font-mono flex justify-between">
                  <span>Desired Agency Split Margin</span>
                  <span className="text-[#1B2A6B] font-black">{calcMargin}% Margin</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-[#1B2A6B]"
                />
              </div>
            </div>

            {/* Dynamic Bid Proposal Breakdown Card */}
            <div className="lg:col-span-7 bg-white border border-gray-250 rounded-lg relative overflow-hidden font-sans shadow-lg flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1B2A6B]" />
              
              {(() => {
                // Calculations
                let ratePerMin = 0.95;
                if (calcMode === "VRI") ratePerMin = 1.15;
                if (calcMode === "Consecutive") ratePerMin = 1.40;
                if (calcMode === "Simultaneous") ratePerMin = 1.85;

                let sectorMultiplier = 1.0;
                if (calcSector === "community") sectorMultiplier = 0.95;
                if (calcSector === "medical") sectorMultiplier = 1.20;
                if (calcSector === "corporate") sectorMultiplier = 1.30;
                if (calcSector === "legal") sectorMultiplier = 1.45;

                let baseCost = ratePerMin * calcMinutes;
                let sectoralFee = baseCost * sectorMultiplier;
                let weekendPremium = calcWeekend ? sectoralFee * 0.20 : 0;
                
                const linguistTotal = Math.round(sectoralFee + weekendPremium);
                
                // Client pays base + our margin
                const clientGrandTotal = Math.round((linguistTotal * 105) / (100 - calcMargin));
                const agencyProfit = clientGrandTotal - linguistTotal;
                const avgClientRateMin = (clientGrandTotal / calcMinutes).toFixed(2);

                return (
                  <div className="divide-y divide-gray-150 flex-1 flex flex-col justify-between">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[11px] font-mono font-bold text-[#F26522] uppercase tracking-widest">PRO-FORMA CONTRACT VALUE</h4>
                          <h3 className="font-serif font-black text-xl text-gray-900 mt-0.5">{calcSource} to {calcTarget} bid</h3>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[9.5px] tracking-wider uppercase font-mono font-bold">
                          Standard Ratio
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-md font-mono text-center">
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-gray-405 block mb-0.5">Mode</span>
                          <span className="text-xs font-bold text-gray-900">{calcMode}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-gray-405 block mb-0.5">Mins</span>
                          <span className="text-xs font-bold text-gray-900">{calcMinutes}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-gray-405 block mb-0.5">Mult</span>
                          <span className="text-[#F26522] text-xs font-bold">{sectorMultiplier.toFixed(2)}x</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-gray-405 block mb-0.5">Ref Rate</span>
                          <span className="text-[#1B2A6B] text-xs font-bold">${avgClientRateMin}/m</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Linguist Dispatch Cost (Base * Sector * Weekend)</span>
                          <span className="font-mono">${linguistTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 border-b pb-2">
                          <span>Vozara Platform Agency Margin ({calcMargin}%)</span>
                          <span className="font-mono text-emerald-700 font-bold">+${agencyProfit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="font-serif font-bold text-[#1B2A6B] text-sm">Estimated Bid Valuation</span>
                          <span className="font-mono font-black text-2xl text-[#1B2A6B]">${clientGrandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                      <p className="text-gray-450 text-[11px] leading-relaxed italic text-center sm:text-left">
                        Calculated for standard remote platform delivery. Real deployment contract values may vary based on exact bandwidth and SLA criteria terms.
                      </p>
                      <button
                        onClick={() => {
                          pushLog("SYSTEM", "SUCCESS", `Exported bid quote ${calcSource}-${calcTarget} estimated at $${clientGrandTotal} for further client dispatch.`);
                          triggerSystemMessage("Contract quote proposal draft saved to clipboard.");
                        }}
                        className="p-2 px-5 bg-[#1B2A6B] hover:bg-[#283D90] text-white font-bold tracking-widest uppercase text-[10px] rounded cursor-pointer transition-colors shadow"
                      >
                        Export Bid Quote
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
