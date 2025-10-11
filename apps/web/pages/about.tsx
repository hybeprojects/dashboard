'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function About() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">About PremierBank</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          PremierBank is building modern banking infrastructure for individuals and businesses. We
          focus on security, simplicity, and great customer experience. Our products include
          checking, savings, payments, and analytics for tracking your finances.
        </p>
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Our mission</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Deliver accessible financial services with enterprise-grade security.</p>
          </div>
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Leadership</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Experienced team from top fintech and banking companies.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
