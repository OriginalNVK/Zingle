
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../constants';
import Button from '../components/common/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <h2 className="mt-4 text-3xl font-semibold text-gray-800">Page Not Found</h2>
      <p className="mt-2 text-gray-600">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <img 
        src="https://picsum.photos/seed/404page/400/300" 
        alt="Lost and Confused" 
        className="mt-8 mb-8 max-w-sm rounded-lg shadow-lg"
      />
      <Link to={ROUTE_PATHS.CHAT}>
        <Button variant="primary" size="lg">
          Go Back Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
