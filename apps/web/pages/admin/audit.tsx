import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Table from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/router';

interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  changes?: any | null;
  ip?: string | null;
  user_agent?: string | null;
  metadata?: any | null;
  created_at?: string | null;
}

export default function AdminAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [actorEmail, setActorEmail] = useState('');
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(limit));
    if (search) p.set('search', search);
    if (action) p.set('action', action);
    if (actorEmail) p.set('actor_email', actorEmail);
    if (targetId) p.set('target_id', targetId);
    if (targetType) p.set('target_type', targetType);
    if (start) p.set('start', start);
    if (end) p.set('end', end);
    return p.toString();
  }, [page, limit, search, action, actorEmail, targetId, targetType, start, end]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed: ${res.status}`);
      }
      const body = await res.json();
      setLogs(body.logs || []);
      setTotal(body.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <Head>
        <title>Admin · Audit Logs</title>
      </Head>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              className="border rounded px-3 py-2 bg-transparent"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
            <input
              className="border rounded px-3 py-2 bg-transparent"
              placeholder="Action"
              value={action}
              onChange={(e) => {
                setPage(1);
                setAction(e.target.value);
              }}
            />
            <input
              className="border rounded px-3 py-2 bg-transparent"
              placeholder="Actor email"
              value={actorEmail}
              onChange={(e) => {
                setPage(1);
                setActorEmail(e.target.value);
              }}
            />
            <input
              className="border rounded px-3 py-2 bg-transparent"
              placeholder="Target type"
              value={targetType}
              onChange={(e) => {
                setPage(1);
                setTargetType(e.target.value);
              }}
            />
            <input
              className="border rounded px-3 py-2 bg-transparent"
              placeholder="Target id"
              value={targetId}
              onChange={(e) => {
                setPage(1);
                setTargetId(e.target.value);
              }}
            />
            <input
              type="datetime-local"
              className="border rounded px-3 py-2 bg-transparent"
              value={start}
              onChange={(e) => {
                setPage(1);
                setStart(e.target.value);
              }}
            />
            <input
              type="datetime-local"
              className="border rounded px-3 py-2 bg-transparent"
              value={end}
              onChange={(e) => {
                setPage(1);
                setEnd(e.target.value);
              }}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per page</label>
              <select
                className="border rounded px-2 py-2 bg-transparent"
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(parseInt(e.target.value, 10));
                }}
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">{loading ? 'Loading…' : `${total} total`}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Prev
              </Button>
              <span className="text-sm">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <Table<AuditLog>
            columns={[
              {
                key: 'created_at',
                header: 'Time',
                render: (r) => (
                  <span className="whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                  </span>
                ),
              },
              { key: 'action', header: 'Action' },
              { key: 'actor_email', header: 'Actor' },
              { key: 'target_type', header: 'Target Type' },
              { key: 'target_id', header: 'Target ID' },
              { key: 'ip', header: 'IP' },
              {
                key: 'metadata',
                header: 'Details',
                render: (r) => (
                  <pre className="text-xs whitespace-pre-wrap max-w-[28rem] overflow-x-auto">
                    {r.metadata ? JSON.stringify(r.metadata, null, 2) : ''}
                  </pre>
                ),
              },
            ]}
            data={logs}
          />
        </Card>
      </div>
    </>
  );
}
