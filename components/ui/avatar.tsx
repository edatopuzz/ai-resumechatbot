import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, className = '', children }) => {
  return (
    <div className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
      ) : (
        children || <span className="text-sm font-medium text-gray-600">{alt?.[0]?.toUpperCase()}</span>
      )}
    </div>
  );
};

export default Avatar; 