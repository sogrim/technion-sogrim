import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { ReactComponent as LandingPageSvg } from "../../assets/splashpage.svg";
import { useStore } from "../../hooks/useStore";
import { PageState } from "../../types/ui-types";
import { BannerAnonymous } from "../Banner/BannerAnonymous";
import { FAQPage } from "../Pages/FAQPage/FAQPage";
const AnonymousAppComp: React.FC = () => {
  const {
    uiStore: { currentPage },
  } = useStore();
  return (
    <>
      <BannerAnonymous />
      {currentPage === PageState.FAQ ? (
        <FAQPage />
      ) : (
        <Box sx={{ m: 2, display: "flex", justifyContent: "center" }}>
          <LandingPageSvg />
        </Box>
      )}
    </>
  );
};

export const AnonymousApp = observer(AnonymousAppComp);
