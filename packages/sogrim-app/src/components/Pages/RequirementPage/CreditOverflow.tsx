import { Box, Divider, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import useUserState from "../../../hooks/apiHooks/useUserState";
import { MessagesAccordion } from "./MessagesAccordion";

interface CreditOverflowProps {}

const error = "פסילה: ";
const warning = "אזהרה: ";

const CreditOverflowComp: React.FC<CreditOverflowProps> = () => {
  const { data: userState } = useUserState();

  const messages: string[] =
    userState?.details?.degree_status?.overflow_msgs.filter(
      (ovm) => !ovm.match(error) && !ovm.match(warning)
    ) || [];

  return messages.length > 0 ? (
    <MessagesAccordion
      name="הודעות חשובות"
      tooltipMsg="כאן מופיעות הודעות שכדאי לשים לב אליהן, כגון הודעות על מעברי
    נקודות בין דרישות, הודעה על כמות נקודות עודפות וכו'"
      Messages={() => (
        <>
          {messages.map((ovm, id) => (
            <Box key={id} sx={{ padding: 0.5 }}>
              <Typography> {ovm} </Typography>
              <Divider />
            </Box>
          ))}
        </>
      )}
    />
  ) : (
    <></>
  );
};

export const CreditOverflow = observer(CreditOverflowComp);
