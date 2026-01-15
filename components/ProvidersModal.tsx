'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatProviderName } from '@/lib/api';
import { getProviderLogo } from '@/lib/providerLogos';

interface Provider {
  name: string;
  count: number;
}

interface ProvidersModalProps {
  providers: Provider[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ProvidersModal({ providers, isOpen, onClose }: ProvidersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter providers based on search
  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Providers</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredProviders.length} of {providers.length} providers
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Providers Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap gap-2">
            {filteredProviders.map((provider) => (
              <Link
                key={provider.name}
                href={`/provider/${encodeURIComponent(provider.name)}`}
                onClick={onClose}
                className="provider-tag"
              >
                <img
                  src={getProviderLogo(provider.name)}
                  alt={`${formatProviderName(provider.name)} logo`}
                  className="provider-tag-icon"
                  loading="lazy"
                />
                {formatProviderName(provider.name)} ({provider.count})
              </Link>
            ))}
          </div>
          {filteredProviders.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No providers found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

