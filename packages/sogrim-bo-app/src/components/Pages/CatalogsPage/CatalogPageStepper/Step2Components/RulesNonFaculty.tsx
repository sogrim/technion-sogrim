import { Box, TextField, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useStore } from "../../../../../hooks/useStore";

interface RulesNonFacultyProps {
  bankName: string;
  bankCredit: number;
  bankNonFacultyType: "sport" | "malag" | "elective";
}
const RulesNonFacultyComp: React.FC<RulesNonFacultyProps> = ({
  bankName,
  bankCredit,
  bankNonFacultyType,
}) => {
  const {
    dataStore: { editBankCredit },
  } = useStore();

  const handleCreditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    editBankCredit(+event.target.value, bankName);
  };

  const bankTitle =
    bankNonFacultyType === "sport"
      ? "חינוך גופני"
      : bankNonFacultyType === "elective"
      ? "בחירה חופשית"
      : bankNonFacultyType === "malag"
      ? "מלג"
      : "";
  const bankHelperContnet = `בנק זה הינו מסוג ${bankTitle}. כלומר, על הסטודנט להשלים את סך הנקודות הדרושות מהקורסים הרלוונטים`;
  const bankHelperContnetSub =
    bankNonFacultyType === "sport"
      ? "קורסי החינוך הגופני מתחילים בקידומית 394 במספר הקורס"
      : bankNonFacultyType === "elective"
      ? "קורסי הבחירה חופשית הם כל קורס באשר הוא"
      : bankNonFacultyType === "malag"
      ? "קורסי המל״ג הינם קורסים אשר מאושרים ע״י לימודים הומניסטיים. בסיס הנתונים הנ״ל אינו ניתן לעריכה מצד רכזות הסמכה."
      : "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mt: 1, mb: 4 }}>
      <Typography variant="h5"> {bankName} </Typography>
      <Box
        sx={{
          m: 1,
          alignSelf: "center",
          border: "1px solid #d1d1d1",
          borderRadius: 2,
          maxWidth: "80%",
          p: 1,
        }}
      >
        <Typography>{bankHelperContnet}</Typography>
        <Typography>{bankHelperContnetSub}</Typography>
      </Box>
      <TextField
        sx={{ m: 1, maxWidth: "85%", alignSelf: "center" }}
        type="tel"
        name="courses"
        required
        id="outlined-name"
        label="סך הנקודות הדרושות לבנק"
        value={bankCredit}
        onChange={handleCreditChange}
      />
    </Box>
  );
};

export const RulesNonFaculty = observer(RulesNonFacultyComp);
