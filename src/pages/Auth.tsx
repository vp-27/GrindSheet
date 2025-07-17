import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { Dumbbell, ChevronRight, Check, Mail, Lock, User, ArrowRight } from 'lucide-react';
import '@/styles/components/auth.css';
import { useAppContext } from '@/context/useAppContext';

const Auth = () => {
  const { signIn, signUp, session } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAppReady } = useAppContext();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupStep, setSignupStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Reset form when switching between login/signup
  useEffect(() => {
    setEmail('');
    setPassword('');
    setName('');
    setUsername('');
    setConfirmPassword('');
    setSignupStep(1); // Reset to step 1 when switching to signup
  }, [isLogin]);

  // Force re-render of progress bar when step changes
  useEffect(() => {
    // This ensures the CSS class is properly applied
    const progressLine = document.querySelector('.progress-line');
    if (progressLine && !isLogin) {
      progressLine.className = `progress-line step-${signupStep}`;
    }
  }, [signupStep, isLogin]);

  useEffect(() => {
    setAppReady(true);
  }, [setAppReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Authentication failed',
            description: error.message || 'Please check your credentials',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Successfully signed in',
          });
          navigate('/');
        }
      } else {
        if (signupStep === 1) {
          // Validate email and move to step 2
          if (email && email.includes('@')) {
            setSignupStep(2);
          } else {
            toast({
              title: 'Invalid email',
              description: 'Please enter a valid email address',
              variant: 'destructive',
            });
          }
        } else if (signupStep === 2) {
          // Validate name/username and move to step 3
          if (name.trim() && username.trim()) {
            setSignupStep(3);
          } else {
            toast({
              title: 'Missing information',
              description: 'Please provide both name and username',
              variant: 'destructive',
            });
          }
        } else {
          // Complete signup
          if (password !== confirmPassword) {
            toast({
              title: 'Passwords don\'t match',
              description: 'Please make sure your passwords match',
              variant: 'destructive',
            });
            return;
          }
          
          const { error } = await signUp(email, password, { name, username });
          if (error) {
            toast({
              title: 'Sign up failed',
              description: error.message || 'Please try again',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Welcome to GrindSheet!',
              description: 'Your account has been created successfully',
            });
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (step: number) => {
    if (signupStep > step) return 'completed';
    if (signupStep === step) return 'active';
    return '';
  };

  const goBackStep = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1);
    }
  };

  return (
    <div className={`auth-container ${isDark ? 'dark' : 'light'}`}>
      {/* Animated Background */}
      <div className="auth-background" />
      
      {/* Main Card */}
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? 'Welcome back' : signupStep === 1 ? 'Create account' : signupStep === 2 ? 'Tell us about you' : 'Secure your account'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Continue your strength journey' 
              : signupStep === 1 
                ? 'Simply track weights, compete with friends'
                : signupStep === 2
                  ? 'Personalize your experience'
                  : 'Choose a strong password'
            }
          </p>
        </div>

        {/* Form Container */}
        <div className="auth-form-container">
          {/* Signup Progress */}
          {!isLogin && (
            <div className="signup-progress">
              <div className="progress-steps">
                <div 
                  className={`progress-line step-${signupStep}`}
                />
                <div className={`progress-step ${getStepStatus(1)}`}>
                  {signupStep > 1 ? <Check size={12} /> : <Mail size={12} />}
                </div>
                <div className={`progress-step ${getStepStatus(2)}`}>
                  {signupStep > 2 ? <Check size={12} /> : <User size={12} />}
                </div>
                <div className={`progress-step ${getStepStatus(3)}`}>
                  <Lock size={12} />
                </div>
              </div>
              <div className="progress-labels">
                <span className={`progress-label ${signupStep === 1 ? 'active' : ''}`}>
                  Email
                </span>
                <span className={`progress-label ${signupStep === 2 ? 'active' : ''}`}>
                  Profile
                </span>
                <span className={`progress-label ${signupStep === 3 ? 'active' : ''}`}>
                  Password
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Login Form */}
            {isLogin && (
              <>
                <div className="input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="auth-input"
                    required
                  />
                </div>
              </>
            )}

            {/* Signup Form - Step 1: Email */}
            {!isLogin && signupStep === 1 && (
              <div className="input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="auth-input"
                  required
                />
              </div>
            )}

            {/* Signup Form - Step 2: Profile */}
            {!isLogin && signupStep === 2 && (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="auth-input"
                    required
                  />
                </div>
              </>
            )}

            {/* Signup Form - Step 3: Password */}
            {!isLogin && signupStep === 3 && (
              <>
                <div className="input-group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="auth-input"
                    required
                  />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="auth-nav-buttons">
              {/* Back Button for Signup */}
              {!isLogin && signupStep > 1 && (
                <button 
                  type="button"
                  onClick={goBackStep}
                  className="auth-submit-btn auth-back-btn"
                >
                  ←
                </button>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="auth-submit-btn primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : isLogin ? (
                  <div className="flex items-center justify-center gap-2">
                    Sign in <ArrowRight size={18} />
                  </div>
                ) : signupStep < 3 ? (
                  <div className="flex items-center justify-center gap-2">
                    Continue <ChevronRight size={18} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Create account <Check size={18} />
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Toggle Section */}
        <div className="auth-toggle">
          <p className="auth-toggle-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="auth-toggle-btn"
          >
            {isLogin ? 'Create account' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
