'use client';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
}
