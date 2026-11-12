import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { getCustomers, createCustomer } from '../../services/customer.api';

const CustomerListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: 'Bangalore',
    propertyType: 'Apartment',
    kitchenDimensions: '',
    estimatedBudget: '',
    preferredStyle: 'Modern Minimalist',
    preferredMaterials: 'BWP Marine Ply with High-Gloss Acrylic',
    leadSource: 'Showroom Walk-in',
    requirementsNotes: '',
  });

  const fetchCustomersList = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getCustomers({ page, limit: 10, search, propertyType });
      if (res.success) {
        setCustomers(res.data);
        setTotal(res.pagination?.total || res.data.length);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('register') === '1') {
      setErrorMsg('');
      setSuccessMsg('');
      setIsModalOpen(true);

      setSearchParams((params) => {
        params.delete('register');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    fetchCustomersList();
  }, [page, propertyType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomersList();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createCustomer(formData);
      if (res.success) {
        setSuccessMsg(`Customer ${formData.fullName} registered successfully!`);
        setIsModalOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          address: '',
          city: 'Bangalore',
          propertyType: 'Apartment',
          kitchenDimensions: '',
          estimatedBudget: '',
          preferredStyle: 'Modern Minimalist',
          preferredMaterials: 'BWP Marine Ply with High-Gloss Acrylic',
          leadSource: 'Showroom Walk-in',
          requirementsNotes: '',
        });
        fetchCustomersList();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register customer');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer CRM</h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized directory of all registered modular kitchen clients, requirements, and active projects.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          Register New Customer
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 text-slate-800"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Property:</span>
          </div>
          <select
            value={propertyType}
            onChange={(e) => {
              setPropertyType(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-slate-700"
          >
            <option value="">All Property Types</option>
            <option value="Apartment">Apartment</option>
            <option value="Luxury Villa">Luxury Villa</option>
            <option value="Independent House">Independent House</option>
            <option value="Penthouse">Penthouse</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
            <p className="text-xs">Loading customer records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No customers found</p>
            <p className="text-xs mt-1">Try adjusting your search criteria or register a new client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Property & Location</th>
                  <th className="py-3.5 px-6">Kitchen Preferences</th>
                  <th className="py-3.5 px-6">Budget</th>
                  <th className="py-3.5 px-6">Active Projects</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <Link to={`/admin/customers/${c.id}`} className="font-bold text-slate-900 hover:text-gold-600 transition-colors">
                          {c.user?.fullName}
                        </Link>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {c.user?.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" /> {c.user?.phoneNumber || '—'}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 mb-1">
                        {c.propertyType || 'Residential'}
                      </span>
                      <p className="truncate max-w-xs text-slate-500 text-[11px]">
                        {c.address ? `${c.address}, ${c.city || ''}` : 'Address not specified'}
                      </p>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-medium text-slate-800">{c.preferredStyle || 'Not specified'}</p>
                      <p className="text-[11px] text-slate-400">{c.kitchenDimensions || 'Dimensions pending'}</p>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {formatCurrency(c.estimatedBudget)}
                    </td>

                    <td className="py-4 px-6">
                      {c.projects && c.projects.length > 0 ? (
                        <div className="space-y-1">
                          {c.projects.map((proj) => (
                            <span
                              key={proj.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-navy-50 text-navy-800 border border-navy-200"
                            >
                              <Briefcase className="w-3 h-3 text-navy-600" />
                              {proj.projectCode} (Stage {proj.currentStageNumber})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No active project</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                      >
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register New Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Register New Customer</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter client contact and kitchen preferences. An account will be initialized and login details emailed.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="e.g., Rohit & Ananya Sen"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="client@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleFormChange}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Property Type</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Luxury Villa">Luxury Villa</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Builder Floor">Builder Floor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Site Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Apartment #, Tower, Society Name, Street"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kitchen Dimensions (if measured)</label>
                  <input
                    type="text"
                    name="kitchenDimensions"
                    value={formData.kitchenDimensions}
                    onChange={handleFormChange}
                    placeholder="e.g. 14ft x 10ft L-shaped"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    name="estimatedBudget"
                    value={formData.estimatedBudget}
                    onChange={handleFormChange}
                    placeholder="e.g. 650000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Style</label>
                  <select
                    name="preferredStyle"
                    value={formData.preferredStyle}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Scandinavian">Scandinavian</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Handleless Gola Profile">Handleless Gola Profile</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Showroom Walk-in">Showroom Walk-in</option>
                    <option value="Architect Referral">Architect Referral</option>
                    <option value="Website Form">Website Form</option>
                    <option value="Social Media / Instagram">Social Media / Instagram</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Requirements & Notes</label>
                <textarea
                  name="requirementsNotes"
                  rows="3"
                  value={formData.requirementsNotes}
                  onChange={handleFormChange}
                  placeholder="Specific appliances (hob/chimney), corner carousel, Blum drawer preferences..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      <span>Saving Customer...</span>
                    </>
                  ) : (
                    <span>Register Customer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;
