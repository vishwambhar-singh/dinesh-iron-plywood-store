import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  termsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    marginTop: 10,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  termsText: {
    fontSize: 7,
    color: "#6b7280",
    lineHeight: 1.4,
    marginBottom: 1,
  },
  pageNumber: {
    position: "absolute",
    bottom: -30,
    right: 0,
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface FooterProps {
  terms?: string;
}

const Footer: React.FC<FooterProps> = ({ terms }) => {
  const termsArray =
    typeof terms === "string"
      ? terms.split("\n").filter((line: string) => line.trim() !== "")
      : [];

  const defaultTerms = [
    "Goods once sold will not be taken back or exchanged.",
    "Please check material at the time of delivery.",
    "All disputes are subject to local jurisdiction only.",
    "Computer generated invoice, signature not required.",
  ];

  const displayTerms = termsArray.length > 0 ? termsArray : defaultTerms;

  return (
    <>
      <View style={styles.termsContainer}>
        <Text style={styles.termsTitle}>Terms & Conditions:</Text>
        {displayTerms.map((term, index) => {
          const startsWithNumber = /^\d+[\.\)]\s*/.test(term.trim());

          return (
            <Text key={index} style={styles.termsText}>
              {startsWithNumber ? term.trim() : `${index + 1}. ${term.trim()}`}
            </Text>
          );
        })}
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
        fixed
      />
    </>
  );
};

export default Footer;
