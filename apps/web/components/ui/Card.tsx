import { ReactNode, HTMLAttributes } from 'react';
export default function Card({
  children,
  className = '',
  ...props
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-surface p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
