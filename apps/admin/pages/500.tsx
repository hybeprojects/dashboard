export default function ServerError() {
  return (
    <div className="container-page">
      <main className="section py-8">
        <h1 className="text-2xl font-bold mb-2">500 - Server Error</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">An unexpected error occurred.</p>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
