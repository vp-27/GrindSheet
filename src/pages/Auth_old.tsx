import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/context/ThemeContext';
import { Dumbbell, Trophy, TrendingUp, Eye, EyeOff } from 'lucide-react';
import '@/styles/components/auth.css';

const Auth = () => {
  const { signIn, signUp, session } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950/50 dark:to-indigo-950/50" />
      
      {/* Animated floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse auth-floating-element-1" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-indigo-300/30 to-blue-300/30 rounded-full blur-2xl animate-pulse auth-floating-element-2" />
      </div>

      <div className="relative w-full max-w-md mx-auto px-6 py-8 z-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* App Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/25 dark:shadow-blue-500/40">
            <Dumbbell className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          
          {/* App Title */}
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
              GrindSheet
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            Track your progress. Achieve your goals.
          </p>

          {/* Feature highlights */}
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span>Compete</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-500" />
              <span>Track</span>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="relative">
          {/* Glassmorphism card */}
          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-black/5 dark:shadow-black/20 p-8">
            {/* Mode Toggle Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {showSignIn ? 'Welcome back' : 'Join GrindSheet'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowSignIn(!showSignIn);
                  // Reset fields when switching
                  setEmail('');
                  setPassword('');
                  setName('');
                  setUsername('');
                  setFocusedField(null);
                }}
                className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50"
              >
                {showSignIn ? 'Create account' : 'Sign in instead'}
              </button>
            </div>

            {showSignIn ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email Field */}
                <div className="relative">
                  <div className="relative group">
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('signin-email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="block w-full pt-6 pb-3 px-4 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-0 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 backdrop-blur-sm"
                    />
                    <Label
                      htmlFor="signin-email"
                      className={`absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 ease-out ${
                        focusedField === 'signin-email' || emailHasValue 
                          ? 'top-2 text-xs font-medium text-blue-600 dark:text-blue-400'
                          : 'top-4 text-base'
                      }`}
                    >
                      Email address
                    </Label>
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <div className="relative group">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('signin-password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="block w-full pt-6 pb-3 px-4 pr-12 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-0 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 backdrop-blur-sm"
                    />
                    <Label
                      htmlFor="signin-password"
                      className={`absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 ease-out ${
                        focusedField === 'signin-password' || passwordHasValue 
                          ? 'top-2 text-xs font-medium text-blue-600 dark:text-blue-400'
                          : 'top-4 text-base'
                      }`}
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing you in...</span>
                      </div>
                    ) : (
                      <span>Sign in to GrindSheet</span>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-5">
                {/* Name Field */}
                <div className="relative">
                  <div className="relative group">
                    <Input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('signup-name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="block w-full pt-6 pb-3 px-4 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-0 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                    />
                    <Label
                      htmlFor="signup-name"
                      className={`absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 ease-out ${
                        focusedField === 'signup-name' || nameHasValue 
                          ? 'top-2 text-xs font-medium text-purple-600 dark:text-purple-400'
                          : 'top-4 text-base'
                      }`}
                    >
                      Full name
                    </Label>
                  </div>
                </div>

                {/* Username Field */}
                <div className="relative">
                  <div className="relative group">
                    <Input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('signup-username')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="block w-full pt-6 pb-3 px-4 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-0 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                    />
                    <Label
                      htmlFor="signup-username"
                      className={`absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 ease-out ${
                        focusedField === 'signup-username' || usernameHasValue 
                          ? 'top-2 text-xs font-medium text-purple-600 dark:text-purple-400'
                          : 'top-4 text-base'
                      }`}
                    >
                      Username
                    </Label>
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative">
                  <div className="relative group">
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('signup-email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="block w-full pt-6 pb-3 px-4 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-0 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                    />
                    <Label
                      htmlFor="signup-email"
                      className={`absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 ease-out ${
                        focusedField === 'signup-email' || emailHasValue 
                          ? 'top-2 text-xs font-medium text-purple-600 dark:text-purple-400'
                          : 'top-4 text-base'
                      }`}
                    >
                      Email address
                    </Label>
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <div className="relative group">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('signup-password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="block w-full pt-6 pb-3 px-4 pr-12 text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-0 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                    />
                    <Label
                      htmlFor="signup-password"
                      className={`absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200 ease-out ${
                        focusedField === 'signup-password' || passwordHasValue 
                          ? 'top-2 text-xs font-medium text-purple-600 dark:text-purple-400'
                          : 'top-4 text-base'
                      }`}
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Sign Up Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating your account...</span>
                      </div>
                    ) : (
                      <span>Start your fitness journey</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
            
            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
