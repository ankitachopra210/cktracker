import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  ArrowLeft,
  Loader2,
  X,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Camera,
} from 'lucide-react';
import { getProjectById, updateProjectStage, uploadStagePhoto } from '../../services/project.api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [selectedStage, setSelectedStage] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [stageForm, setStageForm] = useState({
    status: 'COMPLETED',
    remarks: '',
    delayReason: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoCategory, setPhotoCategory] = useState('PROGRESS_PHOTO');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await getProjectById(id);
      if (res.success) {
        setProject(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject();
      joinProject(id);
    }

    return () => {
      if (id) leaveProject(id);
    };
  }, [id]);

  // Real-time live listener
  useEffect(() => {
    if (!socket) return;

    const handleStageUpdate = (data) => {
      if (data.projectId === id) {
        fetchProject();
        setSuccessMsg(`Stage ${data.stageNumber} updated in real-time!`);
      }
    };

    socket.on('stage:updated', handleStageUpdate);
    socket.on('stage:photo_uploaded', fetchProject);

    return () => {
      socket.off('stage:updated', handleStageUpdate);
      socket.off('stage:photo_uploaded', fetchProject);
    };
  }, [socket, id]);

  const handleOpenUpdateModal = (stage) => {
    setSelectedStage(stage);
    setStageForm({
      status: stage.status === 'PENDING' ? 'IN_PROGRESS' : stage.status === 'IN_PROGRESS' ? 'COMPLETED' : stage.status,
      remarks: stage.remarks || '',
      delayReason: stage.delayReason || '',
    });
    setErrorMsg('');
    setIsUpdateModalOpen(true);
  };

  const handleOpenPhotoModal = (stage) => {
    setSelectedStage(stage);
    setPhotoFile(null);
    setErrorMsg('');
    setIsPhotoModalOpen(true);
  };

  const handleUpdateStageSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStage) return;

    if (stageForm.status === 'DELAYED' && !stageForm.delayReason) {
      setErrorMsg('A delay reason is required when marking a stage as DELAYED.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await updateProjectStage(id, selectedStage.id, stageForm);
      if (res.success) {
        setSuccessMsg(`Stage ${selectedStage.stageNumber} updated to ${stageForm.status}!`);
        setIsUpdateModalOpen(false);
        fetchProject();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile || !selectedStage) {
      setErrorMsg('Please select a photo or file.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('category', photoCategory);

      const res = await uploadStagePhoto(id, selectedStage.id, formData);
      if (res.success) {
        setSuccessMsg('Photograph uploaded successfully!');
        setIsPhotoModalOpen(false);
        fetchProject();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStageBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
      case 'DELAYED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ON_HOLD':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
        <p className="text-xs">Loading kitchen lifecycle & 14 stages...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-sm font-semibold">Project not found.</p>
        <Link to="/admin/projects" className="text-xs text-gold-600 mt-2 inline-block">
          &larr; Back to Projects
        </Link>
      </div>
    );
  }

  const completedCount = project.stages?.filter((s) => s.status === 'COMPLETED').length || 0;
  const overallPercentage = Math.round((completedCount / 14) * 100);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={user?.role === 'CUSTOMER' ? '/customer' : user?.role === 'MANAGER' ? '/manager/projects' : '/admin/projects'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">
                {project.projectCode}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-100 text-navy-800">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
            <p className="text-xs text-slate-500">
              Kitchen Type: <strong className="text-slate-700">{project.kitchenType}</strong> • Client:{' '}
              <strong className="text-slate-700">{project.customer?.user?.fullName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right min-w-[140px]">
              <span className="text-[11px] text-slate-400 block font-medium">Contract Value</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(project.budget)}</span>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">14-Stage Lifecycle Progress ({completedCount} of 14 Completed)</span>
            <span className="text-gold-600 font-bold">{overallPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-navy-900 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 14-Stage Sequential Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">14-Stage Manufacturing & Delivery Workflow</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict sequential progression guarantees zero quality skips between measurement, factory CNC, and final handover.
            </p>
          </div>
        </div>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
          {project.stages?.map((stage, idx) => {
            const isCompleted = stage.status === 'COMPLETED';
            const isCurrent = stage.status === 'IN_PROGRESS';
            const isDelayed = stage.status === 'DELAYED';

            return (
              <div key={stage.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-gold-500 border-gold-600 text-navy-950 ring-4 ring-gold-200/50'
                      : isDelayed
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stage.stageNumber}
                </div>

                {/* Stage card */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-white border-gold-300 shadow-md ring-1 ring-gold-400/30'
                      : isCompleted
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-white border-slate-100 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{stage.stageNumber}</span>
                      <h3 className="font-bold text-sm text-slate-900">{stage.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStageBadge(stage.status)}`}>
                        {stage.status}
                      </span>

                      {/* Authorized update button */}
                      {user?.role !== 'CUSTOMER' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenUpdateModal(stage)}
                            className="px-2.5 py-1 rounded-lg bg-navy-900 text-white text-[11px] font-semibold hover:bg-navy-800 transition-colors cursor-pointer"
                          >
                            Update Status
                          </button>
                          <button
                            onClick={() => handleOpenPhotoModal(stage)}
                            className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Upload Site Progress Photograph"
                          >
                            <Camera className="w-4 h-4 text-slate-700" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{stage.description}</p>

                  {/* Stage metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Assigned Lead</span>
                      <span className="font-semibold text-slate-700">
                        {stage.assignedEmployee?.user?.fullName || 'Assigned to Project Lead'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Target Duration</span>
                      <span className="font-semibold text-slate-700">{stage.expectedDurationDays} Business Days</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Execution Date</span>
                      <span className="font-semibold text-slate-700">
                        {stage.completionDate
                          ? `Completed: ${new Date(stage.completionDate).toLocaleDateString()}`
                          : stage.startDate
                          ? `Started: ${new Date(stage.startDate).toLocaleDateString()}`
                          : 'Pending start'}
                      </span>
                    </div>
                  </div>

                  {/* Remarks & Delay Reason callouts */}
                  {stage.delayReason && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <strong className="block">Delay Reason:</strong>
                        <span>{stage.delayReason}</span>
                      </div>
                    </div>
                  )}

                  {stage.remarks && (
                    <div className="mt-2 text-xs text-slate-600 italic">
                      Remarks: "{stage.remarks}"
                    </div>
                  )}

                  {/* Uploaded Stage Photos / Attachments */}
                  {stage.fileAttachments && stage.fileAttachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Stage Photographs & Attachments ({stage.fileAttachments.length})
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {stage.fileAttachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-gold-400 text-slate-700 text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-navy-600" />
                            <span className="truncate max-w-[160px]">{att.originalName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Update Stage Status */}
      {isUpdateModalOpen && selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsUpdateModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Update Stage {selectedStage.stageNumber}: {selectedStage.name}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Change stage progression status. Completing this stage will automatically activate the next sequential stage.
            </p>

            <form onSubmit={handleUpdateStageSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stage Status *</label>
                <select
                  value={stageForm.status}
                  onChange={(e) => setStageForm({ ...stageForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              {stageForm.status === 'DELAYED' && (
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Delay Reason (Mandatory) *</label>
                  <textarea
                    required
                    rows="2"
                    placeholder="e.g. Raw material delivery deferred by supplier / Site tile work incomplete..."
                    value={stageForm.delayReason}
                    onChange={(e) => setStageForm({ ...stageForm, delayReason: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50 bg-rose-50/30"
                  ></textarea>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks & Technical Inspection Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g., Carcass cut accuracy verified, CNC edge-banding PUR test passed..."
                  value={stageForm.remarks}
                  onChange={(e) => setStageForm({ ...stageForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Save Stage Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Stage Photo */}
      {isPhotoModalOpen && selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Upload Stage Photograph</h2>
            <p className="text-xs text-slate-500 mb-5">
              Upload quality audit photos or site progress pictures for Stage {selectedStage.stageNumber}.
            </p>

            <form onSubmit={handleUploadPhotoSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attachment Category</label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  <option value="PROGRESS_PHOTO">Progress Photograph</option>
                  <option value="MEASUREMENT_DOC">Site Survey / Measurement Document</option>
                  <option value="QC_REPORT">Quality Inspection Report</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select File (Image or PDF) *</label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
