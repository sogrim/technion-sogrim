import {
  Backdrop,
  Box,
  Card,
  CardActions,
  CircularProgress,
  Link,
  Theme,
  Tooltip,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";

import useUpdateUserUgData from "../../../../hooks/apiHooks/useUpdateUgData";
import { useAuth } from "../../../../hooks/useAuth";
import { IntroStepCard } from "../IntroStepCard";
import { ErrorDuringImport } from "./ErrorDuringImport";
import { HowToImport } from "./HowToImport";

export interface ImportGradeSheetProps {
  handleNext: () => void;
  handleBack: () => void;
}

export const ImportGradeSheet: React.FC<ImportGradeSheetProps> = ({
  handleNext,
  handleBack,
}) => {
  const [ugText, setUgText] = useState<string | null>(null);
  const [backdropOpen, setBackdropOpen] = useState(false);
  const { userAuthToken } = useAuth();

  const { mutate, isError, isLoading, isSuccess } =
    useUpdateUserUgData(userAuthToken);

  useEffect(() => {
    if (isSuccess) {
      handleNext();
    }
  }, [isSuccess]);

  const handleChangeTextField = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setUgText(e.target.value);
  };
  const handleSend = () => {
    if (ugText) {
      setBackdropOpen(true);
      mutate(ugText);
    }
  };

  return (
    <IntroStepCard>
      <HowToImport />
      <TextField
        autoFocus
        fullWidth
        margin="dense"
        error={isError}
        helperText={isError ? <ErrorDuringImport /> : null}
        id="outlined-multiline-static"
        label="העתק לכאן את גיליון הציונים"
        multiline
        rows={4}
        placeholder="הכנס לגיליון הציונים ב-student, והעתק את כולו לכאן."
        onChange={handleChangeTextField}
      />

      <CardActions
        sx={{ display: "flex", flexDirection: "right", m: 1, gap: 1 }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Tooltip
            arrow
            title={
              <Typography>
                דלגו על ייבוא גליון הציונים והזינו את הקורסים שלכם ידנית
              </Typography>
            }
          >
            <Button variant="outlined" color="info" onClick={handleNext}>
              דלג
            </Button>
          </Tooltip>
        </Box>
        <Button
          size="large"
          onClick={handleSend}
          variant="contained"
          sx={{ mt: 1, msScrollLimitXMin: 1 }}
        >
          יבא קורסים
        </Button>
        {isLoading && (
          <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={backdropOpen}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        )}
      </CardActions>
    </IntroStepCard>
  );
};
