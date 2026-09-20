import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OrgRole, OrgUnit, ScopeContextType } from '../../../types/org';
import { orgApi } from '../../../api/org/client';
import { useApp } from '../../../state/AppContext';

const ScopeContext = createContext<ScopeContextType | null>(null);

export const ScopeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [units, setUnits] = useState<OrgUnit[]>([]);

  // Default role: if user has roles, use the highest org role, otherwise default to org_admin for full dashboard exploration
  const initialRole: OrgRole = user.roles?.includes('org_admin')
    ? 'org_admin'
    : user.roles?.includes('unit_manager')
      ? 'unit_manager'
      : 'org_admin';

  const [userRole, setUserRole] = useState<OrgRole>(initialRole);
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const currentOrg = {
    id: user.membership?.orgId || 'org-foolad',
    name: user.membership?.orgName || 'مجتمع فولاد نمونه',
  };

  useEffect(() => {
    orgApi.getUnits().then(setUnits);
  }, []);

  // When switching to unit_manager, automatically restrict to their department (or u-nord by default)
  useEffect(() => {
    if (userRole === 'unit_manager') {
      setSelectedUnitId('u-nord');
    } else {
      setSelectedUnitId('all');
    }
  }, [userRole]);

  const canManageAllUnits = userRole === 'org_admin';
  const effectiveUnitId = canManageAllUnits ? selectedUnitId : 'u-nord';

  return (
    <ScopeContext.Provider
      value={{
        currentOrg,
        userRole,
        availableRoles: ['org_admin', 'unit_manager'],
        setUserRole,
        selectedUnitId: effectiveUnitId,
        setSelectedUnitId: (val) => {
          if (canManageAllUnits) {
            setSelectedUnitId(val);
          }
        },
        units,
        canManageAllUnits,
        effectiveUnitId,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
};

export const useOrgScope = () => {
  const ctx = useContext(ScopeContext);
  if (!ctx) {
    throw new Error('useOrgScope must be used within ScopeProvider');
  }
  return ctx;
};
