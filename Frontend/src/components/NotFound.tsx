import link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="text-2xl font-light text-gray-600">Page Not Found</p>
        <p className="mt-4 text-gray-500">The page you are looking for does not exist.</p>
        <link 
          to="/" 
          className="mt-6 inline-block bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          Go to Homepage
        </link>
      </div>
    </div>
  );
}