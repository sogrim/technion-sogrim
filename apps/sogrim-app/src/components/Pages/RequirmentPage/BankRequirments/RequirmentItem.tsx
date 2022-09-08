import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import {
  ACCUMULATE_COURSES,
  CourseBankReq,
} from "../../../../types/data-types";
import { Box, CardActionArea, Chip, CircularProgress } from "@mui/material";
export interface RequirmentItemProps {
  bankRequirment: CourseBankReq;
}

export const RequirmentItem: React.FC<RequirmentItemProps> = ({
  bankRequirment,
}) => {
  const {
    course_bank_name,
    credit_completed,
    credit_requirement,
    course_completed,
    course_requirement,
    bank_rule_name,
  } = bankRequirment;

  const progress =
    bank_rule_name === ACCUMULATE_COURSES
      ? (course_completed / course_requirement) * 100
      : (credit_completed / credit_requirement) * 100;
  const subtitle =
    bank_rule_name === ACCUMULATE_COURSES
      ? `השלמת ${course_completed} מתוך ${course_requirement} קורסים`
      : `השלמת ${credit_completed} מתוך ${credit_requirement} נק״ז`; // TODO: add done/not done , types

  const ProgressCircular: React.FC<{ value: number }> = ({ value }) => {
    // Export to FC & typing
    return (
      <>
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
            mr: "8px",
          }}
        >
          <CircularProgress
            color={"secondary"}
            variant="determinate"
            value={value}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
            >{`${Math.round(value)}%`}</Typography>
          </Box>
        </Box>
      </>
    );
  };

  return (
    <Card sx={{ minWidth: 350, maxWidth: 450, margin: 1 }}>
      <CardActionArea>
        <CardHeader
          avatar={<ProgressCircular value={progress} />}
          title={
            <Typography component={"span"}> {course_bank_name} </Typography>
          }
          subheader={subtitle}
        />
        <CardActions
          disableSpacing
          sx={{
            display: "flex",
            justifyContent: "space-between",
            paddingRight: "25px",
          }}
        >
          {progress >= 100 ? (
            <Chip label="בוצע" color="success" variant="outlined" />
          ) : (
            <Chip label="בתהליך" color="info" variant="outlined" />
          )}
        </CardActions>
      </CardActionArea>
    </Card>
  );
};
