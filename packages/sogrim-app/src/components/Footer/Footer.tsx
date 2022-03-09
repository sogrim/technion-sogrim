import GitHubIcon from "@mui/icons-material/GitHub";
import InfoIcon from "@mui/icons-material/Info";
import { AppBar, Box, ButtonBase, Link, Typography } from "@mui/material";
import { useState } from "react";
import { version } from "../../../package.json";
import { ChangesDialog } from "./ChangesDialog";

export const Footer: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{
        top: "auto",
        justifyContent: "center",
        bottom: 0,
        minHeight: "35px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Typography>מוגש בחום ואהבה מצוות סוגרים 🤓</Typography>
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            alignItems: "center",
          }}
        >
          <Link
            href="https://github.com/sogrim/technion-sogrim"
            underline="hover"
            target="_blank"
            rel="noopener"
            color="white"
          >
            <Typography>Github </Typography>
          </Link>
          <GitHubIcon sx={{ height: "18px", width: "18px" }} />
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            alignItems: "center",
          }}
        >
          <Link
            href="https://docs.google.com/forms/d/e/1FAIpQLSe7GbkAkIdTgJ3QkGmJMHhkIpjWz_I0ZX608FlxVLeT0cyJJQ/viewform?usp=sf_link"
            underline="hover"
            target="_blank"
            rel="noopener"
            color="white"
          >
            <Typography> בעיות והצעות - פנו אלינו</Typography>
          </Link>
          <InfoIcon sx={{ height: "18px", width: "18px" }} />
        </Box>
        <ButtonBase
          sx={{
            display: "flex",
            justifySelf: "flex-end",
            justifyContent: "flex-end",
            alignSelf: "flex-end",
            position: "absolute",
            right: 0,
            marginRight: "3px",
            marginBottom: "-6px",
          }}
          onClick={handleClickOpen}
        >
          <Typography fontSize="small">{`v${version}`}</Typography>
        </ButtonBase>
        {open && <ChangesDialog {...{ open, setOpen }} />}
      </Box>
    </AppBar>
  );
};
