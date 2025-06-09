import React from 'react';

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className = '', children }) => {
  return (
    <div className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ${className}`}>
      {children}
    </div>
  );
};

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ src, alt, className = '' }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full rounded-full object-cover ${className}`}
    />
  );
};

interface AvatarFallbackProps {
  className?: string;
  children: React.ReactNode;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className = '', children }) => {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600 ${className}`}>
      {children}
    </div>
  );
}; 