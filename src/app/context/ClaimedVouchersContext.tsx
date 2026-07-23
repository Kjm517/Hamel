import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createCustomerClaim,
  fetchCustomerClaims,
  type CustomerVoucherClaim,
} from '../lib/customer-api';
import {
  clearLegacyClaimedVoucherStorage,
  isVoucherCardClaimed,
  isVoucherCodeClaimed,
  notifyClaimedVouchersUpdated,
  subscribeClaimedVouchers,
  type ClaimedVoucherEntry,
} from '../lib/claimed-vouchers';
import { useCustomerAuth } from './CustomerAuthContext';

type ClaimedVouchersContextValue = {
  claims: ClaimedVoucherEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
  claimVoucher: (input: {
    cardId: string;
    title: string;
    voucherCode?: string;
    source?: 'cool-deals' | 'admin';
  }) => Promise<ClaimedVoucherEntry>;
  isCardClaimed: (cardId: string) => boolean;
  isCodeClaimed: (code: string) => boolean;
};

const ClaimedVouchersContext = createContext<ClaimedVouchersContextValue | null>(null);

function toEntry(claim: CustomerVoucherClaim): ClaimedVoucherEntry {
  return {
    id: claim.id,
    cardId: claim.cardId,
    title: claim.title,
    voucherCode: claim.voucherCode,
    claimedAt: claim.claimedAt,
    source: claim.source,
  };
}

export function ClaimedVouchersProvider({ children }: { children: ReactNode }) {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [claims, setClaims] = useState<ClaimedVoucherEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearLegacyClaimedVoucherStorage();
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !customer) {
      setClaims([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchCustomerClaims();
      setClaims(rows.map(toEntry));
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [customer, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => subscribeClaimedVouchers(() => void refresh()), [refresh]);

  const claimVoucher = useCallback(
    async (input: {
      cardId: string;
      title: string;
      voucherCode?: string;
      source?: 'cool-deals';
    }) => {
      const created = toEntry(await createCustomerClaim(input));
      setClaims((prev) => {
        const next = prev.filter((e) => e.cardId !== created.cardId);
        next.unshift(created);
        return next;
      });
      notifyClaimedVouchersUpdated();
      return created;
    },
    []
  );

  const value = useMemo<ClaimedVouchersContextValue>(
    () => ({
      claims,
      loading,
      refresh,
      claimVoucher,
      isCardClaimed: (cardId: string) => isVoucherCardClaimed(claims, cardId),
      isCodeClaimed: (code: string) => isVoucherCodeClaimed(claims, code),
    }),
    [claims, loading, refresh, claimVoucher]
  );

  return (
    <ClaimedVouchersContext.Provider value={value}>
      {children}
    </ClaimedVouchersContext.Provider>
  );
}

export function useClaimedVouchers() {
  const ctx = useContext(ClaimedVouchersContext);
  if (!ctx) {
    throw new Error('useClaimedVouchers must be used within ClaimedVouchersProvider');
  }
  return ctx;
}
