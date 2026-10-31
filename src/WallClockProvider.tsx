import { ReactNode } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

dayjs.extend(utc);
// Planner clocks are resolved with Intl after editing. Parse in UTC so the
// browser's own DST rules cannot discard or normalize the entered wall clock.
class WallClockAdapter extends AdapterDayjs {
  parse = (value: string, format: string) =>
    value === ""
      ? null
      : (dayjs.utc as typeof dayjs)(value, format, this.locale, true);
}
const WallClockProvider = ({ children }: { children: ReactNode }) => (
  <LocalizationProvider dateAdapter={WallClockAdapter}>
    {children}
  </LocalizationProvider>
);
export default WallClockProvider;
