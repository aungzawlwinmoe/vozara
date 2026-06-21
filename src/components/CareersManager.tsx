import React, { useState, useEffect } from "react";
import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from "../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Globe, 
  FileText, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { CareerRole } from "../types";

interface CareersManagerProps {
  pushLog: (source: string, level: "INFO" | "SUCCESS" | "WARN" | "CRITICAL", message: string) => void;
  triggerSystemMessage: (text: string, error?: boolean) => void;
}

export const CareersManager: React.FC<CareersManagerProps> = ({
  pushLog,
  triggerSystemMessage
}) => {
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>("");
  const [type, setType] = useState<string>("Contract");
  const [location, setLocation] = useState<string>("Remote");
  const [languages, setLanguages] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [reqInput, setReqInput] = useState<string>("");
  const [isInterpreter, setIsInterpreter] = useState<boolean>(true);
  const [informationManual, setInformationManual] = useState<string>("");

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const q = collection(db, "vozarals_career_roles");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CareerRole[] = [];
      snapshot.forEach((snapDoc) => {
        list.push({ id: snapDoc.id, ...snapDoc.data() } as CareerRole);
      });
      setRoles(list);
      setSyncError(null);
      setIsLoading(false);
    }, (error) => {
      console.warn("Firestore collection subscription failure:", error);
      pushLog("CAREERS", "CRITICAL", `Real-time synchronization failure on vozarals_career_roles: ${error.message || error}`);
      setSyncError(error.message || String(error));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !languages.trim()) {
      triggerSystemMessage("Please fill in the required fields: Title, Languages, and Description.", true);
      return;
    }

    // Split requirements by commas or newlines and trim whitespace
    const requirements = reqInput
      .split(/[\n,]+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const payload = {
      title: title.trim(),
      type: type.trim(),
      location: location.trim(),
      languages: languages.trim(),
      description: description.trim(),
      requirements,
      isInterpreter,
      informationManual: informationManual.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      if (!db) {
        throw new Error("Firestore database instance is offline.");
      }

      pushLog("CAREERS", "INFO", `Provisioning new open contractor role: ${payload.title}`);
      const docRef = await addDoc(collection(db, "vozarals_career_roles"), payload);
      pushLog("CAREERS", "SUCCESS", `Successfully listed dynamic role "${payload.title}" with ID ${docRef.id}.`);
      triggerSystemMessage(`Contractor Role "${payload.title}" published successfully!`);

      // Reset form variables
      setTitle("");
      setType("Contract");
      setLocation("Remote");
      setLanguages("");
      setDescription("");
      setReqInput("");
      setInformationManual("");
      setIsInterpreter(true);
    } catch (err: any) {
      pushLog("CAREERS", "CRITICAL", `Failed to publish contractor role: ${err.message || err}`);
      triggerSystemMessage(`Role publication failed: ${err.message || err}`, true);
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    try {
      if (!db) {
        throw new Error("Firestore database is unavailable.");
      }

      pushLog("CAREERS", "WARN", `Commencing deletion of dynamic role: ${name} (${id})`);
      await deleteDoc(doc(db, "vozarals_career_roles", id));
      pushLog("CAREERS", "SUCCESS", `Dynamic role "${name}" purged successfully.`);
      triggerSystemMessage(`Contractor role "${name}" deleted.`);
      if (deleteConfirmId === id) {
        setDeleteConfirmId(null);
      }
    } catch (err: any) {
      pushLog("CAREERS", "CRITICAL", `Failed to purge contractor role: ${err.message || err}`);
      triggerSystemMessage(`Deletion failed: ${err.message || err}`, true);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Tool Header Banner */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1B2A6B] flex items-center gap-2">
              <Briefcase className="w-5.5 h-5.5 text-[#F26522]" />
              Careers &amp; Open Contractor Roles Manager
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Create, customize, and list dynamic freelance opportunities on the public careers pipeline. 
            </p>
          </div>
          <div className="p-1 px-3 bg-indigo-50 border border-indigo-100 rounded text-[10.5px] font-mono text-[#1B2A6B] font-bold">
            Live Careers Gateway Actively Listening
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Create/Add Open Position Form */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-150 pb-3">
            <h3 className="text-sm uppercase font-extrabold text-[#1B2A6B] tracking-wider font-mono flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#F26522]" /> Publish Contractor Role
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Define a new language specialty opportunity to be displayed on the careers portal.</p>
          </div>

          <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabic & Somali Clinical Interpreter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-[#1B2A6B]/30 outline-none text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">Languages Needed *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabic / Somali / English"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-[#1B2A6B]/30 outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">Employment/Role Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white outline-none text-gray-800"
                >
                  <option value="Contract">Contract / Freelance</option>
                  <option value="Part-Time / Contract">Part-Time / Contract</option>
                  <option value="Full-Time / Hybrid">Full-Time / Hybrid</option>
                  <option value="On-Call / Contingent">On-Call / Contingent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, United States / On-site Seattle WA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-[#1B2A6B]/30 outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-1.5 p-3.5 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-600 font-mono">Routing Target</span>
                <span className="text-[10px] text-gray-450">Determine which button user sees in the careers portal details tab</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInterpreter(!isInterpreter)}
                className="flex items-center gap-2 cursor-pointer transition-all p-1"
              >
                {isInterpreter ? (
                  <div className="flex items-center gap-1 text-[#F26522] font-bold">
                    <span>Interpreter apply form</span>
                    <ToggleRight className="w-8 h-8 shrink-0" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[#1B2A6B] font-bold">
                    <span>Contact Recruiting Desk</span>
                    <ToggleLeft className="w-8 h-8 shrink-0" />
                  </div>
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">Dossier / Brief Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Give a compelling, high-level summary of the tasks, shifts, frequency, and background of this OPI/VRI or on-site role..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-[#1B2A6B]/30 outline-none text-gray-800 text-xs font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">
                Candidate Requirements (One per line or comma-separated)
              </label>
              <textarea
                rows={4}
                placeholder="e.g. &#13;Active CCHI or NBCMI certification is required&#13;Minimum 100+ hours logged in medical environment&#13;Native or bilingual fluency in Somali & English"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-[#1B2A6B]/30 outline-none text-gray-800 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-gray-500 font-mono">
                Role Information Manual (Optional &mdash; Rich internal directions / guidelines)
              </label>
              <textarea
                rows={5}
                placeholder="List direct requirements, specialized protocols, SLAs, hourly payout ranges, required tool checkmarks, or standard training guides that candidates should read immediately under the Accordion Expandable panel..."
                value={informationManual}
                onChange={(e) => setInformationManual(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-1 focus:ring-[#1B2A6B]/30 outline-none text-gray-800 text-xs font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1B2A6B] hover:bg-[#1B2A6B]/90 text-white font-serif text-[13px] font-bold rounded shadow-md cursor-pointer tracking-wider flex items-center justify-center gap-2 uppercase mt-2 transition-all"
            >
              <Plus className="w-4 h-4 text-[#F26522]" />
              Publish Dynamic Open Position
            </button>
            
          </form>
        </div>

        {/* Dynamic / Added Position Live Monitor */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="border-b border-gray-150 pb-3 flex justify-between items-center">
              <h3 className="text-sm uppercase font-extrabold text-[#1B2A6B] tracking-wider font-mono flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#F26522]" /> Custom Listed Roles
              </h3>
              <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full font-mono font-bold text-[9px] text-[#1B2A6B]">
                {roles.length} Dynamic
              </span>
            </div>

            {syncError && (
              <div className="p-4 rounded border border-red-200 bg-red-50 text-red-700 text-[11px] font-sans flex items-start gap-2 animate-fade-in mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold uppercase tracking-wider block font-mono text-[9.5px]">Telemetry Rule Synchronization Latency</span>
                  <p className="mt-0.5 leading-relaxed text-red-600">
                    The local browser terminal detected a delay in the database security handshake propagation. Changes may require up to 60 seconds to resolve.
                  </p>
                  <p className="text-[9.5px] text-red-550 font-mono mt-1 select-all break-all">{syncError}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="animate-spin text-gray-300 font-serif font-black text-2xl mb-1">...</div>
                <div className="text-[10px] font-mono tracking-widest uppercase">Querying active grid...</div>
              </div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-md bg-gray-50 text-gray-400 space-y-2">
                <Info className="w-6 h-6 text-gray-350 mx-auto" />
                <p className="text-[10.5px]">No custom careers are defined in the dynamic index yet.</p>
                <p className="text-[9.5px] text-gray-400 leading-normal">Use the publishing panel on the left to add freelance or contingent roles instantly.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[750px] overflow-y-auto pr-1">
                {roles.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-md border border-gray-150 bg-gray-50 hover:bg-white hover:shadow-sm transition-all text-xs relative group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-serif font-bold text-[#1B2A6B] pr-4">{item.title}</h4>
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1 shrink-0 animate-fade-in">
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(item.id, item.title)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1 text-red-400 hover:text-red-600 rounded bg-transparent hover:bg-red-50 cursor-pointer self-start shrink-0"
                            title="Purge Contractor Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-mono text-gray-450 uppercase leading-none">
                        <span className="text-[#F26522] font-semibold">{item.type}</span>
                        <span>&bull;</span>
                        <span>{item.location}</span>
                        <span>&bull;</span>
                        <span className="lowercase italic font-semibold text-indigo-900">{item.languages}</span>
                      </div>

                      <p className="text-[10.5px] text-gray-500 leading-relaxed max-w-[95%]">
                        {item.description}
                      </p>

                      {item.requirements && item.requirements.length > 0 && (
                        <div className="p-1.5 px-2 bg-white rounded border border-gray-100 text-[10px] space-y-1">
                          <span className="text-[8.5px] font-extrabold uppercase font-mono text-gray-450">Requirements Listed:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                            {item.requirements.slice(0, 3).map((req, index) => (
                              <li key={index} className="truncate">{req}</li>
                            ))}
                            {item.requirements.length > 3 && (
                              <li className="italic list-none text-[9px] text-[#F26522] font-semibold font-mono">+{item.requirements.length - 3} more...</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {item.informationManual && (
                        <div className="p-2 bg-indigo-50/50 border border-indigo-100/50 rounded text-[9.5px]">
                          <span className="font-mono text-[8.5px] font-bold text-[#1B2A6B] uppercase block">Information Manual Present</span>
                          <p className="text-gray-500 truncate mt-0.5">{item.informationManual}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guidance Info block */}
          <div className="p-4 rounded-md border border-[#1B2A6B]/15 bg-[#dae8ff]/40 text-xs text-[#1B2A6B] space-y-2">
            <h4 className="font-serif font-bold flex items-center gap-1.5 leading-none">
              <Info className="w-4 h-4 text-[#F26522]" /> Administrative Controls Guide
            </h4>
            <p className="text-[10.5px] leading-relaxed text-gray-600">
              Any position created here is dynamically published to the public <strong>Careers Section</strong> of the application instantaneously through live Firestore subscriptions. Removals are retroactive and immediately strip accordion cells.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
