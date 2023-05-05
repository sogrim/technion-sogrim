import { Box, styled } from "@mui/system";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import { UserRegistrationState } from "../../types/ui-types";
import { BannerCards } from "./BannerCards/BannerCards";
import { RegistrationBanner } from "./RegistrationBanner";

const BannerComp: React.FC = () => {
  const {
    uiStore: { userRegistrationState },
  } = useStore();

  return (
    <Box sx={sxBanner}>
      <StyledBox>
        {userRegistrationState === UserRegistrationState.Ready ? (
          <BannerCards />
        ) : (
          <RegistrationBanner />
        )}
      </StyledBox>
    </Box>
  );
};

export const Banner = observer(BannerComp);

const sxBanner = {
  width: "100%",
  height: 270,
  backgroundColor: "primary.dark",
  display: "flex",
  justifyContent: "center",
};

const StyledBox = styled(Box)(({ theme }) => ({
  marginTop: "100px",
  display: "flex",
  justifyContent: "space-around",
}));
