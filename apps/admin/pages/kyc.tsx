import Navbar from '../components/ui/Navbar';

export default function KYC() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8">
        <h1 className="text-2xl font-bold mb-2">KYC Verification</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Review and approve new customer submissions.</p>
      </main>
    </div>
  );
}
