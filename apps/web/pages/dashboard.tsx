import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';
import OverviewChart from '../components/charts/OverviewChart';
import DonutChart from '../components/charts/DonutChart';

const area = Array.from({ length: 12 }, (_, i) => ({ name: `M${i + 1}`, value: Math.round(Math.random() * 1000) }));
const donut = [
  { name: 'Payments', value: 400 },
  { name: 'Transfers', value: 300 },
  { name: 'Cards', value: 200 },
  { name: 'Other', value: 100 }
];

export default function Dashboard() {
  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card><div className="text-sm text-gray-500">Total Balance</div><div className="text-2xl font-bold">$24,580.90</div></Card>
            <Card><div className="text-sm text-gray-500">Monthly Spend</div><div className="text-2xl font-bold">$2,120.55</div></Card>
            <Card><div className="text-sm text-gray-500">Incoming</div><div className="text-2xl font-bold">$3,010.00</div></Card>
          </div>
          <Card>
            <h3 className="text-lg font-semibold mb-4">Cashflow</h3>
            <OverviewChart data={area} />
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-4">Spending breakdown</h3>
            <DonutChart data={donut} />
          </Card>
        </main>
      </div>
    </div>
  );
}
