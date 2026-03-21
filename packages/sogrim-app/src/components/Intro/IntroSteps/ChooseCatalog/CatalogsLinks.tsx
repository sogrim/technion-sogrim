import React from "react";
import { Box, Link, Theme } from "@mui/material";

export const catalogsLinks = [
  {
    link: "https://cs.technion.ac.il/he/undergraduate/programs/catalogs/cs_catalog_hebrew2021-2022.pdf",
    year: "תשפ”ב 2021/22",
  },
  {
    link: "https://cs.technion.ac.il/he/undergraduate/programs/catalogs/cs_catalog_2022_2023.pdf",
    year: "תשפ”ג 2022/23",
  },
  {
    link: "https://undergraduate.cs.technion.ac.il/wp-content/uploads/2023/12/23-%D7%9E%D7%93%D7%A2%D7%99-%D7%94%D7%9E%D7%97%D7%A9%D7%91-%D7%AA%D7%A9%D7%A4%D7%B4%D7%93.pdf",
    year: "תשפ”ד 2023/24",
  },
  {
    link: "https://undergraduate.cs.technion.ac.il/wp-content/uploads/2024/12/23-%D7%94%D7%A4%D7%A7%D7%95%D7%9C%D7%98%D7%94-%D7%9C%D7%9E%D7%93%D7%A2%D7%99-%D7%94%D7%9E%D7%97%D7%A9%D7%91-%D7%AA%D7%A9%D7%A4%D7%B4%D7%94-.pdf",
    year: "תשפ”ה 2024/25",
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
