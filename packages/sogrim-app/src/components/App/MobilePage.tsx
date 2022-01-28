import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import LandingPageSvg from "../../assets/splashpage.svg";
import { Footer } from "../Footer/Footer";

export const MobilePage: React.FC = () => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Card sx={{ m: 2, minWidth: 360 }}>
        <CardActionArea>
          <Box width={350}>
            <img
              src={LandingPageSvg}
              style={{ minWidth: "355px", height: "230px" }}
              alt={"sogrim-page"}
            />
          </Box>
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              סוגרים - עדיין לא במובייל{""} 😔
            </Typography>
            <Typography variant="body2" color="text.secondary">
              עצב גדול, המערכת שלנו עדיין לא מותאמת למובייל ורזולוציות נמוכות(יש
              הרבה טבלאות ועניינים, אתם בטח מבינים).
              <br />
              אבל מבטיחים שאנחנו עובדים על זה! מוזמנים להכנס מדפדפן בדסקטופ כדי
              לבדוק - מתי סוגרים את התואר?
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      <Footer />
    </Box>
  );
};
