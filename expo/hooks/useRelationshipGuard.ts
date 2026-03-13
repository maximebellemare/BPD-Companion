import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { runSpiralGuard } from '@/services/prediction/relationshipSpiralGuard';
import { SpiralGuardResult } from '@/types/relationshipSpiral';

export function useRelationshipGuard(): SpiralGuardResult {
  const { journalEntries, messageDrafts } = useApp();

  return useMemo(
    () => runSpiralGuard(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );
}
