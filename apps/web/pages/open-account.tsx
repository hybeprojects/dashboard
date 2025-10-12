import React from 'react';
import Link from 'next/link';
import Card from '../components/ui/Card';

export default function OpenAccount() {
  return (
    <div className="container-page p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Open Account</h2>
        <Link href="/" className="text-sm text-gray-500">
          Back
        </Link>
      </div>
      <Card>
        <p className="text-sm text-gray-600">Choose account type to open:</p>
        <div className="mt-3 grid gap-3">
          <Link href="/register/personal" className="block border rounded p-3 text-center">
            Personal
          </Link>
          <Link href="/register/business" className="block border rounded p-3 text-center">
            Business
          </Link>
        </div>
      </Card>
    </div>
  );
}
