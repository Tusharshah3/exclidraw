import SignUp from '@/components/signup'; // Make sure this path is correct for your project
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        {/* We'll update the SignUp component next so it doesn't need any props */}
        <SignUp />
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/app/signin"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
