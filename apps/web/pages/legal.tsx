import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Legal() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-16 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Legal</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Terms of service, privacy policy, and regulatory disclosures for PremierBank.</p>
        <section className="space-y-4">
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Terms of Service</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">By using our services, you agree to our terms. [Placeholder content — replace with legal text as required]</p>
          </div>
          <div className="card-surface p-4">
            <h3 className="font-semibold mb-2">Privacy Policy</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">We protect your privacy. [Placeholder content — replace with privacy policy text as required]</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
