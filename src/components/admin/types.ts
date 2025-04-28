
export type VendorStatus = "pending" | "approved" | "rejected";

export interface VendorLocation {
  city: string;
  zip_code: string;
}

export interface Vendor {
  id: string;
  business_name: string;
  business_category: string;
  status: VendorStatus;
  vendor_locations?: VendorLocation[];
}
