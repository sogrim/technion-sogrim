import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Header } from "../Header/Header";
import { PagesTabs } from "../Pages/PagesTabs/PagesTabs";

const LayoutComp: React.FC = () => {
  return (
    <>
      <Box>
        <Header />
        <Box sx={{ marginTop: 10 }}>
          <PagesTabs />
        </Box>
        {/* <ModifiedToast /> */}
      </Box>
    </>
  );
};

export const Layout = observer(LayoutComp);
