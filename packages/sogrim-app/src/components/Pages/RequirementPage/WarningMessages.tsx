import { Box, Divider, Typography, useTheme } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import useUserState from "../../../hooks/apiHooks/useUserState";
import { MessagesAccordion } from "./MessagesAccordion";

interface WarningMessagesProps {}

const strikeRe = "פסילה: ";
const warningRe = "אזהרה: ";

const WarningMessagesComp: React.FC<WarningMessagesProps> = () => {
  const { data: userState } = useUserState();
  const theme = useTheme();

  const messages: string[] =
    userState?.details?.degree_status?.overflow_msgs.filter(
      (ovm) => ovm.match(strikeRe) || ovm.match(warningRe)
    ) || [];

  return messages.length > 0 ? (
    <MessagesAccordion
      name="אזהרות"
      tooltipMsg="כאן מופיעות הודעות אזהרה על אי עמידה בתנאי הקטלוג האקדמי"
      Messages={() => (
        <>
          {messages.map((ovm, id) => (
            <Box key={id} sx={{ padding: 0.5 }}>
              {ovm.match(strikeRe) ? (
                <Typography color="error">
                  {ovm.replace(strikeRe, "")}
                </Typography>
              ) : (
                <Typography color={theme.palette.warning.main}>
                  {ovm.replace(warningRe, "")}
                </Typography>
              )}
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

export const WarningMessages = observer(WarningMessagesComp);
