import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../../../../hooks/useStore";
import { CourseBank, CreditOverFlows } from "../../../../types/data-types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const StepperP3Comp: React.FC = () => {
  const {
    dataStore: { currentCatalog },
  } = useStore();

  const [courseBanks, setCourseBanks] = useState<CourseBank[]>([]);
  const [overFlowList, setOverFlowList] = useState<CreditOverFlows[]>();

  const banksNamesOptions = useMemo(
    () => courseBanks.map((bank) => bank.name),
    [courseBanks]
  );

  useEffect(() => {
    if (
      currentCatalog &&
      currentCatalog.course_banks &&
      currentCatalog.course_banks.length > 0
    ) {
      setCourseBanks(currentCatalog.course_banks);
      setOverFlowList(currentCatalog.credit_overflows);
    }
  }, [currentCatalog]);

  const handleSelectFrom = (event: SelectChangeEvent, idx: number) => {
    const from = event.target.value as string;
    if (overFlowList) {
      const newOvf = [...overFlowList];
      newOvf[idx].from = from;
      setOverFlowList(newOvf);
    }
  };

  const handleSelectTo = (event: SelectChangeEvent, idx: number) => {
    const to = event.target.value as string;
    if (overFlowList) {
      const newOvf = [...overFlowList];
      newOvf[idx].to = to;
      setOverFlowList(newOvf);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        m: 2,
      }}
    >
      <Typography variant="h4"> מעבר נקודות </Typography>
      <Box
        sx={{
          m: 1,
          alignSelf: "center",
          border: "1px solid #d1d1d1",
          borderRadius: 2,
          maxWidth: "70%",
          p: 1,
        }}
      >
        <Typography>הגדירו את מעבר הנקודות בין דרישות</Typography>
        <Typography>
          במידה וסטודנט חרג מכמות הנקודות בבנק, הגדירו מעבר הנקודות העודפות לבנק
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",

          gap: 1,
          m: 1,
        }}
      >
        <Box>
          {banksNamesOptions.length > 0 &&
            currentCatalog?.credit_overflows &&
            currentCatalog?.credit_overflows.map((creditOverFlow, idx) => {
              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    gap: 2,
                    m: 1,
                    justifyItems: "baseline",
                  }}
                >
                  <Select
                    id="from"
                    name="from"
                    title="עובר מכאן"
                    onChange={(event) => handleSelectFrom(event, idx)}
                    value={creditOverFlow.from}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    {banksNamesOptions?.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  <ArrowBackIcon />
                  <Select
                    id="to"
                    title="עובר לכאן"
                    name="to"
                    onChange={(event) => handleSelectTo(event, idx)}
                    value={creditOverFlow.to}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    {banksNamesOptions?.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
};
export const StepperP3 = observer(StepperP3Comp);
