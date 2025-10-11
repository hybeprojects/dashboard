'use client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/ui/Card';

export default function Settings() {
  return (
    <div className="container-page">
      <Navbar />
      <div className="section grid md:grid-cols-[16rem_1fr] gap-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-2">Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Configure preferences, notifications, and privacy.</p>
          </Card>
        </main>
      </div>
    </div>
  );
}
