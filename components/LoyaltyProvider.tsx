"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type LoyaltyClient,
  type LoyaltyConfig,
  apiGetConfig,
  clearSession,
  loadSession,
  saveSession,
} from "@/lib/loyalty";

type Ctx = {
  client: LoyaltyClient | null;
  config: LoyaltyConfig | null;
  modalOpen: boolean;
  setClient: (c: LoyaltyClient | null) => void;
  openModal: () => void;
  closeModal: () => void;
  logout: () => void;
  isLoggedIn: boolean;
};

const LoyaltyCtx = createContext<Ctx>({
  client: null,
  config: null,
  modalOpen: false,
  setClient: () => {},
  openModal: () => {},
  closeModal: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function useLoyalty() {
  return useContext(LoyaltyCtx);
}

export default function LoyaltyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClientState] = useState<LoyaltyClient | null>(null);
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Restaurar sesión + cargar config al iniciar
  useEffect(() => {
    const sess = loadSession(60);
    if (sess) setClientState(sess.client);

    apiGetConfig().then((res) => {
      if (res.ok && res.config) setConfig(res.config);
    }).catch(() => {});
  }, []);

  const setClient = useCallback((c: LoyaltyClient | null) => {
    setClientState(c);
    if (c) saveSession(c);
    else clearSession();
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const logout = useCallback(() => {
    setClient(null);
    setModalOpen(false);
  }, [setClient]);

  const value = useMemo<Ctx>(
    () => ({
      client,
      config,
      modalOpen,
      setClient,
      openModal,
      closeModal,
      logout,
      isLoggedIn: !!client,
    }),
    [client, config, modalOpen, setClient, openModal, closeModal, logout],
  );

  return <LoyaltyCtx.Provider value={value}>{children}</LoyaltyCtx.Provider>;
}
