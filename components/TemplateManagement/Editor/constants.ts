export interface SampleData {
  participantName: string;
  participantEmail: string;
  eventName: string;
  organizerName: string;
  eventStartDate: string;
  eventEndDate: string;
  eventDateRange: string;
  certificateNumber: string;
  issueDate: string;
  qrCodeDataUrl: string;
  backgroundUrl: string;
}

export const SAMPLE_DATA: SampleData = {
  participantName: "Alex Carter",
  participantEmail: "alex@example.com",
  eventName: "Tech Innovation Summit 2026",
  organizerName: "E-Cell Global",
  eventStartDate: "2026-05-15",
  eventEndDate: "2026-05-17",
  eventDateRange: "15th - 17th May 2026",
  certificateNumber: "ECELL-2026-PREM1",
  issueDate: "30/04/2026",
  qrCodeDataUrl:
    "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PREMIUM-VERIFICATION-SAMPLE",
  backgroundUrl:
    "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop",
};
