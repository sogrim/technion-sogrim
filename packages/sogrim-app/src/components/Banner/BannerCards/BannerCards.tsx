import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { DegreeMainStatus } from "./DegreeMainStatus";
import { DegreeMainStats } from "./DegreeMainStats";
import { useStore } from "../../../hooks/useStore";
import { UserPermissions } from "../../../types/data-types";
import { AdminBanner } from "./AdminBanner";

const BannerCardsComp: React.FC = () => {
  const {
    uiStore: { permissionMode },
  } = useStore();

  return (
    <Box sx={{ display: "flex", gap: 3 }}>
      {permissionMode !== UserPermissions.Student ? <AdminBanner /> : null}
      <DegreeMainStatus />
      <DegreeMainStats />
    </Box>
  );
};

export const BannerCards = observer(BannerCardsComp);
