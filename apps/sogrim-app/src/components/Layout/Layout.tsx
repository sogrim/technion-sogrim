import { Box, styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import { PageState } from "../../types/ui-types";
import { AppPages } from "../AppPages/AppPages";
import { Banner } from "../Banner/Banner";
import { Header } from "../Header/Header";
import { FAQPage } from "../Pages/FAQPage/FAQPage";
import { ModifiedToast } from "../Toasts/ModifiedToast";

const LayoutComp: React.FC = () => {
  const {
    uiStore: { currentPage },
  } = useStore();
  return (
    <>
      <Box>
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
      </Box>
    </>
  );
};

const ContentWrapper = styled("div")`
  display: flex;
`;

export const Layout = observer(LayoutComp);
