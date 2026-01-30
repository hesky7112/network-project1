'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Toast } from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, action, ...props }) => {
        return (
          <Toast
            key={id}
            className="flex items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200"
            {...props}
          >
            <div className="flex-1">
              {title && <div className="font-medium text-gray-900">{title}</div>}
              {description && (
                <div className="mt-1 text-sm text-gray-500">{description}</div>
              )}
            </div>
            {action}
          </Toast>
        );
      })}
    </div>
  );
}
