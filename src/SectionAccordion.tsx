import { ElementType, ReactNode, useId } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// MUI owns appearance and disclosure behavior; share the accessible wiring.
const SectionAccordion = ({
  title,
  children,
  headingLevel = "h2",
  ...props
}: Omit<AccordionProps, "title" | "children"> & {
  title: ReactNode;
  children: ReactNode;
  headingLevel?: ElementType;
}) => {
  const id = useId();
  return (
    <Accordion {...props} slotProps={{ heading: { component: headingLevel } }}>
      <AccordionSummary
        id={`${id}-header`}
        aria-controls={`${id}-content`}
        expandIcon={<ExpandMoreIcon />}
      >
        {typeof title === "string" ? (
          <Typography component="span" variant="body1">{title}</Typography>
        ) : title}
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};
export default SectionAccordion;
