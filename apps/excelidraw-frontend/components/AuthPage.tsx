'use client';

import { useState } from 'react';
import SignIn from '../app/signin/page'; // Adjust path if needed
import SignUp from '../app/signup/page'; // Adjust path if needed

export default function AuthPage() {
  // State to control which component to show: 'login' or 'register'
  const [currentView, setCurrentView] = useState('login');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        {currentView === 'login' ? (
          <>
            <SignIn />
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setCurrentView('register')}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Sign Up
              </button>
            </p>
          </>
        ) : (
          <>
            {/* We pass the setCurrentView function to SignUp so it can switch back to login on success */}
            <SignUp setCurrent={setCurrentView} />
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setCurrentView('login')}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
