import React from 'react';
import Link from 'next/link';
import Card from '../components/ui/Card';

export default function BillPayPage() {
  return (
    <div className="container-page p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Bill Pay</h2>
        <Link href="/" className="text-sm text-gray-500">
          Back
        </Link>
      </div>

      <Card>
        <div className="text-sm text-gray-600">Create and manage one-time or scheduled bill payments. (Coming soon)</div>
      </Card>
    </div>
  );
}
