"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  MapPin,
  Loader2,
  ArrowRight,
  LogOut,
  Star,
  Award,
  AlertCircle,
  Check,
  Gift,
  History as HistoryIcon,
  Lock,
  Copy,
  ChevronLeft,
} from "lucide-react";
import { useLoyalty } from "./LoyaltyProvider";
import Logo from "./Logo";
import {
  apiRegister,
  apiLogin,
  apiAccumulate,
  apiGetRewards,
  apiRedeem,
  apiGetHistory,
  haversineMeters,
  isDemoMode,
  type Reward,
  type HistoryItem,
} from "@/lib/loyalty";

type View =
  | "geo"
  | "login"
  | "register"
  | "dashboard"
  | "accumulate"
  | "rewards"
  | "history"
  | "redeemed"
  | "terms";

export default function LoyaltyModal() {
  const { modalOpen, closeModal, client, setClient, logout, config } = useLoyalty();
  const [view, setView] = useState<View>("geo");
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "checking" | "ok" | "denied" | "far" | "error"
  >("idle");
  const [geoDistance, setGeoDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Forms
  const [phone, setPhone] = useState("");
  const [regForm, setRegForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    acepto_terminos: false,
  });
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [awardedAnim, setAwardedAnim] = useState<number | null>(null);

  // Rewards / History
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemedInfo, setRedeemedInfo] = useState<{
    code: string;
    rewardName: string;
  } | null>(null);
  const [confirmRedeem, setConfirmRedeem] = useState<Reward | null>(null);

  // Reset cuando abre
  useEffect(() => {
    if (!modalOpen) return;
    setError(null);
    setToast(null);
    setOtp(["", "", "", "", "", ""]);
    setAwardedAnim(null);
    if (client) {
      setView("dashboard");
    } else {
      setView("geo");
      checkGeo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, client]);

  const checkGeo = useCallback(() => {
    setGeoStatus("checking");
    setError(null);
    if (!config) {
      // sin config, saltar (modo demo)
      setGeoStatus("ok");
      setView("login");
      return;
    }
    // En modo demo, radio ultra-grande salta GPS
    if (config.radio_metros > 100000) {
      setGeoStatus("ok");
      setView("login");
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          config.restaurante_lat,
          config.restaurante_lng,
        );
        setGeoDistance(d);
        if (d <= config.radio_metros) {
          setGeoStatus("ok");
          setView("login");
        } else {
          setGeoStatus("far");
        }
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [config]);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiLogin(phone);
      if (res.ok && res.client) {
        setClient(res.client);
        setView("dashboard");
      } else if (res.error === "not_found") {
        setError("No encontramos tu número. ¿Primera vez? Regístrate.");
      } else if (res.error === "blocked") {
        setError("Tu cuenta está bloqueada temporalmente. Intenta en 1 hora.");
      } else {
        setError("Error al iniciar sesión.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(`No se pudo conectar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regForm.acepto_terminos) {
      setError("Debes aceptar los términos para continuar.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRegister(regForm);
      if (res.ok && res.client) {
        setClient(res.client);
        setView("dashboard");
      } else {
        setError("Error al registrarte. Revisa los datos.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(`No se pudo conectar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      const arr = pasted.split("");
      setOtp(arr);
      otpRefs.current[5]?.focus();
    }
  };

  const handleAccumulate = async () => {
    if (!client) return;
    const pw = otp.join("");
    if (pw.length !== 6) {
      setError("Pide al mesero la contraseña del día.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiAccumulate(client.telefono, pw);
      if (res.ok && res.client) {
        setClient(res.client);
        setAwardedAnim(res.pointsAwarded ?? 50);
        setToast(`+${res.pointsAwarded ?? 50} pts acreditados`);
        setTimeout(() => {
          setView("dashboard");
          setAwardedAnim(null);
          setToast(null);
        }, 1800);
      } else if (res.error === "wrong_password") {
        setError("Contraseña incorrecta. Pídela al mesero.");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else if (res.error === "cooldown") {
        setError(`Ya acumulaste hoy. Espera ${res.hoursLeft}h.`);
      } else if (res.error === "blocked") {
        setError("Bloqueado por múltiples intentos. Espera 1 hora.");
      } else {
        setError("Error al acumular.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(`No se pudo conectar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const openRewards = async () => {
    setError(null);
    setView("rewards");
    if (!rewards) {
      setLoading(true);
      try {
        const res = await apiGetRewards();
        if (res.ok && res.rewards) setRewards(res.rewards);
        else setError("No se pudo cargar el catálogo de premios.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        setError(`No se pudo conectar: ${msg}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const openHistory = async () => {
    if (!client) return;
    setError(null);
    setView("history");
    setLoading(true);
    try {
      const res = await apiGetHistory(client.telefono, 20);
      if (res.ok && res.history) setHistory(res.history);
      else setHistory([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(`No se pudo conectar: ${msg}`);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!client) return;
    setRedeemingId(reward.id);
    setError(null);
    try {
      const res = await apiRedeem(client.telefono, reward.id);
      if (res.ok && res.code) {
        if (res.client) setClient(res.client);
        setRedeemedInfo({ code: res.code, rewardName: reward.nombre });
        setConfirmRedeem(null);
        setView("redeemed");
      } else if (res.error === "insufficient_points") {
        setError(`Te faltan ${(res.needed ?? 0) - (res.have ?? 0)} pts.`);
      } else {
        setError("No se pudo canjear. Intenta de nuevo.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(`No se pudo conectar: ${msg}`);
    } finally {
      setRedeemingId(null);
    }
  };

  if (!modalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-[var(--red)]/20 bg-black shadow-2xl sm:rounded-3xl"
        >
          <button
            onClick={closeModal}
            aria-label="Cerrar"
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Demo banner */}
          {isDemoMode() && (
            <div className="bg-[var(--red)]/20 px-4 py-2 text-center text-[10px] font-bold tracking-widest text-white uppercase">
              Modo demo · sin backend · cualquier OTP 6 dígitos sirve
            </div>
          )}

          {/* Logo header */}
          <div className="flex flex-col items-center px-6 pt-8 pb-4">
            <Logo
              variant="white"
              width={160}
              className="h-auto w-32 opacity-90"
            />
          </div>

          {/* Content */}
          <div className="px-6 pb-8">
            <AnimatePresence mode="wait">
              {view === "geo" && (
                <GeoView
                  key="geo"
                  status={geoStatus}
                  distance={geoDistance}
                  radio={config?.radio_metros}
                  onRetry={checkGeo}
                />
              )}

              {view === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Iniciar sesión
                    </h3>
                    <p className="mt-1 text-xs text-white/60">
                      Ingresa tu teléfono para acceder a tus puntos
                    </p>
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    placeholder="Tu número (ej. 0968429494)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--red)] focus:outline-none"
                  />
                  {error && <ErrorMsg msg={error} />}
                  <button
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-[var(--red-bright)] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Entrar <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="block w-full text-center text-xs text-white/60 underline underline-offset-4 hover:text-white"
                  >
                    ¿Primera vez? Regístrate
                  </button>
                </motion.form>
              )}

              {view === "register" && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleRegister}
                  className="space-y-3"
                >
                  <div className="text-center">
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Registrarse
                    </h3>
                    <p className="mt-1 text-xs text-white/60">
                      Crea tu cuenta y gana 50 puntos por visita
                    </p>
                  </div>
                  <input
                    required
                    placeholder="Nombre completo"
                    value={regForm.nombre}
                    onChange={(e) =>
                      setRegForm({ ...regForm, nombre: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--red)] focus:outline-none"
                  />
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    placeholder="Teléfono"
                    value={regForm.telefono}
                    onChange={(e) =>
                      setRegForm({ ...regForm, telefono: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--red)] focus:outline-none"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Correo electrónico"
                    value={regForm.email}
                    onChange={(e) =>
                      setRegForm({ ...regForm, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--red)] focus:outline-none"
                  />
                  <label className="flex items-start gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      required
                      checked={regForm.acepto_terminos}
                      onChange={(e) =>
                        setRegForm({
                          ...regForm,
                          acepto_terminos: e.target.checked,
                        })
                      }
                      className="mt-0.5 h-4 w-4 accent-[var(--red)]"
                    />
                    <span>
                      Acepto los{" "}
                      <button
                        type="button"
                        onClick={() => setView("terms")}
                        className="text-[var(--red-bright)] underline underline-offset-2"
                      >
                        términos y condiciones
                      </button>
                    </span>
                  </label>
                  {error && <ErrorMsg msg={error} />}
                  <button
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-[var(--red-bright)] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Registrarme"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="block w-full text-center text-xs text-white/60 underline underline-offset-4 hover:text-white"
                  >
                    Ya tengo cuenta
                  </button>
                </motion.form>
              )}

              {view === "dashboard" && client && (
                <DashboardView
                  key="dashboard"
                  client={client}
                  config={config}
                  onAccumulate={() => {
                    setError(null);
                    setOtp(["", "", "", "", "", ""]);
                    setView("accumulate");
                    setTimeout(() => otpRefs.current[0]?.focus(), 100);
                  }}
                  onRewards={openRewards}
                  onHistory={openHistory}
                  onLogout={logout}
                />
              )}

              {view === "rewards" && client && (
                <RewardsView
                  key="rewards"
                  rewards={rewards}
                  loading={loading}
                  client={client}
                  redeemingId={redeemingId}
                  confirmRedeem={confirmRedeem}
                  onConfirm={(r) => setConfirmRedeem(r)}
                  onCancelConfirm={() => setConfirmRedeem(null)}
                  onRedeem={handleRedeem}
                  onBack={() => setView("dashboard")}
                  error={error}
                />
              )}

              {view === "history" && (
                <HistoryView
                  key="history"
                  history={history}
                  loading={loading}
                  onBack={() => setView("dashboard")}
                />
              )}

              {view === "redeemed" && redeemedInfo && (
                <RedeemedView
                  key="redeemed"
                  code={redeemedInfo.code}
                  rewardName={redeemedInfo.rewardName}
                  onDone={() => {
                    setRedeemedInfo(null);
                    setView("dashboard");
                  }}
                />
              )}

              {view === "accumulate" && (
                <motion.div
                  key="accumulate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Acumular puntos
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      Pide al mesero la <strong>contraseña del día</strong> e
                      ingrésala aquí.
                    </p>
                  </div>

                  <div
                    onPaste={handleOtpPaste}
                    className="flex justify-center gap-2"
                  >
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-13 w-10 rounded-xl border border-white/20 bg-white/5 text-center font-mono text-xl font-bold text-white focus:border-[var(--red)] focus:outline-none sm:h-14 sm:w-11"
                      />
                    ))}
                  </div>

                  {error && <ErrorMsg msg={error} />}

                  <button
                    onClick={handleAccumulate}
                    disabled={loading}
                    className="w-full rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-[var(--red-bright)] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      "Validar y acreditar"
                    )}
                  </button>
                  <button
                    onClick={() => setView("dashboard")}
                    className="block w-full text-center text-xs text-white/50 underline underline-offset-4 hover:text-white"
                  >
                    Volver
                  </button>
                </motion.div>
              )}

              {view === "terms" && (
                <motion.div
                  key="terms"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-serif text-xl font-bold text-white">
                    Términos y condiciones
                  </h3>
                  <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/75">
                    <p className="mb-3 font-bold text-white">
                      Política de tratamiento de datos personales
                    </p>
                    <p className="mb-3">
                      Al registrarte aceptas que{" "}
                      <strong>Corte Piedra</strong> recopile y almacene tu
                      nombre, teléfono y correo electrónico.
                    </p>
                    <p className="mb-3">
                      <strong>Uso:</strong> tus datos se usarán solamente para
                      el registro de puntos y envío de promociones del
                      restaurante.
                    </p>
                    <p className="mb-3">
                      <strong>Confidencialidad:</strong> tu información es
                      privada. No será compartida, vendida ni cedida a terceros.
                    </p>
                    <p className="mb-3">
                      <strong>Derechos:</strong> puedes solicitar la
                      modificación o eliminación de tus datos contactando al
                      restaurante.
                    </p>
                    <p>
                      <strong>Seguridad:</strong> el acceso está restringido al
                      personal autorizado.
                    </p>
                  </div>
                  <button
                    onClick={() => setView("register")}
                    className="w-full rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase"
                  >
                    Entendido
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toast / puntos acreditados animación */}
          <AnimatePresence>
            {awardedAnim !== null && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], y: -120, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center"
              >
                <span className="font-serif text-6xl font-black text-[var(--red-bright)] drop-shadow-[0_0_20px_rgba(var(--red-rgb),0.6)]">
                  +{awardedAnim}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {toast && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute inset-x-0 bottom-20 mx-auto flex w-max items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white"
            >
              <Check className="h-4 w-4" />
              {toast}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────

function GeoView({
  status,
  distance,
  radio,
  onRetry,
}: {
  status: string;
  distance: number | null;
  radio?: number;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 py-4 text-center"
    >
      <motion.div
        animate={
          status === "checking"
            ? { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }
            : {}
        }
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--red)]/15"
      >
        <MapPin className="h-7 w-7 text-[var(--red)]" />
      </motion.div>
      <h3 className="font-serif text-xl font-bold text-white">
        {status === "checking" && "Verificando ubicación…"}
        {status === "ok" && "¡Estás en Corte Piedra!"}
        {status === "far" && "Estás fuera del restaurante"}
        {status === "denied" && "Permiso denegado"}
        {status === "error" && "No pudimos obtener tu ubicación"}
      </h3>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
        {status === "checking" && (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Necesitamos tu ubicación para validar que estás en el local.
          </span>
        )}
        {status === "far" && distance !== null && (
          <>
            Estás a <strong>{Math.round(distance)} m</strong> del restaurante.
            Debes estar a menos de <strong>{radio} m</strong> para sumar puntos.
          </>
        )}
        {status === "denied" && (
          <>
            Activa los permisos de ubicación en tu navegador y vuelve a
            intentar.
          </>
        )}
        {status === "error" && (
          <>No se pudo acceder al GPS. Revisa los permisos del navegador.</>
        )}
      </div>
      {(status === "far" || status === "denied" || status === "error") && (
        <button
          onClick={onRetry}
          className="w-full rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase"
        >
          Intentar de nuevo
        </button>
      )}
    </motion.div>
  );
}

function DashboardView({
  client,
  config,
  onAccumulate,
  onRewards,
  onHistory,
  onLogout,
}: {
  client: {
    nombre: string;
    puntos_actuales: number;
    puntos_totales_historicos: number;
    nivel: "Bronce" | "Plata" | "Oro";
  };
  config: {
    puntos_por_visita: number;
    cooldown_horas: number;
    nivel_plata_min: number;
    nivel_oro_min: number;
  } | null;
  onAccumulate: () => void;
  onRewards: () => void;
  onHistory: () => void;
  onLogout: () => void;
}) {
  const gradient =
    client.nivel === "Oro"
      ? "from-[#b8873f] via-[#e8c87a] to-[#a67c00]"
      : client.nivel === "Plata"
        ? "from-[#e5e5e5] via-[#f5f5f5] to-[#9ca3af]"
        : "from-[#c8202e] via-[#8b1621] to-[#0a0a0a]";

  // Progreso al siguiente nivel
  const total = client.puntos_totales_historicos;
  const plata = config?.nivel_plata_min ?? 500;
  const oro = config?.nivel_oro_min ?? 1500;
  let nextLevel: string | null = null;
  let toNext = 0;
  let progressPct = 100;
  if (client.nivel === "Bronce") {
    nextLevel = "Plata";
    toNext = Math.max(0, plata - total);
    progressPct = Math.min(100, (total / plata) * 100);
  } else if (client.nivel === "Plata") {
    nextLevel = "Oro";
    toNext = Math.max(0, oro - total);
    progressPct = Math.min(100, ((total - plata) / (oro - plata)) * 100);
  }

  const ptsVisita = config?.puntos_por_visita ?? 50;
  const cooldown = config?.cooldown_horas ?? 24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Wallet card */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-xl`}
      >
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/30 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold tracking-[0.3em] text-white/80 uppercase">
            Nivel {client.nivel}
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-white">
            {client.nombre}
          </h3>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-serif text-5xl font-black text-white">
              {client.puntos_actuales}
            </span>
            <span className="text-sm font-bold tracking-widest text-white/80 uppercase">
              pts
            </span>
          </div>
          <p className="mt-1 text-xs text-white/70">
            Acumulados históricos: {client.puntos_totales_historicos} pts
          </p>

          {/* Progreso al siguiente nivel */}
          {nextLevel && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold tracking-widest text-white/80 uppercase">
                <span>Hacia {nextLevel}</span>
                <span>Faltan {toNext} pts</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-white/90"
                />
              </div>
            </div>
          )}
          {!nextLevel && (
            <p className="mt-3 text-[10px] font-bold tracking-widest text-white/80 uppercase">
              ★ Nivel máximo alcanzado
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onAccumulate}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-[var(--red-bright)]"
      >
        <Star className="h-4 w-4 fill-current" />
        Acumular puntos de esta visita
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRewards}
          className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-white/10"
        >
          <Gift className="h-5 w-5 text-[var(--red-bright)]" />
          Premios
        </button>
        <button
          onClick={onHistory}
          className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-white/10"
        >
          <HistoryIcon className="h-5 w-5 text-[var(--red-bright)]" />
          Historial
        </button>
      </div>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-xs font-bold tracking-widest text-white/70 uppercase hover:bg-white/5"
      >
        <LogOut className="h-3 w-3" />
        Cerrar sesión
      </button>

      <p className="text-center text-[10px] text-white/40">
        Acumulas {ptsVisita} pts por visita · Cooldown {cooldown} h
      </p>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Vista: Catálogo de premios
// ──────────────────────────────────────────────────────────

function RewardsView({
  rewards,
  loading,
  client,
  redeemingId,
  confirmRedeem,
  onConfirm,
  onCancelConfirm,
  onRedeem,
  onBack,
  error,
}: {
  rewards: Reward[] | null;
  loading: boolean;
  client: { puntos_actuales: number };
  redeemingId: string | null;
  confirmRedeem: Reward | null;
  onConfirm: (r: Reward) => void;
  onCancelConfirm: () => void;
  onRedeem: (r: Reward) => void;
  onBack: () => void;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          aria-label="Volver"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center">
          <h3 className="font-serif text-xl font-bold text-white">Premios</h3>
          <p className="text-[10px] text-white/60">
            Tienes <strong className="text-white">{client.puntos_actuales}</strong> pts
          </p>
        </div>
        <div className="w-8" />
      </div>

      {loading && !rewards && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        </div>
      )}

      {error && <ErrorMsg msg={error} />}

      {rewards && rewards.length === 0 && (
        <p className="py-8 text-center text-sm text-white/60">
          No hay premios disponibles por ahora.
        </p>
      )}

      {rewards && rewards.length > 0 && (
        <div className="space-y-3">
          {rewards
            .slice()
            .sort((a, b) => a.costo_pts - b.costo_pts)
            .map((r) => {
              const unlocked = client.puntos_actuales >= r.costo_pts;
              const faltan = r.costo_pts - client.puntos_actuales;
              const pct = Math.min(
                100,
                (client.puntos_actuales / r.costo_pts) * 100,
              );
              return (
                <div
                  key={r.id}
                  className={`overflow-hidden rounded-2xl border p-4 transition-all ${
                    unlocked
                      ? "border-[var(--red)]/40 bg-gradient-to-br from-[var(--red)]/15 to-transparent"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {unlocked ? (
                          <Gift className="h-4 w-4 text-[var(--red-bright)]" />
                        ) : (
                          <Lock className="h-4 w-4 text-white/40" />
                        )}
                        <h4 className="font-serif text-base font-bold text-white">
                          {r.nombre}
                        </h4>
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        {r.descripcion}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-lg font-black text-white">
                        {r.costo_pts}
                      </p>
                      <p className="text-[9px] font-bold tracking-widest text-white/50 uppercase">
                        pts
                      </p>
                    </div>
                  </div>

                  {!unlocked && (
                    <div className="mt-3">
                      <div className="mb-1 text-[10px] text-white/50">
                        Te faltan {faltan} pts
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-[var(--red)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {unlocked && confirmRedeem?.id !== r.id && (
                    <button
                      onClick={() => onConfirm(r)}
                      disabled={!!redeemingId}
                      className="mt-3 w-full rounded-full bg-[var(--red)] px-4 py-2 text-xs font-bold tracking-widest text-white uppercase hover:bg-[var(--red-bright)] disabled:opacity-50"
                    >
                      Canjear
                    </button>
                  )}

                  {unlocked && confirmRedeem?.id === r.id && (
                    <div className="mt-3 space-y-2">
                      <p className="text-center text-xs text-white/80">
                        ¿Confirmar canje? Se descontarán{" "}
                        <strong>{r.costo_pts} pts</strong>.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={onCancelConfirm}
                          disabled={redeemingId === r.id}
                          className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-bold tracking-widest text-white/80 uppercase hover:bg-white/5 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => onRedeem(r)}
                          disabled={redeemingId === r.id}
                          className="flex-1 rounded-full bg-[var(--red)] px-4 py-2 text-xs font-bold tracking-widest text-white uppercase hover:bg-[var(--red-bright)] disabled:opacity-50"
                        >
                          {redeemingId === r.id ? (
                            <Loader2 className="mx-auto h-3 w-3 animate-spin" />
                          ) : (
                            "Confirmar"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Vista: Historial
// ──────────────────────────────────────────────────────────

function HistoryView({
  history,
  loading,
  onBack,
}: {
  history: HistoryItem[] | null;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          aria-label="Volver"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="flex-1 text-center font-serif text-xl font-bold text-white">
          Historial
        </h3>
        <div className="w-8" />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        </div>
      )}

      {!loading && history && history.length === 0 && (
        <p className="py-8 text-center text-sm text-white/60">
          Aún no tienes movimientos.
        </p>
      )}

      {!loading && history && history.length > 0 && (
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {history.map((h, i) => {
            const positive = h.puntos > 0;
            const date = new Date(h.fecha);
            const dateStr = date.toLocaleDateString("es-EC", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      positive
                        ? "bg-green-500/15 text-green-400"
                        : "bg-[var(--red)]/15 text-[var(--red-bright)]"
                    }`}
                  >
                    {positive ? (
                      <Star className="h-4 w-4" />
                    ) : (
                      <Gift className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">
                      {h.descripcion}
                    </p>
                    <p className="text-[10px] text-white/50">{dateStr}</p>
                  </div>
                </div>
                <p
                  className={`font-mono text-sm font-bold ${
                    positive ? "text-green-400" : "text-[var(--red-bright)]"
                  }`}
                >
                  {positive ? "+" : ""}
                  {h.puntos}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────
// Vista: Confirmación de canje (código)
// ──────────────────────────────────────────────────────────

function RedeemedView({
  code,
  rewardName,
  onDone,
}: {
  code: string;
  rewardName: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-5 py-2 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15"
      >
        <Check className="h-8 w-8 text-green-400" />
      </motion.div>
      <div>
        <h3 className="font-serif text-xl font-bold text-white">
          ¡Canje exitoso!
        </h3>
        <p className="mt-1 text-sm text-white/70">{rewardName}</p>
      </div>

      <div className="rounded-2xl border border-[var(--red)]/40 bg-gradient-to-br from-[var(--red)]/15 to-transparent p-5">
        <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">
          Muestra este código al mesero
        </p>
        <p className="mt-2 font-mono text-3xl font-black tracking-[0.4em] text-white">
          {code}
        </p>
        <button
          onClick={copy}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase hover:bg-white/20"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copiado" : "Copiar código"}
        </button>
      </div>

      <p className="text-[10px] text-white/50">
        El mesero verificará tu código y aplicará el premio.
      </p>

      <button
        onClick={onDone}
        className="w-full rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase hover:bg-[var(--red-bright)]"
      >
        Volver al dashboard
      </button>
    </motion.div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {msg}
    </p>
  );
}
