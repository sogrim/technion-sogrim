import { Card, CardContent, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useStore } from "../../../hooks/useStore";

const AdminBannerComp: React.FC = () => {
  const {
    dataStore: {},
  } = useStore();

  return (
    <Card sx={{ minWidth: 375, maxHeight: 150 }}>
      <CardContent>
        <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
          API for Admins here
        </Typography>
        <Typography sx={{ fontSize: 18 }} color="text.primary"></Typography>
        <Typography sx={{ fontSize: 18 }} color="text.primary">
          "sdfdsf"
        </Typography>
      </CardContent>
    </Card>
  );
};

export const AdminBanner = observer(AdminBannerComp);
