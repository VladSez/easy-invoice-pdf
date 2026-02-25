import { Image, Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";

interface InvoiceQRCodeProps {
  qrCodeDataUrl: string;
  description?: string;
}

export function InvoiceQRCode({
  qrCodeDataUrl,
  description,
}: InvoiceQRCodeProps) {
  return (
    <View
      style={{
        marginTop: 30,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 10, // prevent overlapping with the fixed footer
      }}
      wrap={false}
      minPresenceAhead={30}
    >
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={qrCodeDataUrl} style={{ width: 120, height: 120 }} />
      {description ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 8,
            textAlign: "center",
            maxWidth: 150,
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}
