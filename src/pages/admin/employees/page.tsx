import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/feature/AdminSidebar';
import type { Employee } from '@/mocks/employees';
import { api } from '@/api/api';
import { API } from '@/api/endpoints';
import Pagination from '@/common/Pagination';
import { useDebounce } from '@/common/Debounce';
import { message, Select } from 'antd';
import EmployeeImportModal from '@/common/csvUpload';

export default function AdminEmployeesPage() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState([]);
  const [stores, setStores] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
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
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search);
  const [syncResult, setSyncResult] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncEmployees = async () => {
    try {
      setLoading(true);

      const res = await api.post(`${API.USER}/sync-stu-employees`);
      setSyncResult(res);
      setLastSyncTime(new Date());
      setTimeout(() => {
        setSyncResult(null);
      }, 10000);
      await fetchEmployees();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };


  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API.USER}`, {
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        designation: designationFilter,
        store: storeFilter,
      });

      setEmployees(res.data.users);
      setPagination(res.data.pagination);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchDesignations = async () => {
    try {
      const res = await api.get(`${API.DESIGNATION}/all`, {});

      setDesignations(res.data.designations);

    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
    }
  };
  const fetchStores = async () => {
    try {
      // setLoading(true);
      const res = await api.get(`${API.STORE}/all`, {});

      setStores(res.data.stores);

    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false);
    }
  };
  // Cleanup timer on unmount
  useEffect(() => {
    const init = async () => {
      fetchEmployees();
      fetchStores();
      fetchDesignations();
    };

    init();

    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);
  useEffect(() => {
    fetchEmployees();
  }, [page, debouncedSearch, designationFilter, storeFilter]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, designationFilter, storeFilter]);
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormDesignation("");
    setFormStoreId('');
    setFormStoreName('');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingId(employee._id);
    setFormName(employee.name);
    setFormEmail(employee.email);
    setFormDesignation(employee.designation._id);
    setFormStoreId("");
    setFormStoreName(employee.store._id);
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formName.trim() || !formEmail.trim() || !formDesignation || !formStoreName.trim()) {
      setFormError('All fields are required, including Store ID and Store Name.');
      return;
    }

    if (editingId) {
      const res = await api.put(`${API.USER}/${editingId}`, {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        designation: formDesignation,
        store: formStoreName,
      })
      if (res.success) {
        setFormSuccess(res.message || 'Employee updated successfully.');
      } else {
        setFormError(res.message || 'Something went wrong.');
      }
    } else {
      // const newId = getNextEmployeeId();
      // const initials = formName
      //   .trim()
      //   .split(' ')
      //   .map((n) => n[0])
      //   .join('')
      //   .toUpperCase()
      //   .slice(0, 2);
      // addEmployee({
      //   id: newId,
      //   name: formName.trim(),
      //   email: formEmail.trim().toLowerCase(),
      //   designation: formDesignation as Employee['designation'],
      //   avatar: initials || 'EM',
      //   role: 'employee',
      //   storeId: formStoreId.trim().toUpperCase(),
      //   storeName: formStoreName.trim(),
      // });
      // setFormSuccess('Employee added successfully.');
    }
    fetchEmployees()
    modalTimerRef.current = setTimeout(() => closeModal(), 800);
  };

  const handleDelete = async (id: string) => {
    const res = await api.delete(`${API.USER}/${id}`)
    if (res.success) {
      message.success(res.message || "Employee deleted successfully.")
    } else {
      message.error(res.message || "Something went wrong.")
    }
    fetchEmployees()
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

        <div className=" mx-auto px-4 md:px-6 py-6 lg:py-8">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-xl md:text-2xl text-foreground-900">Employees</h1>
              <p className="text-sm text-foreground-500 mt-0.5">Manage your workforce and training assignments</p>
            </div>
            {/* <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line text-lg"></i>
              Add Employee
            </button> */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-background-200 bg-background-50 p-4">

              <div>
                <h3 className="text-sm font-semibold text-foreground-900">
                  Employee Synchronization
                </h3>

                <p className="mt-1 text-xs text-foreground-500">
                  Sync employees from the STU master database.
                </p>
              </div>

              <div className="flex items-center gap-3">

                {lastSyncTime && (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>

                    <div className="text-xs">
                      <p className="font-medium text-emerald-700">
                        Last Sync
                      </p>

                      <p className="text-emerald-600">
                        {lastSyncTime.toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* <button
                  onClick={syncEmployees}
                  disabled={loading}
                  className={`group inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-300
    ${loading
                      ? "cursor-not-allowed bg-slate-300 text-white"
                      : "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow hover:shadow-md hover:-translate-y-0.5"
                    }`}
                >
                  <i
                    className={`text-base ${loading
                        ? "ri-loader-4-line animate-spin"
                        : "ri-refresh-line transition-transform duration-500 group-hover:rotate-180"
                      }`}
                  />

                  <span>{loading ? "Syncing..." : "Sync"}</span>
                </button> */}

                <EmployeeImportModal />

              </div>
            </div>
          </div>
          {syncResult && !loading && (
            <div className="mb-6 rounded-xl border border-green-200 bg-white shadow-sm">
              <div className="border-b border-green-100 bg-green-50 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <i className="ri-checkbox-circle-fill text-xl text-green-600"></i>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Employee Synchronization Completed
                      </h3>

                      <p className="text-sm text-gray-500">
                        {syncResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary-50 px-4 py-2 text-center">
                    <div className="text-xl font-bold text-primary-600">
                      {syncResult.totalFromSTU}
                    </div>
                    <div className="text-xs text-gray-500">
                      STU Employees
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-5">

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {syncResult.created}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Created
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncResult.updated}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Updated
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-amber-600">
                    {syncResult.skipped}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Duplicates & Skipped
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-emerald-600">
                    {syncResult.activated}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Activated
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {syncResult.deactivated}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Deactivated
                  </div>
                </div>

              </div>
            </div>
          )}
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
            <Select
              value={designationFilter || undefined}
              placeholder="All Designations"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(value) => setDesignationFilter(value || "")}
              className="w-64"
              options={[
                {
                  label: "All Designations",
                  value: "",
                },
                ...designations.map((d) => ({
                  label: d.name,
                  value: d._id,
                })),
              ]}
            />
            <Select
              showSearch
              allowClear
              size="large"
              placeholder="All Stores"
              value={storeFilter || undefined}
              onChange={(value) => setStoreFilter(value || "")}
              options={stores.map((s) => ({
                label: s.name,
                value: s._id,
              }))}
              optionFilterProp="label"
              className="min-w-[220px] w-full sm:w-auto"
            />
          </div>

          {/* Table */}
          <div className="bg-background-50 border border-background-200 rounded-xl flex flex-col h-[700px]">
            {/* Scrollable Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-background-100 z-10">
                  <tr className="border-b border-background-200">
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Employee Code</th>
                    {/* <th className="px-4 py-3">Email</th> */}
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-background-100">
                  {/* 1. Loading State */}
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="h-[450px] text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <i className="ri-loader-4-line text-2xl text-primary-500 animate-spin"></i>
                          <span className="text-sm text-foreground-500 font-medium">Loading employees...</span>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    /* 2. Empty State */
                    <tr>
                      <td
                        colSpan={5}
                        className="h-[450px] text-center text-sm text-foreground-400"
                      >
                        <i className="ri-team-line text-2xl mb-2 block text-foreground-300"></i>
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    /* 3. Employees Mapping */
                    employees.map((emp) => (
                      <tr
                        key={emp.employeeId || emp._id}
                        className="hover:bg-background-50/70 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                              {getInitials(emp.name)}
                            </div>
                            <span className="text-sm font-medium text-foreground-900">
                              {emp.name || ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-600">
                          {emp.employeeId || ""}
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground-700">
                            {emp.store?.name || ""}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                            {emp.designation?.name || ""}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-2 text-foreground-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Always Visible Pagination */}
            <div className="border-background-200 bg-background-50 px-6 py-4 shrink-0">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
              />
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
                    <option key={d._id} value={d._id}>
                      {d.name}
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
                  <select
                    value={formStoreName}
                    onChange={(e) => setFormStoreName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background-100 border border-background-200 rounded-lg text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
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