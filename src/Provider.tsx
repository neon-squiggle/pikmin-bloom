import { createContext, useContext } from "react";
import { useMushroomTries } from "./useMushroomTries";

const MushroomContext = createContext<ReturnType<
  typeof useMushroomTries
> | null>(null);

export function MushroomProvider({ children }: { children: JSX.Element }) {
  const value = useMushroomTries();
  return (
    <MushroomContext.Provider value={value}>
      {children}
    </MushroomContext.Provider>
  );
}

export function useSharedMushroomTries() {
  const ctx = useContext(MushroomContext);
  if (!ctx) throw new Error("Missing MushroomProvider");
  return ctx;
}
