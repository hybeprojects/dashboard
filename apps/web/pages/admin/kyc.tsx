import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

type Submission = {
  id: number;
  submission_id: string;
  email: string;
  full_name: string;
  dob: string;
  ssn_last4: string;
  address: string;
  open_savings: number;
  id_front_path: string;
  id_back_path: string;
  proof_path: string;
  status: 'approved' | 'rejected' | 'pending' | string;
  created_at: string;
};

type PreviewMap = Record<string, string | null>;

function StatusBadge({ status }: { status: Submission['status'] }) {
  if (status === 'approved')
    return (
      <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
        Approved
      </span>
    );
  if (status === 'rejected')
    return (
      <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
        Rejected
      </span>
    );
  return (
    <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-yellow-50 text-yellow-800">
      Pending
    </span>
  );
}

function LoadingCard() {
  return (
    <div className="card-surface p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-56" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
      </div>
      <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-800 rounded w-40" />
      <div className="mt-1 h-3 bg-gray-200 dark:bg-gray-800 rounded w-64" />
      <div className="mt-4 flex gap-2">
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

export default function AdminKyc() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewMap | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [page]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/kyc/submissions?page=${page}&limit=50`);
      setSubs(res.data.submissions || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  async function openPreview(submissionId: string) {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    try {
      const res = await api.get(`/admin/kyc/signed/${submissionId}`);
      setPreviewData((res.data?.urls || {}) as PreviewMap);
    } catch (e: any) {
      console.error('preview error', e);
      setPreviewError(
        e?.response?.status === 403
          ? 'Forbidden — admin access required.'
          : e?.message || 'Failed to fetch preview URLs',
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function decide(submissionId: string, decision: 'approved' | 'rejected') {
    try {
      await api.post('/admin/kyc/decision', { submissionId, decision });
      load();
    } catch (e) {
      console.error('decision error', e);
      alert('Failed to set decision');
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return subs.filter((s) => {
      const matchesStatus = status === 'all' ? true : s.status === status;
      const matchesQuery = term ? `${s.full_name} ${s.email}`.toLowerCase().includes(term) : true;
      return matchesStatus && matchesQuery;
    });
  }, [subs, q, status]);

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">KYC Submissions</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review, approve, or reject.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    status === st ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600'
                  }`}
                  aria-pressed={status === st}
                  onClick={() => setStatus(st)}
                >
                  {st[0].toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 sm:flex-initial">
              <label className="sr-only" htmlFor="search">
                Search
              </label>
              <input
                id="search"
                className="input-field w-full"
                placeholder="Search name or email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            {filtered.length === 0 && <div>No submissions found.</div>}
            {filtered.map((s) => (
              <div
                key={s.id}
                className="card-surface p-4 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">
                      {s.full_name} — {s.email}
                    </div>
                    <StatusBadge status={s.status as any} />
                  </div>
                  <div className="text-sm text-gray-500">
                    Submitted {new Date(s.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm">Address: {s.address}</div>
                  <div className="text-sm">SSN last4: •••• {s.ssn_last4}</div>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <Button variant="secondary" onClick={() => openPreview(s.submission_id)}>
                    Preview
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => decide(s.submission_id, 'approved')}
                    aria-label={`Approve submission for ${s.full_name}`}
                  >
                    Approve
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => decide(s.submission_id, 'rejected')}
                    aria-label={`Reject submission for ${s.full_name}`}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page === 1}
              >
                Prev
              </Button>
              <div>Page {page}</div>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={loading}>
                Next
              </Button>
            </div>
          </div>
        )}

        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="KYC Documents">
          {previewLoading && <div className="text-sm">Loading preview…</div>}
          {previewError && (
            <div className="text-sm text-red-600 dark:text-red-400">{previewError}</div>
          )}
          {previewData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(previewData).map(([label, url]) => (
                <div
                  key={label}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-2"
                >
                  <div className="text-xs mb-1 text-gray-600 dark:text-gray-400">{label}</div>
                  {url ? (
                    url.match(/\.pdf($|\?)/i) ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-sm"
                      >
                        Open PDF in new tab
                      </a>
                    ) : (
                      // eslint-disable-next-line
                      <img src={url} alt={label} className="w-full h-48 object-contain" />
                    )
                  ) : (
                    <div className="text-xs text-gray-500">Unavailable</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
