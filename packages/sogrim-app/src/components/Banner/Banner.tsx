import { Typography } from "@mui/material";
import { Box, styled } from "@mui/system";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import { UserRegistrationState } from "../../types/ui-types";
import { BannerCards } from "./BannerCards/BannerCards";

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
          <Box
            sx={{
              display: "flex",
              textAlign: "center",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <Typography variant="h3" color="white">
              פה סוגרים את התואר!
            </Typography>
            <Typography variant="h5" color="white">
              בחרו קטלוג, ייבאו קורסים ואז תגלו - כמה עוד?!
            </Typography>
          </Box>
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
