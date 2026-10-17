import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerUser, Product } from '../types/index.ts';
import {
  api,
  getCustomerToken,
  setCustomerToken,
  removeCustomerToken
} from '../api/client.ts';

interface PendingCartItem {
  product: Product;
  quantity: number;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  pendingCartItem: PendingCartItem | null;
  setPendingCartItem: (item: PendingCartItem | null) => void;
  isAuthModalOpen: boolean;
  authModalInitialTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register', pendingItem?: PendingCartItem) => void;
  closeAuthModal: () => void;
}

export const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingCartItem, setPendingCartItem] = useState<PendingCartItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');

  const fetchCurrentCustomer = async () => {
    const token = getCustomerToken();
    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getCustomerMe();
      setCustomer(res.customer);
    } catch {
      removeCustomerToken();
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentCustomer();

    const handleUnauthorized = () => {
      setCustomer(null);
    };

    window.addEventListener('customer:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('customer:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.customerLogin(email, pass);
      setCustomerToken(res.token);
      setCustomer(res.customer);
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.customerRegister(fullName, email, pass);
      setCustomerToken(res.token);
      setCustomer(res.customer);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const res = await api.customerDemoLogin();
      setCustomerToken(res.token);
      setCustomer(res.customer);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.customerLogout();
    } catch {
      // ignore
    } finally {
      removeCustomerToken();
      setCustomer(null);
    }
  };

  const refreshCustomer = async () => {
    await fetchCurrentCustomer();
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login', pendingItem?: PendingCartItem) => {
    setAuthModalInitialTab(tab);
    if (pendingItem) {
      setPendingCartItem(pendingItem);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingCartItem(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshCustomer,
        pendingCartItem,
        setPendingCartItem,
        isAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
