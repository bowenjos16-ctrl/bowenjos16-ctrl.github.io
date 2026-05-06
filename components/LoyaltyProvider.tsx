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
  apiGetClient,
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
  refreshClient: () => Promise<void>;
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
  refreshClient: async () => {},
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

  // Re-fetch del cliente desde el backend para sincronizar puntos/nivel.
  // Se llama tras acreditar puntos por bonus (IG, Google, juegos).
  const refreshClient = useCallback(async () => {
    if (!client) return;
    try {
      const res = await apiGetClient(client.telefono);
      if (res.ok && res.client) setClient(res.client);
    } catch (err) {
      console.warn("[loyalty] refreshClient failed:", err);
    }
  }, [client, setClient]);

  const value = useMemo<Ctx>(
    () => ({
      client,
      config,
      modalOpen,
      setClient,
      openModal,
      closeModal,
      logout,
      refreshClient,
      isLoggedIn: !!client,
    }),
    [client, config, modalOpen, setClient, openModal, closeModal, logout, refreshClient],
  );

  return <LoyaltyCtx.Provider value={value}>{children}</LoyaltyCtx.Provider>;
}
