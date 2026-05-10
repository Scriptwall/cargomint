import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface ShellProps {
  children: React.ReactNode;
  portalName: string;
  portalSub: string;
  navGroups: any[];
  pageTitle: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const Shell: React.FC<ShellProps> = ({ 
  children, 
  portalName, 
  portalSub, 
  navGroups, 
  pageTitle, 
  primaryAction 
}) => {
  return (
    <div className="shell">
      <Sidebar portalName={portalName} portalSub={portalSub} navGroups={navGroups} />
      
      <div className="main">
        <TopBar title={pageTitle} primaryAction={primaryAction} />
        
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};
