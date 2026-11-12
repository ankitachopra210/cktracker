import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  MessageSquare,
  Layers,
  ChevronRight,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import { getProjectDesigns, uploadDesign, submitDesignDecision } from '../../services/design.api';
import { getProjects } from '../../services/project.api';
import { useAuth } from '../../contexts/AuthContext';

const DesignManagementPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [designs, setDesigns] = useState([]);
  const [activeDesign, setActiveDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [customerComments, setCustomerComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    materialsDescription: '',
    finishes: '',
    layout2DUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    render3DUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  });

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const res = await getProjects({ limit: 50 });
        if (res.success && res.data.length > 0) {
          setProjects(res.data);
          setSelectedProjectId(res.data[0].id);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Load designs when project changes
  useEffect(() => {
    if (!selectedProjectId) return;

    const loadDesigns = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await getProjectDesigns(selectedProjectId);
        if (res.success) {
          setDesigns(res.data);
          setActiveDesign(res.data[0] || null);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to fetch designs');
      } finally {
        setLoading(false);
      }
    };

    loadDesigns();
  }, [selectedProjectId]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await uploadDesign(selectedProjectId, uploadForm);
      if (res.success) {
        setSuccessMsg(`Design Version ${res.data.versionNumber} uploaded! Customer notified.`);
        setIsUploadModalOpen(false);
        setUploadForm({
          title: '',
          description: '',
          materialsDescription: '',
          finishes: '',
          layout2DUrl: '',
          render3DUrl: '',
        });
        const refetch = await getProjectDesigns(selectedProjectId);
        if (refetch.success) {
          setDesigns(refetch.data);
          setActiveDesign(refetch.data[0]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload design');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!activeDesign) return;
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await submitDesignDecision(activeDesign.id, {
        decision: decisionType,
        customerComments,
      });
      if (res.success) {
        setSuccessMsg(`Design ${decisionType === 'APPROVED' ? 'approved! Stage 4 completed.' : 'revision requested.'}`);
        setIsDecisionModalOpen(false);
        setCustomerComments('');
        const refetch = await getProjectDesigns(selectedProjectId);
        if (refetch.success) {
          setDesigns(refetch.data);
          setActiveDesign(refetch.data.find((d) => d.id === activeDesign.id) || refetch.data[0]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Design & 3D Visualization</h1>
          <p className="text-sm text-slate-500 mt-1">
            2D CAD layouts, photorealistic 3D renders, material specs, and customer digital approvals.
          </p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <button
            onClick={() => {
              setErrorMsg('');
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            Upload New Design Version
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Project Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none w-full sm:w-auto"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.title} ({p.customer?.user?.fullName})
              </option>
            ))}
          </select>
        </div>

        {/* Version Switcher Pills */}
        {designs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Versions:</span>
            {designs.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDesign(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  activeDesign?.id === d.id
                    ? 'bg-gold-500 text-navy-950 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                V{d.versionNumber} ({d.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
          <p className="text-xs">Loading renders and design specifications...</p>
        </div>
      ) : !activeDesign ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <Compass className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-600">No design iterations uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1">Upload 2D layouts and 3D renders to begin the customer approval process.</p>
        </div>
      ) : (
        /* Active Design Display */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 3D Render & 2D Layout View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2.5 py-0.5 rounded border border-gold-200">
                      Version {activeDesign.versionNumber}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{activeDesign.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uploaded on {new Date(activeDesign.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    activeDesign.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeDesign.status === 'CHANGES_REQUESTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeDesign.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* 3D Visual Render */}
              <div className="aspect-video bg-slate-900 relative group overflow-hidden">
                {activeDesign.render3DUrl ? (
                  <img
                    src={activeDesign.render3DUrl}
                    alt="3D Kitchen Render"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    No 3D render image uploaded
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-400" /> Photorealistic 3D Model
                </div>
              </div>

              {/* 2D Layout Preview if present */}
              {activeDesign.layout2DUrl && (
                <div className="p-5 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2D Technical Layout & Dimensions
                  </span>
                  <div className="aspect-[21/9] rounded-2xl bg-slate-100 overflow-hidden relative">
                    <img
                      src={activeDesign.layout2DUrl}
                      alt="2D Layout"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Specifications & Customer Sign-off Panel */}
          <div className="space-y-6">
            {/* Customer Sign-off Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-gold-600" />
                Customer Review & Approval
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Review the finishes and layout. Approving this version locks the 3D aesthetic and advances the project to the quotation stage.
              </p>

              {activeDesign.status === 'UNDER_REVIEW' ? (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setDecisionType('APPROVED');
                      setIsDecisionModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve 3D Kitchen Design
                  </button>

                  <button
                    onClick={() => {
                      setDecisionType('CHANGES_REQUESTED');
                      setIsDecisionModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Request Modifications
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700">Decision Recorded:</span>
                  <p className="text-slate-600 font-bold">{activeDesign.status.replace(/_/g, ' ')}</p>
                </div>
              )}

              {/* Feedback History */}
              {activeDesign.approvals && activeDesign.approvals.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Decision Log & Client Comments
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {activeDesign.approvals.map((app) => (
                      <div key={app.id} className="p-2.5 rounded-xl bg-slate-50 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className={app.decision === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}>
                            {app.decision}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(app.decidedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {app.customerComments && (
                          <p className="text-slate-600 italic">"{app.customerComments}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Specifications Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Materials & Finishes Specification</h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block font-medium">Cabinet Finishes</span>
                  <span className="font-semibold text-slate-800">
                    {activeDesign.finishes || 'High-Gloss Acrylic pure white shutters with dark oak veneer'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block font-medium">Hardware & Carcass Core</span>
                  <span className="font-semibold text-slate-800">
                    {activeDesign.materialsDescription || 'Century Marine BWP 18mm with Blum soft-close channels'}
                  </span>
                </div>

                {activeDesign.description && (
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block font-medium">Architectural Notes</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{activeDesign.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Design Iteration */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative my-8">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Upload New Kitchen Design Iteration</h2>
            <p className="text-xs text-slate-500 mb-5">
              Publish updated 3D photorealistic visualization and technical specifications for customer review.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Design Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 3D Render V2 - Pure White Acrylic & Island"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">3D Render Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={uploadForm.render3DUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, render3DUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">2D Technical Layout URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={uploadForm.layout2DUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, layout2DUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Materials Specification</label>
                <input
                  type="text"
                  placeholder="e.g., Century Club Prime 18mm, Rehau High-Gloss Acrylic"
                  value={uploadForm.materialsDescription}
                  onChange={(e) => setUploadForm({ ...uploadForm, materialsDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Finishes & Handles</label>
                <input
                  type="text"
                  placeholder="e.g., J-Profile Gola Matte Black, Soft-close hinges"
                  value={uploadForm.finishes}
                  onChange={(e) => setUploadForm({ ...uploadForm, finishes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Modifications Made</label>
                <textarea
                  rows="2"
                  placeholder="Adjusted breakfast counter overhang, added built-in microwave cavity..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Decision */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsDecisionModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {decisionType === 'APPROVED' ? 'Confirm 3D Design Approval' : 'Submit Modification Request'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {decisionType === 'APPROVED'
                ? 'Your sign-off will lock this design layout and advance the project to Quotation Preparation.'
                : 'Describe the design changes, colors, or cabinet repositioning you would like our architects to modify.'}
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Comments & Feedback {decisionType === 'CHANGES_REQUESTED' && '*'}
                </label>
                <textarea
                  required={decisionType === 'CHANGES_REQUESTED'}
                  rows="3"
                  placeholder={
                    decisionType === 'APPROVED'
                      ? 'e.g. Looks fantastic! Proceed with quotation.'
                      : 'e.g. Can we change the upper cabinets from white to dark grey matte finish?'
                  }
                  value={customerComments}
                  onChange={(e) => setCustomerComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl text-white font-semibold disabled:opacity-50 cursor-pointer ${
                    decisionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-navy-900 hover:bg-navy-800'
                  }`}
                >
                  {isSubmitting ? 'Recording...' : decisionType === 'APPROVED' ? 'Confirm Approval' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignManagementPage;
