import React, { useState, useEffect } from "react";
import { X, Check, Loader2, Send } from "lucide-react";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredService?: string;
}

export default function QuoteModal({ isOpen, onClose, preferredService = "" }: QuoteModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    submitter_email: "",
    phone: "",
    organization: "",
    service: preferredService || "Interpreter Staffing",
    language_pair: "",
    message: ""
  });

  const [formState, setFormState] = useState<"idle" | "fetching_tokens" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [prepData, setPrepData] = useState<any>(null);

  // Sync preferredService if modified externally
  useEffect(() => {
    if (preferredService) {
      setFormData((prev) => ({ ...prev, service: preferredService }));
    }
  }, [preferredService]);

  // Clean form on modal close or reset
  const handleReset = () => {
    setFormData({
      full_name: "",
      submitter_email: "",
      phone: "",
      organization: "",
      service: preferredService || "Interpreter Staffing",
      language_pair: "",
      message: ""
    });
    setFormState("idle");
    setErrorMessage("");
    setPrepData(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.submitter_email || !formData.message) {
      setErrorMessage("Please complete all required fields (Full Name, Email, and Message).");
      setFormState("error");
      return;
    }

    try {
      // Step 1: Fetch anti-spam tokens (GET prepare endpoint)
      setFormState("fetching_tokens");
      const prepareRes = await fetch(`/api/forms/prepare?form_key=vozara-contact`);
      if (!prepareRes.ok) {
        throw new Error("Unable to obtain security token. Please try again.");
      }
      const prepJson = await prepareRes.json();
      
      if (!prepJson.success || !prepJson.required_hidden_fields) {
        throw new Error("Invalid security handshake. Please refresh.");
      }

      // Step 2: Merge security tokens into payload and post form data
      setFormState("submitting");
      
      const payload = {
        form_key: "vozara-contact",
        ...prepJson.required_hidden_fields,
        full_name: formData.full_name,
        submitter_email: formData.submitter_email,
        phone: formData.phone,
        organization: formData.organization,
        service: formData.service,
        language_pair: formData.language_pair,
        message: formData.message
      };

      const submitRes = await fetch("/api/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const submitJson = await submitRes.json();
      if (!submitRes.ok || !submitJson.success) {
        throw new Error(submitJson.error || "Submission encountered a server error.");
      }

      setFormState("success");
    } catch (err: any) {
      console.error("Quote submit error:", err);
      setErrorMessage(err.message || "Something went wrong. Please try again or call us.");
      setFormState("error");
    }
  };

  const servicesOption = [
    "Interpreter Staffing",
    "Translation Services",
    "Localization Solutions",
    "Remote Interpreting (OPI/VRI)",
    "Multilingual Support",
    "Other"
  ];

  return (
    <div id="quote-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-dark/60 backdrop-blur-md transition-opacity duration-300">
      <div 
        id="quote-modal" 
        className="relative w-full max-w-lg bg-white/90 backdrop-blur-lg rounded-sm shadow-2xl border border-white/40 overflow-hidden transform transition-all duration-300"
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-brand-navy to-brand-orange" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white/40 border-b border-white/35">
          <div>
            <h3 className="font-serif text-2xl font-bold text-brand-navy">Request a Custom Quote</h3>
            <p className="text-xs text-brand-orange font-semibold tracking-wide uppercase mt-1">Vozara Language Services</p>
          </div>
          <button 
            type="button"
            id="quote-modal-close"
            onClick={handleClose} 
            className="p-2 text-gray-400 hover:text-brand-orange hover:bg-white/80 rounded-sm transition-colors duration-200 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {formState === "success" ? (
            <div id="quote-success-panel" className="text-center py-8 px-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-sm bg-green-100 text-green-600 mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-brand-navy mb-2">Quote Request Submitted</h4>
              <p className="text-gray-600 text-sm max-w-sm mx-auto mb-6">
                Your quote parameters have been registered securely. A dedicated Language Program Director will evaluate your requirements and reach out within 1 business day.
              </p>
              <button 
                type="button" 
                id="quote-success-close-btn"
                onClick={handleClose}
                className="px-6 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-sm shadow-md transition-colors duration-200 cursor-pointer text-sm"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form id="quote-form" onSubmit={handleSubmit} className="space-y-4">
              {formState === "error" && (
                <div id="quote-error-banner" className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-sm leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quote_name" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Full Name <span className="text-brand-orange">*</span>
                  </label>
                  <input
                    type="text"
                    id="quote_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
                
                <div>
                  <label htmlFor="quote_email" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Work Email <span className="text-brand-orange">*</span>
                  </label>
                  <input
                    type="email"
                    id="quote_email"
                    required
                    value={formData.submitter_email}
                    onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                    placeholder="jane@organization.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quote_phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="quote_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>

                <div>
                  <label htmlFor="quote_organization" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    id="quote_organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                    placeholder="Supreme Healthcare Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quote_service" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Service Needed <span className="text-brand-orange">*</span>
                  </label>
                  <select
                    id="quote_service"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                  >
                    {servicesOption.map((srv) => (
                      <option key={srv} value={srv}>
                        {srv}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quote_langs" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Language Pair (e.g. EN ⇄ ES)
                  </label>
                  <input
                    type="text"
                    id="quote_langs"
                    value={formData.language_pair}
                    onChange={(e) => setFormData({ ...formData, language_pair: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                    placeholder="e.g. English to Mandarin"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="quote_message" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Scope Details / Message <span className="text-brand-orange">*</span>
                </label>
                <textarea
                  id="quote_message"
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300/60 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy/60 focus:border-brand-navy bg-white/40 backdrop-blur-sm focus:bg-white transition-all"
                  placeholder="Describe your schedule, volume, target documents, or on-site address context..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="quote-submit-btn"
                  disabled={formState === "fetching_tokens" || formState === "submitting"}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all duration-200 disabled:opacity-60 select-none cursor-pointer text-sm tracking-wide uppercase"
                >
                  {formState === "fetching_tokens" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Establishing Security Token...
                    </>
                  ) : formState === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Securely...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      Send My Quote Request
                    </>
                  )}
                </button>
              </div>

              <div className="text-[10px] text-gray-400 text-center leading-normal">
                By sending, you agree to our privacy encryption logs. This portal matches secure multi-key tokens to verify authentic human telemetry.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
