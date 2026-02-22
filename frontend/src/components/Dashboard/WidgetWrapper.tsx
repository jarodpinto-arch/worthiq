import React, { useState } from 'react';
import { WidgetConfig, WidgetSize, SIZE_CLASSES, WIDGET_DEFINITIONS } from './types';

interface WidgetWrapperProps {
  config: WidgetConfig;
  onRemove: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
  children: React.ReactNode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  config,
  onRemove,
  onResize,
  children,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const definition = WIDGET_DEFINITIONS.find(d => d.type === config.type);

  return (
    <div className={`${SIZE_CLASSES[config.size]} bg-white rounded-xl shadow-md overflow-hidden group relative`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">{definition?.icon}</span>
          <h3 className="font-semibold text-gray-900">{config.title}</h3>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase">Resize</p>
                </div>
                {definition?.availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      onResize(config.id, size);
                      setShowMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                      config.size === size ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <span className="capitalize">{size}</span>
                    {config.size === size && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      onRemove(config.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Widget
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
