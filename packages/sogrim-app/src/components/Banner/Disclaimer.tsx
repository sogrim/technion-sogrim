import { Card, CardContent, Typography } from "@mui/material";
import WarningTwoToneIcon from "@mui/icons-material/WarningTwoTone";

const Disclaimer: React.FC = () => {
  return (
    <Card
      sx={{
        maxWidth: "400px",
        marginTop: 5,
        marginBottom: 20,
        alignSelf: "center",
      }}
    >
      <CardContent>
        <WarningTwoToneIcon />
        <Typography>
          <b>דיסקליימר קצר</b>: אנחנו לא הטכניון. המידע המוצג באפליקציה אינו
          מהווה תחליף למידע רשמי של הטכניון, והמילה האחרונה בדבר סגירת התואר היא
          של רכזות ההסמכה. עם זאת, ראוי לציין כי אנחנו עובדים בשיתוף פעולה מלא
          עם הרכזות.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default Disclaimer;
