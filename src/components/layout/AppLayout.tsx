import React, { ReactNode } from 'react';
import { LearnerShell } from '../../shells/LearnerShell';

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <LearnerShell>{children}</LearnerShell>;
};
