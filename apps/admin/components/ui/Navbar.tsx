import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="section flex h-14 items-center gap-4">
        <Link href="/" className="font-semibold">Admin • PremierBank</Link>
        <div className="ml-auto flex gap-4 text-sm">
          <Link href="/kyc">KYC</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/reports">Reports</Link>
        </div>
      </div>
    </nav>
  );
}
