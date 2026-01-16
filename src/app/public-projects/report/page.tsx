'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';

interface Project {
  _id: string;
  name: string;
  location?: string;
  approvedBudgetContract?: number;
  status: string;
  startDate: string | Date;
  endDate?: string | Date;
  description?: string;
  contractId?: string;
  appropriation?: string;
  priority?: string;
  progress?: number;
}

export default function ProjectReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/public/projects?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const result = await response.json();
      console.log('Fetched data:', result);
      // The API returns data in result.data, not result.projects
      const projectList = result.data || [];
      setProjects(projectList);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Project_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        table {
          font-size: 9px;
        }
        th, td {
          padding: 4px 6px !important;
        }
      }
    `,
  });

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'not-yet-started': 'Not Yet Started',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'on-hold': 'On Hold',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* Header - No Print */}
      <div className="no-print sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg flex-shrink-0">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/public-projects')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Projects
              </button>
              <div>
                <h1 className="text-2xl font-bold">Project Report</h1>
                <p className="text-blue-100 text-sm mt-1">Comprehensive overview of all projects</p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-amber-900 to-yellow-900 hover:from-amber-800 hover:to-yellow-800 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div ref={printRef} className="bg-white">
        {/* Report Header - Print Only */}
        <div className="print-only px-8 pt-8 pb-4">
          <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PROJECT MONITORING REPORT</h1>
            <p className="text-sm text-gray-600">
              Generated on: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">Total Projects: {projects.length}</p>
          </div>
        </div>

        {/* Stats Summary - Screen Only */}
        <div className="no-print sticky top-[88px] z-40 bg-gray-50 max-w-[1400px] mx-auto px-6 py-3 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Report Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
                <div className="text-xl font-bold text-slate-700">{projects.length}</div>
                <div className="text-xs text-slate-600 font-medium">Total Projects</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                <div className="text-xl font-bold text-emerald-700">
                  {projects.filter(p => p.status === 'approved').length}
                </div>
                <div className="text-xs text-emerald-600 font-medium">Approved</div>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg p-3 border border-sky-200">
                <div className="text-xl font-bold text-sky-700">
                  {projects.filter(p => p.status === 'on-going').length}
                </div>
                <div className="text-xs text-sky-600 font-medium">On-going</div>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3 border border-violet-200">
                <div className="text-xl font-bold text-violet-700">
                  {formatCurrency(projects.reduce((sum, p) => sum + (p.approvedBudgetContract || 0), 0))}
                </div>
                <div className="text-xs text-violet-600 font-medium">Total Budget</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="no-print max-w-[1400px] mx-auto px-6 pb-3">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'scroll', overflowX: 'auto' }} className="scrollbar-visible">
              <table className="w-full border-collapse report-table">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500 w-24">
                      Contract ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500">
                      Project Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500">
                      Appropriation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500 w-32">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500 w-28">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-blue-500 w-28">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-80">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projects.map((project, index) => (
                    <tr 
                      key={project._id}
                      className={`transition-colors hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-gray-700 border-r border-gray-200">
                        {project.contractId || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-900 border-r border-gray-200">
                        {project.description || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-200">
                        {project.location || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-200">
                        {project.appropriation || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs border-r border-gray-200">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          project.status === 'approved' 
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : project.status === 'on-going'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : project.status === 'not-yet-started'
                            ? 'bg-gray-100 text-gray-800 border border-gray-300'
                            : project.status === 'submitted'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {getStatusDisplay(project.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-200 whitespace-nowrap">
                        {formatDate(project.startDate)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-200 whitespace-nowrap">
                        {formatDate(project.endDate)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Print-only table */}
        <div className="print-only px-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse report-table">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase" style={{width: '80px'}}>
                    Contract ID
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase">
                    Project Description
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase">
                    Location
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase">
                    Appropriation
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase" style={{width: '100px'}}>
                    Status
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase" style={{width: '90px'}}>
                    Start Date
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase" style={{width: '90px'}}>
                    End Date
                  </th>
                  <th className="border border-gray-400 px-3 py-3 text-left text-xs font-semibold uppercase" style={{width: '250px'}}>
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr 
                    key={project._id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="border border-gray-400 px-3 py-2 text-xs">
                      {project.contractId || 'N/A'}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs font-medium">
                      {project.description || 'N/A'}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs">
                      {project.location || 'N/A'}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs">
                      {project.appropriation || 'N/A'}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {getStatusDisplay(project.status)}
                      </span>
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs whitespace-nowrap">
                      {formatDate(project.startDate)}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs whitespace-nowrap">
                      {formatDate(project.endDate)}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-xs">
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer - Print Only */}
          <div className="print-only mt-8 pt-6 border-t-2 border-blue-600">
            <div className="grid grid-cols-3 gap-6 text-xs">
              <div>
                <p className="font-bold text-blue-800 mb-1">Prepared by:</p>
                <div className="border-t-2 border-gray-800 mt-10 pt-1">
                  <p className="text-center font-semibold">Name & Signature</p>
                </div>
              </div>
              <div>
                <p className="font-bold text-blue-800 mb-1">Reviewed by:</p>
                <div className="border-t-2 border-gray-800 mt-10 pt-1">
                  <p className="text-center font-semibold">Name & Signature</p>
                </div>
              </div>
              <div>
                <p className="font-bold text-blue-800 mb-1">Approved by:</p>
                <div className="border-t-2 border-gray-800 mt-10 pt-1">
                  <p className="text-center font-semibold">Name & Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
          }
          .report-table {
            page-break-inside: auto;
          }
          .report-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .report-table thead {
            display: table-header-group;
          }
          .report-table tfoot {
            display: table-footer-group;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
          .scrollbar-visible::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          .scrollbar-visible::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 6px;
          }
          .scrollbar-visible::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 6px;
          }
          .scrollbar-visible::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        }
      `}</style>
    </div>
  );
}
