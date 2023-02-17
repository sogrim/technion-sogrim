import React from "react";
import { Box, Link, Theme } from "@mui/material";

const catalogsLinks = [
  {
    link: "https://ugportal.technion.ac.il/קטלוג-לימודים-תשף-2019-20/",
    year: "תש”ף 2019/20",
  },
  {
    link: "https://ugportal.technion.ac.il/קטלוג-לימודים-שנה-נוכחית/",
    year: "תשפ”א 2020/21",
  },
  {
    link: "https://ugportal.technion.ac.il/קטלוג-לימודים-תשפב-2021-22/",
    year: "תשפ”ב 2021/22",
  },
  {
    link: "https://ugportal.technion.ac.il/קטלוג-לימודים-תשפג-2022-23/",
    year: "תשפ”ג 2022/23",
  },
];

export const CatalogsLinks = () => {
  return (
    <Box
      sx={{
        m: "10px",
        display: "flex",
        justifyContent: "space-around",
        gap: "40px",
      }}
    >
      {catalogsLinks.map((catalogs) => (
        <Link
          key={catalogs.year}
          color={(theme: Theme) => theme.palette.secondary.main}
          href={catalogs.link}
          underline="hover"
          target="_blank"
          rel="noopener"
        >
          {`${catalogs.year}`}
        </Link>
      ))}
    </Box>
  );
};
