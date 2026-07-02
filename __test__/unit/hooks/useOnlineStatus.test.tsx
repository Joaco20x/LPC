/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
      writable: true,
    });
  });

  it("retorna true cuando hay conexión", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("retorna false cuando no hay conexión", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
      writable: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("cambia a false al disparar evento offline", () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
        writable: true,
      });
      globalThis.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });

  it("cambia a true al disparar evento online", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
      writable: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
        writable: true,
      });
      globalThis.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });
});
