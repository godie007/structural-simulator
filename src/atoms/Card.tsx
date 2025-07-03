import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  variant = 'default'
}) => {
  const baseClasses = 'bg-gray-800 rounded-lg border border-gray-700';
  
  const variantClasses = {
    default: 'shadow-lg',
    elevated: 'shadow-2xl border-gray-600',
    outlined: 'border-2 border-gray-600'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <div className={classes}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card; 