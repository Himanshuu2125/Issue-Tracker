"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Sun, Moon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, PanelRightClose } from 'lucide-react';

type Issue = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
};

type SortState = {
  column: keyof Issue | 'priority';
  direction: 'asc' | 'desc';
};

const STATUSES = ['Open', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const ASSIGNEES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];

const API_BASE = 'http://127.0.0.1:8000'; // change if backend at different host

type ModalProps = {
  title: string;
  children: React.ReactNode;
  show: boolean;
  onClose: () => void;
  isDarkMode: boolean;
};

const Modal = ({ title, children, show, onClose, isDarkMode }: ModalProps) => {
  if (!show) return null;
  return createPortal(
    <div className={`fixed inset-0 z-50 overflow-y-auto h-full w-full flex items-center justify-center transition-opacity duration-300 ${isDarkMode ? 'bg-black bg-opacity-75' : 'bg-gray-600 bg-opacity-50'}`}>
      <div className={`relative p-5 border w-full max-w-lg shadow-lg rounded-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className={`flex justify-between items-center pb-3 border-b ${isDarkMode ? 'border-gray-700' : ''}`}>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
          <button onClick={onClose} className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'dark:hover:text-gray-300' : ''}`}>
            <X size={24} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

type DrawerProps = {
  title: string;
  children: React.ReactNode;
  show: boolean;
  onClose: () => void;
  isDarkMode: boolean;
};

const Drawer = ({ title, children, show, onClose, isDarkMode }: DrawerProps) => {
  return createPortal(
    <div className={`fixed inset-0 z-40 transition-transform duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className={`absolute inset-0`} onClick={onClose}></div>
      <div className={`absolute right-0 top-0 w-full md:w-1/2 lg:w-1/3 h-full shadow-xl transition-transform duration-300 transform translate-x-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : ''}`}>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
          <button onClick={onClose} className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'dark:hover:text-gray-300' : ''}`}>
            <PanelRightClose size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-72px)]">{children}</div>
      </div>
    </div>,
    document.body
  );
};

type StatusBadgeProps = {
  status: string;
  isDarkMode: boolean;
};

const StatusBadge = ({ status, isDarkMode }: StatusBadgeProps) => {
  const colors: Record<string, string> = {
    Open: `bg-blue-100 text-blue-800 ${isDarkMode ? 'dark:bg-blue-900/50 dark:text-blue-300' : ''}`,
    'In Progress': `bg-yellow-100 text-yellow-800 ${isDarkMode ? 'dark:bg-yellow-900/50 dark:text-yellow-300' : ''}`,
    Done: `bg-green-100 text-green-800 ${isDarkMode ? 'dark:bg-green-900/50 dark:text-green-300' : ''}`,
  };
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || `bg-gray-100 text-gray-800 ${isDarkMode ? 'dark:text-gray-200 dark:bg-gray-900' : ''}`}`}>{status}</span>;
};

type PriorityIconProps = {
  priority: string;
  isDarkMode: boolean;
};

const PriorityIcon = ({ priority, isDarkMode }: PriorityIconProps) => {
  const icons: Record<string, React.ReactNode> = {
    Low: <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />,
    Medium: <span className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`}>–</span>,
    High: <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />,
  };
  return (
    <div className="flex items-center gap-2">
      {icons[priority]}
      <span>{priority}</span>
    </div>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type JsonViewerProps = {
  data: Record<string, unknown> | Array<unknown>;
  isDarkMode: boolean;
};

const JsonViewer = ({ data, isDarkMode }: JsonViewerProps) => {
  return (
    <pre className={`p-6 rounded-lg overflow-x-auto font-mono text-sm ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [sort, setSort] = useState<SortState>({ column: 'updatedAt', direction: 'desc' });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const fetchIssues = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (assigneeFilter !== 'all') params.set('assignee', assigneeFilter);
    params.set('sort_by', sort.column);
    params.set('sort_dir', sort.direction);
    params.set('page', String(currentPage));
    params.set('page_size', String(pageSize));

    try {
      const res = await fetch(`${API_BASE}/issues?${params.toString()}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      // backend returns { items, total }
      setIssues(json.items || []);
      setTotal(json.total ?? (json.items ? json.items.length : 0));
    } catch (err) {
      console.error('Failed to fetch issues', err);
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, sort, currentPage]);

  const openCreateModal = () => {
    setCurrentIssue(null);
    setIsModalOpen(true);
  };

  const openEditModal = (issue: Issue) => {
    setCurrentIssue(issue);
    setIsModalOpen(true);
  };

  const openDetailDrawer = (issue: Issue) => {
    setCurrentIssue(issue);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      status: fd.get('status') as string,
      priority: fd.get('priority') as string,
      assignee: fd.get('assignee') as string,
    };

    try {
      if (currentIssue) {
        // update
        const res = await fetch(`${API_BASE}/issues/${currentIssue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      } else {
        // create
        const res = await fetch(`${API_BASE}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      }
      setIsModalOpen(false);
      // refresh list (stay on current page if appropriate)
      await fetchIssues();
    } catch (err) {
      console.error(err);
      alert('Failed to save issue. Check console for details.');
    }
  };

  const toggleSort = (column: SortState['column']) => {
    setCurrentPage(1);
    setSort(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: { key: keyof Issue | 'priority'; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'updatedAt', label: 'Updated At' },
  ];

  return (
    <div className={`font-sans antialiased min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Issue Tracker</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage your project&apos;s issues with ease.</p>
          </div>
          <button onClick={() => { setIsDarkMode(!isDarkMode); localStorage.setItem('theme', (!isDarkMode).toString() ? 'dark' : 'light'); }} className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'text-gray-400 hover:bg-gray-700 focus:ring-gray-600 focus:ring-offset-gray-900' : 'text-gray-500 hover:bg-gray-200 focus:ring-gray-400 focus:ring-offset-gray-100'}`}>
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>

        <div className={`p-4 rounded-lg shadow-sm mb-4 transition-all duration-300 ease-in-out hover:shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <label htmlFor="search" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Search Issues</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              placeholder="Search by title..."
              className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm mb-6 transition-all duration-300 ease-in-out hover:shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow">
              <div>
                <label htmlFor="statusFilter" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select id="statusFilter" className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="priorityFilter" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                <select id="priorityFilter" className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`} value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="assigneeFilter" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assignee</label>
                <select id="assigneeFilter" className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`} value={assigneeFilter} onChange={(e) => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All</option>
                  {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              <button onClick={openCreateModal} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105">
                <Plus size={20} />
                Create Issue
              </button>
            </div>
          </div>
        </div>

        <div className={`rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <tr>
                  {columns.map(col => (
                    <th key={String(col.key)} scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => toggleSort(col.key)}>
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {sort.column === col.key && (
                          sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`text-center py-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No issues found.</td>
                  </tr>
                ) : (
                  issues.map(issue => (
                    <tr key={issue.id} className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`} onClick={() => openDetailDrawer(issue)}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>#{issue.id}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{issue.title}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}><StatusBadge status={issue.status} isDarkMode={isDarkMode} /></td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}><PriorityIcon priority={issue.priority} isDarkMode={isDarkMode} /></td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{issue.assignee}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(issue.updatedAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className={`hover:text-indigo-900 ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600'}`} onClick={(e) => { e.stopPropagation(); openEditModal(issue); }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <nav className={`px-4 py-3 flex items-center justify-between border-t mt-4 rounded-lg shadow-sm sm:px-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} aria-label="Pagination">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`relative inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>Previous</button>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`ml-3 relative inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, total)}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}><span className="sr-only">Previous</span><ChevronLeft size={20} /></button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1 ? `z-10 border-indigo-500 ${isDarkMode ? 'bg-gray-700 text-white border-indigo-400' : 'bg-indigo-50 text-indigo-600'}` : `${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 bg-gray-800 hover:bg-gray-700' : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}><span className="sr-only">Next</span><ChevronRight size={20} /></button>
                </nav>
              </div>
            </div>
          </nav>
        )}
      </div>

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentIssue ? 'Edit Issue' : 'Create Issue'} isDarkMode={isDarkMode}>
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
              <input type="text" id="title" name="title" required defaultValue={currentIssue?.title || ''} className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`} />
            </div>
            <div>
              <label htmlFor="description" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
              <textarea id="description" name="description" rows={4} required defaultValue={currentIssue?.description || ''} className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}></textarea>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select id="status" name="status" defaultValue={currentIssue?.status || STATUSES[0]} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="priority" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                <select id="priority" name="priority" defaultValue={currentIssue?.priority || PRIORITIES[0]} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="assignee" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assignee</label>
              <select id="assignee" name="assignee" defaultValue={currentIssue?.assignee || ASSIGNEES[0]} className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}>
                {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105">Save Issue</button>
          </div>
        </form>
      </Modal>

      <Drawer show={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Issue Details" isDarkMode={isDarkMode}>
        {currentIssue && <JsonViewer data={currentIssue} isDarkMode={isDarkMode} />}
      </Drawer>
    </div>
  );
}
