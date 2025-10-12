import Navbar from '../components/ui/Navbar';

export default function AdminHome() {
  return (
    <div className="container-page">
      <Navbar />
      <main className="section py-8">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Monitor accounts, verify KYC, and review transactions.
        </p>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
