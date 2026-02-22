import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import api from '../services/api';

interface PlaidLinkProps {
  onSuccess: (publicToken: string, metadata: any) => void;
  userId: string;
}

export const PlaidLink: React.FC<PlaidLinkProps> = ({ onSuccess, userId }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        setError(null);
        const data = await api.createLinkToken();
        setLinkToken(data.link_token);
      } catch (err) {
        console.error('Error creating link token:', err);
        setError('Unable to initialize bank connection');
      }
    };

    if (api.isAuthenticated()) {
      createLinkToken();
    }
  }, [userId]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      onSuccess(public_token, metadata);
    },
  });

  if (error) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white font-medium py-2 px-4 rounded-lg cursor-not-allowed flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Connection Error
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      {ready ? 'Connect Bank' : 'Loading...'}
    </button>
  );
};
