import Navbar from '../components/Navbar';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Transactions() {
  const [txs, setTxs] = useState<any[]>([]);
  useEffect(() => {
    api
      .get('/transactions')
      .then((r) => setTxs(r.data?.transactions || r.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <Table
              columns={[
                { key: 'id', header: 'ID' },
                { key: 'createdAt', header: 'Date' },
                { key: 'desc', header: 'Description' },
                { key: 'amount', header: 'Amount' },
              ]}
              data={txs}
            />
          </Card>
        </main>
      </div>
    </div>
  );
}
