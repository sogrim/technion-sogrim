import { styled, Box } from "@mui/material";
import { Header } from "../Header/Header";
import { Banner } from "../Banner/Banner";

import { FOOTER_HEIGHT } from "../../themes/constants";
import { AppPages } from "../AppPages/AppPages";
import { ModifiedToast } from "../Toasts/ModifiedToast";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import { PageState } from "../../types/ui-types";
import { FAQPage } from "../Pages/FAQPage/FAQPage";

const LayoutComp: React.FC = () => {
  const {
    uiStore: { currentPage },
  } = useStore();
  return (
    <LayoutWrapper>
      <ContentWrapper>
        <Box component="header">
          <Header />
        </Box>
        <Banner />
      </ContentWrapper>
      {currentPage === PageState.Main ? (
        <AppPages />
      ) : (
        currentPage === PageState.FAQ && <FAQPage />
      )}

      <ModifiedToast />
      {/* {<Footer />} */}
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled("div")`
  min-height: 0vh;
`;

const ContentWrapper = styled("div")`
  display: flex;
  min-height: calc(30vh - ${FOOTER_HEIGHT}px);
`;

export const Layout = observer(LayoutComp);
