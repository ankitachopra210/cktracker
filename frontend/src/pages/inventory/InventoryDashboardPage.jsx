import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Truck,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  X,
  PackageCheck,
  Building,
} from 'lucide-react';
import {
  getInventory,
  createInventoryItem,
  allocateStock,
  getSuppliers,
  createSupplier,
  createPurchaseOrder,
} from '../../services/inventory.api';
import { getProjects } from '../../services/project.api';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
  { value: '', label: 'All Raw Materials' },
  { value: 'BASE_CABINETS', label: 'Plywood & Carcasses' },
  { value: 'LAMINATES', label: 'Laminates & Veneers' },
  { value: 'ACRYLIC_FINISHES', label: 'Acrylic Sheets' },
  { value: 'HINGES', label: 'Hinges & Hardware' },
  { value: 'DRAWER_CHANNELS', label: 'Tandem Drawers' },
  { value: 'HANDLES', label: 'Gola Profiles & Handles' },
  { value: 'COUNTERTOPS', label: 'Quartz & Countertops' },
  { value: 'KITCHEN_ACCESSORIES', label: 'Pantries & Corner Units' },
];

const InventoryDashboardPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'suppliers'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for allocation
  const [projectsList, setProjectsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);

  // Forms
  const [itemForm, setItemForm] = useState({
    itemCode: '',
    name: '',
    category: 'BASE_CABINETS',
    unit: 'Sheets',
    currentStock: '50',
    minimumStockLevel: '15',
    unitCost: '3200',
    location: 'Warehouse Rack B-4',
    description: '',
  });

  const [allocateForm, setAllocateForm] = useState({
    projectId: '',
    quantity: '5',
    referenceNote: 'Allocated for carcass production',
  });

  const [supplierForm, setSupplierForm] = useState({
    supplierCode: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    materialCategories: 'Plywood, Hardware',
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getInventory({
        category: categoryFilter,
        lowStockOnly,
        search,
      });
      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      if (res.success) {
        setSuppliersList(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, lowStockOnly]);

  useEffect(() => {
    if (activeTab === 'suppliers') {
      fetchSuppliers();
    }
  }, [activeTab]);

  const handleOpenAllocate = async (item) => {
    setSelectedItem(item);
    setErrorMsg('');
    try {
      const res = await getProjects({ limit: 50 });
      if (res.success && res.data.length > 0) {
        setProjectsList(res.data);
        setAllocateForm({
          projectId: res.data[0].id,
          quantity: '1',
          referenceNote: `Allocated for project ${res.data[0].projectCode}`,
        });
        setIsAllocateModalOpen(true);
      } else {
        setErrorMsg('No active projects available to allocate materials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load projects');
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (parseFloat(allocateForm.quantity) > Number(selectedItem.currentStock)) {
      setErrorMsg(
        `Allocation exceeds available stock! Available: ${selectedItem.currentStock} ${selectedItem.unit}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await allocateStock(selectedItem.id, allocateForm);
      if (res.success) {
        setSuccessMsg(
          `Allocated ${allocateForm.quantity} ${selectedItem.unit} of ${selectedItem.name} to project!`
        );
        setIsAllocateModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to allocate material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createInventoryItem(itemForm);
      if (res.success) {
        setSuccessMsg(`Material ${itemForm.name} added to warehouse inventory!`);
        setIsAddModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await createSupplier(supplierForm);
      if (res.success) {
        setSuccessMsg(`Supplier ${supplierForm.companyName} registered!`);
        setIsSupplierModalOpen(false);
        fetchSuppliers();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Raw Materials & Procurement</h1>
          <p className="text-sm text-slate-500 mt-1">
            Warehouse inventory levels, low-stock warnings, zero-negative project stock allocations, and supplier purchase orders.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMsg('');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              Add Material
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                setIsSupplierModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-slate-600" />
              Add Supplier
            </button>
          </div>
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

      {/* Low stock warning banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Low Stock Warning:</strong> {lowStockCount} raw material items have reached or breached their reorder threshold level.
            </span>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
          >
            {lowStockOnly ? 'View All Items' : 'Filter Low Stock Items'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'inventory'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Warehouse Stock Catalog ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 transition-colors ${
            activeTab === 'suppliers'
              ? 'text-navy-900 border-b-2 border-gold-500 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Authorized Suppliers & Distributors
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                placeholder="Search materials, codes, bins..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-2" />
                <p className="text-xs">Loading warehouse materials...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No raw materials found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Item Code & Name</th>
                      <th className="py-3 px-6">Category</th>
                      <th className="py-3 px-6 text-center">Available Stock</th>
                      <th className="py-3 px-6 text-center">Reorder Threshold</th>
                      <th className="py-3 px-6 text-right">Unit Cost</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-fit mb-1">
                            {item.itemCode}
                          </span>
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          {item.location && <span className="text-[10px] text-slate-400">Bin: {item.location}</span>}
                        </td>

                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {item.category.replace(/_/g, ' ')}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              item.isLowStock
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {Number(item.currentStock)} {item.unit}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center text-slate-500 font-medium">
                          {Number(item.minimumStockLevel)} {item.unit}
                        </td>

                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                          {formatCurrency(item.unitCost)}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenAllocate(item)}
                            className="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs flex items-center gap-1.5 ml-auto shadow-sm transition-colors cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-gold-400" />
                            Allocate to Project
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Suppliers Tab */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Registered Suppliers & Hardware Depots</h2>
            <span className="text-xs text-slate-400 font-medium">{suppliersList.length} suppliers</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {suppliersList.map((sup) => (
              <div key={sup.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                      {sup.supplierCode}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{sup.companyName}</h3>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Contact: {sup.contactPerson || 'Sales Dept'} • Phone: {sup.phone} • GSTIN: {sup.gstin || 'N/A'}
                  </p>
                  <p className="text-slate-600 text-[11px]">{sup.materialCategories}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {sup._count?.purchaseOrders || 0} Purchase Orders
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Allocate Stock to Project */}
      {isAllocateModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsAllocateModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Allocate Material to Kitchen Project</h2>
            <p className="text-xs text-slate-500 mb-4">
              Material: <strong className="text-slate-800">{selectedItem.name}</strong> ({selectedItem.itemCode})
              <br />
              Current Available Stock: <strong className="text-emerald-700">{selectedItem.currentStock} {selectedItem.unit}</strong>
            </p>

            <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Target Project *</label>
                <select
                  required
                  value={allocateForm.projectId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, projectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} — {p.title} ({p.customer?.user?.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity to Allocate ({selectedItem.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={Number(selectedItem.currentStock)}
                  value={allocateForm.quantity}
                  onChange={(e) => setAllocateForm({ ...allocateForm, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Production Allocation Note</label>
                <textarea
                  rows="2"
                  value={allocateForm.referenceNote}
                  onChange={(e) => setAllocateForm({ ...allocateForm, referenceNote: e.target.value })}
                  placeholder="e.g. Base carcass panels cutting in CNC division..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Allocating...' : 'Confirm Stock Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Material */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative my-8">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Add Warehouse Raw Material</h2>
            <p className="text-xs text-slate-500 mb-5">Define item category, unit of measure, reorder threshold, and unit cost.</p>

            <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PLY-BWP-19"
                    value={itemForm.itemCode}
                    onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="BASE_CABINETS">Plywood & Board</option>
                    <option value="LAMINATES">Laminates</option>
                    <option value="ACRYLIC_FINISHES">Acrylic Finishes</option>
                    <option value="HINGES">Hinges</option>
                    <option value="DRAWER_CHANNELS">Drawer Channels</option>
                    <option value="COUNTERTOPS">Countertops</option>
                    <option value="KITCHEN_ACCESSORIES">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Century Marine 710 Plywood 18mm"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 bg-white"
                  >
                    <option value="Sheets">Sheets</option>
                    <option value="SqFt">SqFt</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Sets">Sets</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.currentStock}
                    onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.minimumStockLevel}
                    onChange={(e) => setItemForm({ ...itemForm, minimumStockLevel: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 3400"
                    value={itemForm.unitCost}
                    onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack / Bin Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-12"
                    value={itemForm.location}
                    onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add Material to Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setIsSupplierModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Register Supplier / Vendor</h2>
            <p className="text-xs text-slate-500 mb-4">Add hardware distributor or plywood depot details.</p>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SUP-003"
                    value={supplierForm.supplierCode}
                    onChange={(e) => setSupplierForm({ ...supplierForm, supplierCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9888800000"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blum Official Hardware Distributor"
                  value={supplierForm.companyName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Categories</label>
                <input
                  type="text"
                  placeholder="Hinges, Tandem Drawers, Hardware"
                  value={supplierForm.materialCategories}
                  onChange={(e) => setSupplierForm({ ...supplierForm, materialCategories: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboardPage;
