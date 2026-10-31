import { Button } from "@mui/material";
import ActionFeedback from "./ActionFeedback";

const PlannerChangeFeedback = ({
  message,
  month,
  onViewMonth,
  onUndo,
  onDismiss,
  noticeKey,
}: {
  message: string;
  month?: string;
  onViewMonth: (month: string) => void;
  onUndo: () => void;
  onDismiss: () => void;
  noticeKey: number;
}) => (
  <ActionFeedback
    message={message}
    onClose={onDismiss}
    noticeKey={noticeKey}
    action={<>
      <Button size="small" onClick={onUndo}>
        Undo
      </Button>
      {month && (
        <Button size="small" onClick={() => onViewMonth(month)}>
          View{" "}
          {new Intl.DateTimeFormat(undefined, {
            timeZone: "UTC",
            month: "long",
          }).format(new Date(`${month}-01T12:00:00Z`))}
        </Button>
      )}
    </>}
  />
);
export default PlannerChangeFeedback;
