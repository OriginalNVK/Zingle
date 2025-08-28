import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ROUTE_PATHS, APP_NAME } from '../constants';
import { ZingleLogo, FacebookIcon } from '../components/icons';

const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await login(emailOrUsername, password);
      navigate(ROUTE_PATHS.CHAT);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Attempting login with ${provider}... (Mock)`);
    setError(`${provider} login is not implemented yet. Please use email/password login.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-indigo-700 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <ZingleLogo className="w-16 h-16 mx-auto text-primary-600 mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">Welcome to {APP_NAME}</h1>
          <p className="text-gray-500">Connect and chat in real-time.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Username"
            name="emailOrUsername"
            type="text"
            autoComplete="username"
            required
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="alex.j@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="••••••••"
          />

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"/>
                <label htmlFor="remember-me" className="ml-2 block text-gray-900">Remember me</label>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
            Sign In
          </Button>
          <p className="text-sm text-center text-gray-600">
            Don't have an account?{' '}
            <Link to={ROUTE_PATHS.REGISTER} className="font-medium text-primary-600 hover:text-primary-500">
              Sign Up
            </Link>
          </p>
        </form>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => handleSocialLogin('Google')} className="w-full">
            <img src="../public/gg.jpg" className="text-red-500 mr-2 w-5 h-5 rounded-full bg-transparent" alt="Google logo" /> Google
          </Button>
          <Button variant="secondary" onClick={() => handleSocialLogin('Facebook')} className="w-full">
            <FacebookIcon className="text-blue-600 mr-2 w-5 h-5" /> Facebook
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
