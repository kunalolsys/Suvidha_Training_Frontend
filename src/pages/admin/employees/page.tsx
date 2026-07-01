import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/feature/AdminSidebar';
import {
  getAllEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getNextEmployeeId,
  getAllStores,
} from '@/mocks/employeeStore';
import { designations } from '@/mocks/designations';
import type { Employee } from '@/mocks/employees';

export default function AdminEmployeesPage() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>(getAllEmployees());
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formStoreId, setFormStoreId] = useState('');
  const [formStoreName, setFormStoreName] = useState('');
  const [formError, setFormError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState('');
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stores = useMemo(() => getAllStores(), [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (e.role === 'admin') return false;
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase());
      const matchesDesignation = !designationFilter || e.designation === designationFilter;
      const matchesStore = !storeFilter || e.storeId === storeFilter;
      return matchesSearch && matchesDesignation && matchesStore;
    });
  }, [employees, search, designationFilter, storeFilter]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormDesignation(designations[0]);
    setFormStoreId('');
    setFormStoreName('');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingId(employee.id);
    setFormName(employee.name);
    setFormEmail(employee.email);
    setFormDesignation(employee.designation);
    setFormStoreId(employee.storeId);
    setFormStoreName(employee.storeName);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formName.trim() || !formEmail.trim() || !formDesignation || !formStoreId.trim() || !formStoreName.trim()) {
      setFormError('All fields are required, including Store ID and Store Name.');
      return;
    }

    const emailExists = employees.some(
      (e) => e.email.toLowerCase() === formEmail.trim().toLowerCase() && e.id !== editingId,
    );
    if (emailExists) {
      setFormError('An employee with this email already exists.');
      return;
    }

    if (editingId) {
      updateEmployee(editingId, {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        designation: formDesignation as Employee['designation'],
        storeId: formStoreId.trim().toUpperCase(),
        storeName: formStoreName.trim(),
      });
      setFormSuccess('Employee updated successfully.');
    } else {
      const newId = getNextEmployeeId();
      const initials = formName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      addEmployee({
        id: newId,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        designation: formDesignation as Employee['designation'],
        avatar: initials || 'EM',
        role: 'employee',
        storeId: formStoreId.trim().toUpperCase(),
        storeName: formStoreName.trim(),
      });
      setFormSuccess('Employee added successfully.');
    }

    setEmployees(getAllEmployees());
    modalTimerRef.current = setTimeout(() => closeModal(), 800);
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    setEmployees(getAllEmployees());
    setDeleteConfirmId(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background-50 flex">
      <AdminSidebar />

      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-background-50 border-b border-background-200 sticky top-0 z-30">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <i className="ri-graduation-cap-fill text-sm text-background-50"></i>
              </div>
              <span className="font-heading text-base text-foreground-900">STU Admin</span>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 lg:py-8">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-xl md:text-2xl text-foreground-900">Employees</h1>
              <p className="text-sm text-foreground-500 mt-0.5">Manage your workforce and training assignments</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line text-lg"></i>
              Add Employee
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-foreground-400"></i>
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background-50 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="px-3 py-2.5 bg-background-50 border border-background-200 rounded-lg text-sm text-foreground-700 focus:outline-none focus:border-primary-400 cursor-pointer"
            >
              <option value="">All Designations</option>
              {designations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-2.5 bg-background-50 border border-background-200 rounded-lg text-sm text-foreground-700 focus:outline-none focus:border-primary-400 cursor-pointer min-w-[160px]"
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName} ({s.employeeCount})
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background-100 border-b border-background-200">
                    <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Store</th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider">Designation</th>
                    <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-foreground-400">
                        <i className="ri-team-line text-2xl mb-2 block text-foreground-300"></i>
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp) => (
                      <tr key={emp.id} className="hover:bg-background-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                              {getInitials(emp.name)}
                            </div>
                            <span className="text-sm font-medium text-foreground-900">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-600">{emp.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-foreground-400 font-mono">{emp.storeId}</span>
                            <span className="text-sm text-foreground-700">{emp.storeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                            {emp.designation}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-2 text-foreground-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(emp.id)}
                              className="p-2 text-foreground-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background-50 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-background-200 flex items-center justify-between">
              <h3 className="font-medium text-foreground-900 text-sm">
                {editingId ? 'Edit Employee' : 'Add Employee'}
              </h3>
              <button onClick={closeModal} className="p-1 text-foreground-400 hover:text-foreground-700 rounded cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formSuccess && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                  <i className="ri-checkbox-circle-line"></i>
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <i className="ri-error-warning-line"></i>
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Work Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. rahul.verma@suvidha.com"
                  className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Designation</label>
                <select
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
                >
                  {designations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Store ID</label>
                  <input
                    type="text"
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    placeholder="e.g. ST-001"
                    className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Store Name</label>
                  <input
                    type="text"
                    value={formStoreName}
                    onChange={(e) => setFormStoreName(e.target.value)}
                    placeholder="e.g. Suvidha - Hisar"
                    className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-background-200 text-foreground-700 text-sm font-medium rounded-lg hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background-50 rounded-xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <i className="ri-alert-line text-xl"></i>
              </div>
              <h3 className="font-medium text-foreground-900 text-sm">Delete Employee</h3>
            </div>
            <p className="text-sm text-foreground-600 mb-5">
              Are you sure you want to remove this employee? This will also clear their training progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border border-background-200 text-foreground-700 text-sm font-medium rounded-lg hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-background-50 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}