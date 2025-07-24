
import React from 'react';

export const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={className + ' w-full bg-gray-200 rounded-full h-2'}>
    <div className='bg-indigo-600 h-full rounded-full' style={{ width: value + '%' }} />
  </div>
);
