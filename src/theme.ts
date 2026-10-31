import { createTheme } from "@mui/material/styles";

const appTheme = createTheme({
  palette: { mode: "dark" },
  typography: { button: { textTransform: "none" } },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: { minHeight: 44 },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: { minWidth: 44, minHeight: 44 },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: { minHeight: 48, fontSize: "1rem" },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: {
            borderRadius: 0,
            boxShadow: "none",
          },
        }),
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down("sm")]: {
            paddingTop: 24,
            "& .MuiCardHeader-title": { fontSize: "1.375rem", fontWeight: 600 },
            "& .MuiCardHeader-action": { marginTop: -4, marginRight: -4 },
          },
        }),
      },
    },
  },
});

export default appTheme;
