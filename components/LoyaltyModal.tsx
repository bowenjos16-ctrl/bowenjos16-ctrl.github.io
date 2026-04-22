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
} from "lucide-react";
import { useLoyalty } from "./LoyaltyProvider";
import Logo from "./Logo";
import {
  apiRegister,
  apiLogin,
  apiAccumulate,
  haversineMeters,
  isDemoMode,
} from "@/lib/loyalty";

type View =
  | "geo"
  | "login"
  | "register"
  | "dashboard"
  | "accumulate"
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
    } catch {
      setError("No se pudo conectar.");
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
    } catch {
      setError("No se pudo conectar.");
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
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setLoading(false);
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
                  onAccumulate={() => {
                    setError(null);
                    setOtp(["", "", "", "", "", ""]);
                    setView("accumulate");
                    setTimeout(() => otpRefs.current[0]?.focus(), 100);
                  }}
                  onLogout={logout}
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
  onAccumulate,
  onLogout,
}: {
  client: {
    nombre: string;
    puntos_actuales: number;
    puntos_totales_historicos: number;
    nivel: "Bronce" | "Plata" | "Oro";
  };
  onAccumulate: () => void;
  onLogout: () => void;
}) {
  const gradient =
    client.nivel === "Oro"
      ? "from-[#b8873f] via-[#e8c87a] to-[#a67c00]"
      : client.nivel === "Plata"
        ? "from-[#e5e5e5] via-[#f5f5f5] to-[#9ca3af]"
        : "from-[#c8202e] via-[#8b1621] to-[#0a0a0a]";

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
        </div>
      </div>

      <button
        onClick={onAccumulate}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--red)] px-6 py-3 text-sm font-bold tracking-widest text-white uppercase transition-colors hover:bg-[var(--red-bright)]"
      >
        <Star className="h-4 w-4 fill-current" />
        Acumular puntos de esta visita
      </button>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-xs font-bold tracking-widest text-white/70 uppercase hover:bg-white/5"
      >
        <LogOut className="h-3 w-3" />
        Cerrar sesión
      </button>

      <p className="text-center text-[10px] text-white/40">
        Acumulas {50} pts por visita · Cooldown 24 h
      </p>
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
