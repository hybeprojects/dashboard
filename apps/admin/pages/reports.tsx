import Navbar from '../components/ui/Navbar';

export default function Reports() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8">
        <h1 className="text-2xl font-bold mb-2">Reports</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Analytics and export tools for compliance and insights.</p>
      </main>
    </div>
  );
}
