import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

export function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="w-16 h-16 text-primary-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Student Study Planner
          </h1>
          <p className="text-lg text-gray-600">
            Organize your academic life with intelligent planning and progress tracking
          </p>
        </div>

        {showLogin ? (
          <LoginForm onToggle={() => setShowLogin(false)} />
        ) : (
          <SignUpForm onToggle={() => setShowLogin(true)} />
        )}
      </div>
    </div>
  );
}
