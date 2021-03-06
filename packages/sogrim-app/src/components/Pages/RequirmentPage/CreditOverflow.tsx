import React from "react";
import { observer } from "mobx-react-lite";
import useUserState from "../../../hooks/apiHooks/useUserState";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import InfoTwoToneIcon from "@mui/icons-material/InfoTwoTone";

interface CreditOverflowProps {}

const CreditOverflowComp: React.FC<CreditOverflowProps> = () => {
  const { data: userState } = useUserState();

  const overflowMsg: string[] =
    userState?.details?.degree_status?.overflow_msgs || [];

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
          aria-controls="overflow-collaps"
          id="overflow-collaps"
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={"bold"}>
              הודעות חשובות
            </Typography>
            <Tooltip
              title={
                <Typography>
                  כאן מופיעות הודעות שכדאי לשים לב אליהן, כגון הודעות על מעברי
                  נקודות בין דרישות, הודעה על כמות נקודות עודפות וכו'
                </Typography>
              }
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
          {overflowMsg.map((ovm, id) => (
            <Box key={id} sx={{ padding: 0.5 }}>
              <Typography> {ovm} </Typography>
              <Divider />
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export const CreditOverflow = observer(CreditOverflowComp);
