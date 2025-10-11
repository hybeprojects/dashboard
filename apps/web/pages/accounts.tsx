import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';

const accounts = [
  { id: 'CHK-001', type: 'Checking', balance: 12500.5 },
  { id: 'SVG-002', type: 'Savings', balance: 9800.0 },
];

export default function Accounts() {
  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Accounts</h3>
            <Table
              columns={[
                { key: 'id', header: 'Account ID' },
                { key: 'type', header: 'Type' },
                { key: 'balance', header: 'Balance' },
              ]}
              data={accounts}
            />
          </Card>
        </main>
      </div>
    </div>
  );
}
