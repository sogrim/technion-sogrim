import { Card } from "@mui/material";
import React from "react";

export const IntroStepCard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Card
      component={"span"}
      sx={{
        width: "450px",
        minHeight: "250px",
        padding: "25px",
        p: 1,
        borderRadius: 2,
        border: "2px solid #d1d1d1",
        boxShadow: 0,
        gap: "20px",
      }}
    >
      {children}
    </Card>
  );
};
