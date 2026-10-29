import React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { CompanyDetails } from "@/types/settings";
import { formatDate } from "@/utils/dateUtils";

const styles = StyleSheet.create({
  headerWrapper: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 15,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  companyLogoSection: {
    flexDirection: "row",
    gap: 10,
    width: "65%",
  },
  logo: {
    width: 70,
    height: 70,
    objectFit: "contain",
  },
  companyInfo: {
    flexDirection: "column",
    justifyContent: "center",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  companySubText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.2,
  },
  invoiceMetaBox: {
    width: "30%",
    textAlign: "right",
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  metaText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  addressCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    padding: 4,
    marginBottom: 6,
    textTransform: "uppercase",
    textAlign: "center",
    borderRadius: 2,
  },
  clientName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 3,
  },
  clientInfo: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  gstLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 5,
    color: "#111827",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 3,
  },
});

interface HeaderProps {
  companyData: CompanyDetails;
  customerData: {
    name: string;
    email: string;
    mobile: string;
    address?: string;
    gstNumber?: string;
    shippingName?: string;
    shippingEmail?: string;
    shippingMobile?: string;
    shippingAddress?: string;
    shippingGst?: string;
    poNumber?: string;
    poDate?: string;
    vehicleNo?: string;
  };
  invoiceNo?: string;
  date?: string;
}

const Header: React.FC<HeaderProps> = ({
  companyData,
  customerData,
  invoiceNo,
  date,
}) => {
  const isValidLogo =
    typeof companyData.logoUrl === "string" &&
    companyData.logoUrl.trim().length > 10;

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.topSection}>
        <View style={styles.companyLogoSection}>
          {isValidLogo ? (
            <Image src={companyData.logoUrl} style={styles.logo} />
          ) : (
            <View
              style={[
                styles.logo,
                {
                  backgroundColor: "#eee",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                {companyData.name?.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyData.name}</Text>
            <Text style={styles.companySubText}>{companyData.address}</Text>
            <Text style={styles.companySubText}>
              GSTIN: {companyData.gstNumber || "N/A"}
            </Text>
            <Text style={styles.companySubText}>
              PAN: {companyData.panNumber || "N/A"}
            </Text>
            <Text style={styles.companySubText}>
              Email: {companyData.email} | Mob: {companyData.mobile}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceMetaBox}>
          <Text style={styles.invoiceTitle}>Invoice</Text>
          <Text style={styles.metaText}>No: {invoiceNo}</Text>
          <Text style={styles.metaText}>
            Date: {date ? formatDate(date) : "N/A"}
          </Text>
          <Text style={styles.metaText}>
            PO Number: {customerData.poNumber || "N/A"}
          </Text>

          <Text style={styles.metaText}>
            PO Date:{" "}
            {customerData.poDate ? formatDate(customerData.poDate) : "N/A"}
          </Text>

          <Text style={styles.metaText}>
            Vehicle: {customerData.vehicleNo || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.addressCard}>
          <Text style={styles.sectionHeader}>Billing Details</Text>
          <Text style={styles.clientName}>
            Name: {customerData.name || "N/A"}
          </Text>
          <Text style={styles.clientInfo}>
            Mob: {customerData.mobile || "N/A"}
          </Text>
          <Text style={styles.clientInfo}>
            Email: {customerData.email || "N/A"}
          </Text>
          <Text style={styles.clientInfo}>
            Address: {customerData.address || "N/A"}
          </Text>
          <Text style={styles.gstLabel}>
            GSTIN: {customerData.gstNumber || "N/A"}
          </Text>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.sectionHeader}>Shipping Details</Text>
          <Text style={styles.clientName}>
            Name: {customerData.shippingName || "N/A"}
          </Text>
          <Text style={styles.clientInfo}>
            Mob: {customerData.shippingMobile || "N/A"}
          </Text>
          <Text style={styles.clientInfo}>
            Email: {customerData.shippingEmail || "N/A"}
          </Text>
          <Text style={styles.clientInfo}>
            Address: {customerData.shippingAddress || "N/A"}
          </Text>
          <Text style={styles.gstLabel}>
            GSTIN: {customerData.shippingGst || "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Header;
