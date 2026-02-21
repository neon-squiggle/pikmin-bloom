import { Box, Select, MenuItem, IconButton, ListSubheader } from "@mui/material";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

interface MonthOption {
  key: string;
  label: string;
}

interface MonthSelectorProps {
  months: MonthOption[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  allExpanded: boolean;
  onToggleAll: () => void;
}

const MonthSelector = ({
  months,
  selectedMonth,
  onMonthChange,
  allExpanded,
  onToggleAll,
}: MonthSelectorProps) => (
  <ListSubheader
    sx={{
      p: 0,
      bgcolor: "background.paper",
      backgroundImage:
        "linear-gradient(rgba(255, 255, 255, 0.051), rgba(255, 255, 255, 0.051))",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1,
        py: 0.25,
      }}
    >
      <Select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        sx={{ flex: 1 }}
      >
        {months.map(({ key, label }) => (
          <MenuItem key={key} value={key}>
            {label}
          </MenuItem>
        ))}
      </Select>
      <IconButton onClick={onToggleAll} size="small">
        {allExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
      </IconButton>
    </Box>
  </ListSubheader>
);

export default MonthSelector;
