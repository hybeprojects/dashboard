import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';

const txs = [
  { id: 'T-1001', date: '2025-01-02', desc: 'Grocery', amount: -54.23 },
  { id: 'T-1002', date: '2025-01-05', desc: 'Salary', amount: 3000 },
];

export default function Transactions() {
  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <Table columns={[{ key: 'id', header: 'ID' }, { key: 'date', header: 'Date' }, { key: 'desc', header: 'Description' }, { key: 'amount', header: 'Amount' }]} data={txs} />
          </Card>
        </main>
      </div>
    </div>
  );
}
