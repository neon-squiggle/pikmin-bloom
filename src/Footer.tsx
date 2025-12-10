import React from "react";
import { Divider, Typography, Box } from "@mui/material";

const Footer = () => {
  return (
    <Box>
      <Divider />
      <Typography variant="caption" gutterBottom>
        * All numbers are rounded up
      </Typography>
    </Box>
  );
};

export default Footer;
