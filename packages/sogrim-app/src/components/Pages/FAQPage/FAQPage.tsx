import { Box, Typography } from "@mui/material";
import React from "react";
import { faqs } from "./faq";
import { FAQItem } from "./FAQItem";

export const FAQPage: React.FC = () => {
  return (
    <Box sx={sxPages}>
      <Box>
        <Typography sx={{ marginBottom: 2 }} variant="h4">
          {" "}
          שאלות ותשובות{" "}
        </Typography>
        {faqs.map((faq, index) => (
          <FAQItem key={index} faqItem={faq} />
        ))}
      </Box>
    </Box>
  );
};

const sxPages = {
  width: "100%",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
};
