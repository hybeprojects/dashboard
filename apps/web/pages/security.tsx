'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Security() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Security</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We take security seriously. Our platform uses industry-standard encryption, hardware-backed
          key storage, and continuous monitoring. We offer multi-factor authentication and support
          passkeys for secure logins.
        </p>
        <section className="space-y-4">
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Encryption</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Data is encrypted at rest and in transit using modern ciphers.</p>
          </div>
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Authentication</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Multi-factor authentication and passkeys are supported for strong account protection.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
