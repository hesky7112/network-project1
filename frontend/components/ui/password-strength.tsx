import React from 'react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className = '' }) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return { label: '', color: 'bg-gray-200' };
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(password);
  const { label, color } = getStrengthLabel(strength);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full ${
              level <= strength ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {label && (
        <p className={`text-xs font-medium ${
          strength <= 2 ? 'text-red-600' :
          strength <= 3 ? 'text-yellow-600' :
          strength <= 4 ? 'text-blue-600' : 'text-green-600'
        }`}>
          Password strength: {label}
        </p>
      )}
    </div>
  );
};
