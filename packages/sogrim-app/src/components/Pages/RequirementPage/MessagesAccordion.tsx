import { ExpandMore } from "@mui/icons-material";
import InfoTwoToneIcon from "@mui/icons-material/InfoTwoTone";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";

interface MessagesAccordionProps {
  name: string;
  tooltipMsg: string;
  Messages: React.FC;
}

const MessagesAccordionComp: React.FC<MessagesAccordionProps> = ({
  name,
  tooltipMsg,
  Messages,
}) => {
  return (
    <div>
      <Accordion
        defaultExpanded
        sx={{
          minWidth: 400,
          p: 1,
          borderRadius: 2,
          border: "2px solid #d1d1d1",
          boxShadow: 0,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="overflow-collapse"
          id="overflow-collapse"
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={"bold"}>
              {name}
            </Typography>
            <Tooltip
              title={<Typography>{tooltipMsg}</Typography>}
              placement="bottom"
              arrow
            >
              <IconButton>
                <InfoTwoToneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Messages />
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export const MessagesAccordion = observer(MessagesAccordionComp);
