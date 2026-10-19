export type DevconProof =
  /** Apple Wallet pass: only the signed manifest (file hashes) and Apple signature leave the device. */
  | { method: "pkpass"; manifest: string; signature: string }
  /**
   * Google Wallet save link: verified in the browser; only a SHA-256 of the ticket ID is sent,
   * plus the link itself when the admin turned on server-side checking.
   */
  | { method: "gwallet"; fingerprint: string; jwt?: string };

export type DevconPublicPolicy = {
  enabled: boolean;
  percentOff: number;
  /** Gas is sponsored when the Devcon discount makes the name free. */
  sponsorGas: boolean;
  acceptPkpass: boolean;
  acceptGoogle: boolean;
  /** When true the browser also sends the Google Wallet link so the server can re-check it. */
  googleServerVerify: boolean;
  googleIssuers: string[];
  passTypeIds: string[];
  teamIds: string[];
  minSigningTime: number;
};
