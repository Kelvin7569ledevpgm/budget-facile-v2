import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Card({ className = '', elevated, children, ...rest }: CardProps) {
  const cls = elevated ? 'surface-elevated' : 'card';
  return (
    <div className={`${cls} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
