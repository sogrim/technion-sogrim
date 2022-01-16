import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { DegreeMainStatus } from "./DegreeMainStatus";
import { DegreeMainStats } from "./DegreeMainStats";

const BannerCardsComp: React.FC = () => {
  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      <DegreeMainStatus />
      <DegreeMainStats />
    </Box>
  );
};

export const BannerCards = observer(BannerCardsComp);
