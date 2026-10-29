import { Reference } from "@/types/references";

export const transformReferenceData = (references: Reference[]) => {
  return references.map((r) => ({
    "Reference Number": r.referenceNumber,
    Name: r.name,
    Email: r.email,
    Mobile: r.mobile,
    Address: r.address,
    Points: r.points,
    "Redeemed Points": r.redeemedPoints,
    Status: r.status,
    Remarks: r.remarks ?? "",
  }));
};
