// Calculator form geometry is the reference for every editing surface.
export const pairedFieldGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 2,
} as const;

export const countdownGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
  gap: 1.5,
} as const;
