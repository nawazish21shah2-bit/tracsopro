import React from 'react';
import SharedHeader, { SharedHeaderProps } from '../ui/SharedHeader';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * AuthHeader - Wrapper component for authentication screens
 * Uses SharedHeader with 'auth' variant for consistent styling
 */
const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return <SharedHeader variant="auth" title={title} subtitle={subtitle} />;
};

export default AuthHeader;
