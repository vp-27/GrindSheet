import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const Auth = () => {
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true);
  
  // Focus states for floating label animation
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check if fields have values (for floating label effect)
  const emailHasValue = email.trim() !== '';
  const passwordHasValue = password.trim() !== '';
  const nameHasValue = name.trim() !== '';
  const usernameHasValue = username.trim() !== '';

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed in successfully',
        description: 'Welcome back!',
      });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !username) {
      toast({
        title: 'Missing information',
        description: 'Please provide a name and username.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error, user } = await signUp(email, password, { name, username });

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'Please check your information and try again.',
        variant: 'destructive',
      });
    } else if (user) {
      toast({
        title: 'Account created',
        description: 'Your account has been successfully created!',
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-600">
              GrindSheet
            </span>
          </h1>
          <p className="text-sm text-gray-500">Track your progress. Achieve your goals.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {showSignIn ? 'Welcome back' : 'Create account'}
            </h2>
            <button
              type="button"
              onClick={() => setShowSignIn(!showSignIn)}
              className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              {showSignIn ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          {showSignIn ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="relative">
                <div className="relative border-b-2 border-gray-200 focus-within:border-green-500 transition-colors group">
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('signin-email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="block w-full border-0 bg-transparent pt-6 pb-2 px-0 text-gray-800 focus:ring-0 focus:outline-none"
                  />
                  <Label
                    htmlFor="signin-email"
                    className={`absolute top-4 left-0 text-gray-500 pointer-events-none transition-all duration-200 ease-in-out ${
                      focusedField === 'signin-email' || emailHasValue 
                        ? 'transform -translate-y-4 scale-85 text-green-600'
                        : ''
                    }`}
                  >
                    Email
                  </Label>
                </div>
              </div>

              <div className="relative">
                <div className="relative border-b-2 border-gray-200 focus-within:border-green-500 transition-colors group">
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('signin-password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="block w-full border-0 bg-transparent pt-6 pb-2 px-0 text-gray-800 focus:ring-0 focus:outline-none"
                  />
                  <Label
                    htmlFor="signin-password"
                    className={`absolute top-4 left-0 text-gray-500 pointer-events-none transition-all duration-200 ease-in-out ${
                      focusedField === 'signin-password' || passwordHasValue 
                        ? 'transform -translate-y-4 scale-85 text-green-600'
                        : ''
                    }`}
                  >
                    Password
                  </Label>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:translate-y-[-1px]"
                  disabled={isLoading}
                  aria-label="Sign In"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign in
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="relative">
                <div className="relative border-b-2 border-gray-200 focus-within:border-green-500 transition-colors group">
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('signup-name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="block w-full border-0 bg-transparent pt-6 pb-2 px-0 text-gray-800 focus:ring-0 focus:outline-none"
                  />
                  <Label
                    htmlFor="signup-name"
                    className={`absolute top-4 left-0 text-gray-500 pointer-events-none transition-all duration-200 ease-in-out ${
                      focusedField === 'signup-name' || nameHasValue 
                        ? 'transform -translate-y-4 scale-85 text-green-600'
                        : ''
                    }`}
                  >
                    Name
                  </Label>
                </div>
              </div>

              <div className="relative">
                <div className="relative border-b-2 border-gray-200 focus-within:border-green-500 transition-colors group">
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('signup-username')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="block w-full border-0 bg-transparent pt-6 pb-2 px-0 text-gray-800 focus:ring-0 focus:outline-none"
                  />
                  <Label
                    htmlFor="signup-username"
                    className={`absolute top-4 left-0 text-gray-500 pointer-events-none transition-all duration-200 ease-in-out ${
                      focusedField === 'signup-username' || usernameHasValue 
                        ? 'transform -translate-y-4 scale-85 text-green-600'
                        : ''
                    }`}
                  >
                    Username
                  </Label>
                </div>
              </div>

              <div className="relative">
                <div className="relative border-b-2 border-gray-200 focus-within:border-green-500 transition-colors group">
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('signup-email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="block w-full border-0 bg-transparent pt-6 pb-2 px-0 text-gray-800 focus:ring-0 focus:outline-none"
                  />
                  <Label
                    htmlFor="signup-email"
                    className={`absolute top-4 left-0 text-gray-500 pointer-events-none transition-all duration-200 ease-in-out ${
                      focusedField === 'signup-email' || emailHasValue 
                        ? 'transform -translate-y-4 scale-85 text-green-600'
                        : ''
                    }`}
                  >
                    Email
                  </Label>
                </div>
              </div>

              <div className="relative">
                <div className="relative border-b-2 border-gray-200 focus-within:border-green-500 transition-colors group">
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('signup-password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="block w-full border-0 bg-transparent pt-6 pb-2 px-0 text-gray-800 focus:ring-0 focus:outline-none"
                  />
                  <Label
                    htmlFor="signup-password"
                    className={`absolute top-4 left-0 text-gray-500 pointer-events-none transition-all duration-200 ease-in-out ${
                      focusedField === 'signup-password' || passwordHasValue 
                        ? 'transform -translate-y-4 scale-85 text-green-600'
                        : ''
                    }`}
                  >
                    Password
                  </Label>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:translate-y-[-1px]"
                  disabled={isLoading}
                  aria-label="Sign Up"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Create account
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-8 pt-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              By using GrindSheet, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
