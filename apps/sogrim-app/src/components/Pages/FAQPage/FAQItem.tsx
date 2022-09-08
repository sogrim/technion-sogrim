import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { FAQ } from "./faq";

interface FAQItemProps {
  faqItem: FAQ;
}

export const FAQItem: React.FC<FAQItemProps> = ({ faqItem }) => {
  return (
    <Accordion sx={{ width: 700 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="req-row-collaps"
        id="req-row-collaps"
      >
        <Typography fontWeight={"bold"}>{faqItem.title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography> {faqItem.content} </Typography>
      </AccordionDetails>
    </Accordion>
  );
};
