import { Typography } from "@mui/material";

const BuildVersion = () => {
  const version = process.env.REACT_APP_BUILD_VERSION ?? "dev";
  return <Typography component="footer" aria-label="Build version" variant="caption"
    sx={{ textAlign: "right", color: "text.secondary", fontSize: "0.625rem", px: 2, py: 0.5, overflowWrap: "anywhere" }}>
    v{version}
  </Typography>;
};

export default BuildVersion;
