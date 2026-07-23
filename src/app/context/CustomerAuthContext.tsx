import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  CUSTOMER_AUTH_EVENT,
  clearCustomerToken,
  fetchCustomerMe,
  getCustomerToken,
  logoutCustomer,
  type Customer,
} from '../lib/customer-api';

export type AuthModalView = 'login' | 'signup';

type OpenAuthOptions = {
  /** Which tab to show first. */
  view?: AuthModalView;
  /** Short line explaining why sign-in is needed (e.g. voucher claim). */
  reason?: string;
  /** Run once the customer successfully signs in / verifies. */
  onSuccess?: (customer: Customer) => void;
};

type CustomerAuthContextValue = {
  customer: Customer | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Called by the modal once auth completes; runs the pending action. */
  onAuthenticated: (customer: Customer) => void;

  /** Modal control. */
  modalOpen: boolean;
  modalView: AuthModalView;
  modalReason: string | null;
  openAuth: (options?: OpenAuthOptions) => void;
  closeAuth: () => void;
  setModalView: (view: AuthModalView) => void;

  /**
   * Convenience gate: if signed in, runs `action` now; otherwise opens the auth
   * modal and runs it once the customer signs in (with the authenticated customer).
   */
  requireAuth: (
    action: (customer: Customer) => void,
    options?: Omit<OpenAuthOptions, 'onSuccess'>
  ) => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<AuthModalView>('login');
  const [modalReason, setModalReason] = useState<string | null>(null);
  const pendingSuccess = useRef<((customer: Customer) => void) | null>(null);

  const refresh = useCallback(async () => {
    if (!getCustomerToken()) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    const me = await fetchCustomerMe();
    setCustomer(me);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(CUSTOMER_AUTH_EVENT, onChange);
    return () => window.removeEventListener(CUSTOMER_AUTH_EVENT, onChange);
  }, [refresh]);

  const openAuth = useCallback((options?: OpenAuthOptions) => {
    pendingSuccess.current = options?.onSuccess ?? null;
    setModalView(options?.view ?? 'login');
    setModalReason(options?.reason ?? null);
    setModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setModalOpen(false);
    pendingSuccess.current = null;
    setModalReason(null);
  }, []);

  const onAuthenticated = useCallback((next: Customer) => {
    setCustomer(next);
    setModalOpen(false);
    setModalReason(null);
    const cb = pendingSuccess.current;
    pendingSuccess.current = null;
    // Defer so the modal close animation and state settle first.
    if (cb) setTimeout(() => cb(next), 0);
  }, []);

  const signOut = useCallback(async () => {
    await logoutCustomer();
    setCustomer(null);
  }, []);

  const requireAuth = useCallback(
    (
      action: (customer: Customer) => void,
      options?: Omit<OpenAuthOptions, 'onSuccess'>
    ) => {
      if (getCustomerToken() && customer) {
        action(customer);
        return;
      }
      openAuth({ ...options, onSuccess: action });
    },
    [customer, openAuth]
  );

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      customer,
      loading,
      isAuthenticated: Boolean(customer),
      refresh,
      signOut,
      onAuthenticated,
      modalOpen,
      modalView,
      modalReason,
      openAuth,
      closeAuth,
      setModalView,
      requireAuth,
    }),
    [
      customer,
      loading,
      refresh,
      signOut,
      onAuthenticated,
      modalOpen,
      modalView,
      modalReason,
      openAuth,
      closeAuth,
      requireAuth,
    ]
  );

  // Cross-tab logout: if the token vanishes elsewhere, drop the session here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'hamel_customer_token' && !e.newValue) {
        clearCustomerToken();
        setCustomer(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return ctx;
}
