import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="section flex h-14 items-center gap-4">
        <Link href="/" className="font-semibold">
          Admin •{' '}
          <img
            src="https://res.cloudinary.com/dgqhyz67g/image/upload/Cleaned-logo-Premier-bank_flnsfz.png"
            alt="PremierBank"
            className="h-6 inline-block align-middle"
          />
        </Link>
        <div className="ml-auto flex gap-4 text-sm">
          <Link href="/kyc">KYC</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/reports">Reports</Link>
        </div>
      </div>
    </nav>
  );
}
