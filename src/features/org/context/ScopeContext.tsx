import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { OrgUnit, ScopeContextType } from '../../../types/org';
import { orgApi } from '../../../api/org/client';
import { useApp } from '../../../state/AppContext';
import { resolveOrgRole } from '../../../lib/permissions';

const ScopeContext = createContext<ScopeContextType | null>(null);

export const ScopeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const [units, setUnits] = useState<OrgUnit[]>([]);

  // The role comes from the session and nothing else. A user holding both roles
  // acts as org_admin; anyone else never reaches this provider (see RequireRole).
  //
  // TODO(server): authoritative RBAC and scope on every endpoint; UI guards are UX only.
  const userRole = resolveOrgRole(user);
  const canManageAllUnits = userRole === 'org_admin';

  // A unit manager is pinned to their own subtree; there is no fallback unit.
  const managedNodeId = user.managedNodeId;

  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const currentOrg = useMemo(
    () => ({
      id: user.membership?.orgId ?? 'org-foolad',
      name: user.membership?.orgName ?? 'مجتمع فولاد نمونه',
    }),
    [user.membership?.orgId, user.membership?.orgName]
  );

  useEffect(() => {
    orgApi.getUnits().then(setUnits);
  }, []);

  const effectiveUnitId: string | 'all' = canManageAllUnits
    ? selectedUnitId
    : (managedNodeId ?? 'all');

  const managedUnitName = useMemo(() => {
    if (!managedNodeId) return currentOrg.name;
    return units.find((u) => u.id === managedNodeId)?.name ?? currentOrg.name;
  }, [units, managedNodeId, currentOrg.name]);

  const value = useMemo<ScopeContextType>(
    () => ({
      currentOrg,
      userRole,
      selectedUnitId: effectiveUnitId,
      setSelectedUnitId: (val) => {
        if (canManageAllUnits) setSelectedUnitId(val);
      },
      units,
      canManageAllUnits,
      effectiveUnitId,
      managedNodeId,
      managedUnitName,
    }),
    [
      currentOrg,
      userRole,
      effectiveUnitId,
      canManageAllUnits,
      units,
      managedNodeId,
      managedUnitName,
    ]
  );

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
};

export const useOrgScope = () => {
  const ctx = useContext(ScopeContext);
  if (!ctx) {
    throw new Error('useOrgScope must be used within ScopeProvider');
  }
  return ctx;
};
