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

  const setClient = useCallback((c: LoyaltyClient | null) => {
    setClientState(c);
    if (c) saveSession(c);
    else clearSession();
  }, []);

  // Restaurar sesión + cargar config al iniciar.
  // Después del restore desde localStorage, re-fetchea el cliente del backend
  // para sincronizar puntos/nivel (los puntos pueden haber cambiado por bonus
  // de IG/Google/juegos en otra pestaña o dispositivo).
  useEffect(() => {
    const sess = loadSession(60);
    if (sess) {
      setClientState(sess.client);
      // Sync en background con el spreadsheet
      apiGetClient(sess.client.telefono)
        .then((res) => {
          if (res.ok && res.client) setClient(res.client);
        })
        .catch(() => {});
    }

    apiGetConfig().then((res) => {
      if (res.ok && res.config) setConfig(res.config);
    }).catch(() => {});
  }, [setClient]);

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
