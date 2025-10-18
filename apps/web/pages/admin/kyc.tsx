import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Button from '../../components/ui/Button';
import { createClient } from '../../lib/supabase/client';

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
  status: string;
  created_at: string;
};

export default function AdminKyc() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    try {
      setLoading(true);
      // attach supabase access token for admin auth
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || null;
      const res = await api.get(`/admin/kyc/submissions?page=${page}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSubs(res.data.submissions || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function preview(submissionId: string) {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || null;

      const res = await api.get(`/admin/kyc/signed/${submissionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const { urls } = res.data;
      // open each URL in new tab for review
      Object.values(urls || {}).forEach((u: any) => {
        if (u) window.open(String(u), '_blank');
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('preview error', e);
      alert('Failed to fetch preview URLs. Are you logged in as an admin?');
    }
  }

  async function decide(submissionId: string, decision: 'approved' | 'rejected') {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || null;
      await api.post('/admin/kyc/decision', { submissionId, decision }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('decision error', e);
      alert('Failed to set decision');
    }
  }

  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">KYC Submissions</h1>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="space-y-4">
            {subs.length === 0 && <div>No submissions found.</div>}
            {subs.map((s) => (
              <div
                key={s.id}
                className="card-surface p-4 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {s.full_name} — {s.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    Submitted {new Date(s.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm">Address: {s.address}</div>
                  <div className="text-sm">SSN last4: •••• {s.ssn_last4}</div>
                </div>
                <div className="flex items-center gap-2 mt-3 md:mt-0">
                  <Button onClick={() => preview(s.submission_id)}>Preview</Button>
                  <Button onClick={() => decide(s.submission_id, 'approved')}>Approve</Button>
                  <Button onClick={() => decide(s.submission_id, 'rejected')}>Reject</Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <Button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <div>Page {page}</div>
              <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
