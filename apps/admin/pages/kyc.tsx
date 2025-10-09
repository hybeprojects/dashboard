import Navbar from '../components/ui/Navbar';

import Navbar from '../components/ui/Navbar';
import { useEffect, useState } from 'react';

type Submission = {
  id: string;
  userId?: string;
  accountType: string;
  data: any;
  files?: { key: string; url: string }[];
  status: string;
  createdAt: string;
};

export default function KYC() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/kyc');
      const data = await res.json();
      setSubs(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onApprove(id: string) {
    await fetch(`/api/kyc/${id}/approve`, { method: 'POST' });
    load();
  }

  async function onReject(id: string) {
    const reason = prompt('Rejection reason');
    await fetch(`/api/kyc/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    load();
  }

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8">
        <h1 className="text-2xl font-bold mb-2">KYC Verification</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Review and approve new customer submissions.</p>

        <div className="mt-6 space-y-4">
          {loading && <div>Loading…</div>}
          {!loading && subs.length === 0 && <div>No submissions</div>}
          {subs.map((s) => (
            <div key={s.id} className="p-4 border rounded-md">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{s.accountType.toUpperCase()} — {s.id}</div>
                  <div className="text-sm text-gray-600">Submitted: {new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => onApprove(s.id)}>Approve</button>
                  <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => onReject(s.id)}>Reject</button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-700">
                <pre className="text-xs bg-gray-50 p-2 overflow-auto">{JSON.stringify(s.data, null, 2)}</pre>
              </div>
              {s.files?.length ? (
                <div className="mt-2 flex gap-2">
                  {s.files.map((f) => (
                    <a key={f.key} href={f.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">View {f.key}</a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
