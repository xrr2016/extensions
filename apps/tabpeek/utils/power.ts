import { clampSettings, type PowerMode, type TabPeekSettings } from "@/utils/storage";

/** How much of TabPeek's own work is given up to save power. */
export type PowerLevel = "off" | "on" | "max";

export interface PowerState {
  level: PowerLevel;
  /**
   * Skip animations: the user asked for it (settings), the OS did
   * (`prefers-reduced-motion`), or the heaviest power level did. One flag for
   * all three — the UI should not care who asked.
   */
  reduceMotion: boolean;
}

/** Initial/fallback state: nothing reduced, for before the first reading. */
export const IDLE_POWER_STATE: PowerState = { level: "off", reduceMotion: false };

/** Minimal shape of the Battery Status API (absent in some builds / on http). */
interface BatteryLike {
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/**
 * `auto` follows the battery: unplugged means "on". Every other mode is literal,
 * so "off" really means "never reduce", even on battery.
 */
export function resolvePowerState(
  mode: PowerMode,
  onBattery: boolean,
  reduceMotion: boolean,
): PowerState {
  const level = mode === "auto" ? (onBattery ? "on" : "off") : mode;
  // `max` gives up every decorative animation as well, so it implies
  // reduce-motion on its own; callers only read the flag, never the reason.
  return { level, reduceMotion: reduceMotion || level === "max" };
}

function motionQuery(): MediaQueryList | null {
  return typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
}

/**
 * Calls `onChange` with the resolved power state now, and again whenever the
 * battery starts/stops charging or the OS motion preference changes. Returns a
 * disposer.
 *
 * The state is only ever a ceiling: it never enables anything the settings have
 * off, it only takes work away.
 */
export function watchPower(
  getSettings: () => TabPeekSettings,
  onChange: (state: PowerState) => void,
): () => void {
  const query = motionQuery();
  let battery: BatteryLike | null = null;
  let disposed = false;

  const emit = () => {
    if (disposed) return;
    const s = clampSettings(getSettings());
    onChange(
      resolvePowerState(
        s.powerSaver,
        battery?.charging === false,
        s.reduceMotion || (query?.matches ?? false),
      ),
    );
  };

  const onChargingChange = () => emit();

  const getBattery = (navigator as Navigator & { getBattery?: () => Promise<BatteryLike> })
    .getBattery;
  if (typeof getBattery === "function") {
    getBattery
      .call(navigator)
      // A missing/rejected Battery API means "assume mains": `auto` then never
      // reduces anything, which is the safe reading of an unknown state.
      .then((b) => {
        if (disposed) return;
        battery = b;
        b.addEventListener("chargingchange", onChargingChange);
        emit();
      })
      .catch(() => {});
  }
  query?.addEventListener("change", emit);
  emit();

  return () => {
    disposed = true;
    query?.removeEventListener("change", emit);
    battery?.removeEventListener("chargingchange", onChargingChange);
    battery = null;
  };
}
