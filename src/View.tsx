import { Box } from "@mui/material";

import MushCalcRadio from "./MushCalcRadio";

const View = () => (
  <Box
    sx={{
      width: { xs: "100%", md: "680px" },
      maxWidth: { md: "680px" },
      flexGrow: 1,
    }}
  >
    <MushCalcRadio />
  </Box>
);

export default View;
