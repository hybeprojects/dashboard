import Navbar from './components/ui/Navbar';

export default function AdminTransactions() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8">
        <h1 className="text-2xl font-bold mb-2">Transaction Monitoring</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Search and flag suspicious activity.</p>
      </main>
    </div>
  );
}
