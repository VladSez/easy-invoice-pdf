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
        marginTop: 75,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={qrCodeDataUrl} style={{ width: 90, height: 90 }} />
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
