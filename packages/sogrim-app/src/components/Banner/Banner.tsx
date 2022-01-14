import { Box, styled } from "@mui/system";
import { observer } from "mobx-react-lite";
import { useAuth } from "../../hooks/useAuth";
import { BannerAnonymous } from "./BannerAnonymous";
import { BannerCards } from "./BannerCards/BannerCards";

const BannerComp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={sxBanner}>
      <StyledBox>
        {isAuthenticated ? (
          <>
            <BannerCards />
          </>
        ) : (
          <BannerAnonymous />
        )}
      </StyledBox>
    </Box>
  );
};

export const Banner = observer(BannerComp);

const sxBanner = {
  width: "100%",
  height: 300,
  backgroundColor: "primary.dark",
  display: "flex",
  justifyContent: "center",
};

const StyledBox = styled(Box)(({ theme }) => ({
  width: "60%",
  height: 300,
  marginTop: "100px",
  display: "flex",
  justifyContent: "space-around",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));
