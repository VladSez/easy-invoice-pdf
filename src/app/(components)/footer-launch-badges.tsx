/**
 * FooterLaunchBadges
 * Renders launch/featured badges in footer: Startup Fame, LaunchPanda, Tiny Startups, etc.
 */
export function FooterLaunchBadges() {
  return (
    <>
      {/* Badge for featured on Startup Fame */}
      <a
        href="https://startupfa.me/s/easyinvoicepdf?utm_source=easyinvoicepdf.com"
        target="_blank"
      >
        <img
          src="https://startupfa.me/badges/featured/light-rounded.webp"
          alt="EasyInvoicePDF - Featured on Startup Fame"
          width="171"
          height="54"
        />
      </a>

      {/* Badge for Launched on LaunchPanda */}
      <a
        href="https://launchpanda.dev/launches/productivity/easyinvoicepdf"
        target="_blank"
        rel="noopener"
      >
        <img
          src="https://launchpanda.dev/images/badges/launchpanda-badge.svg"
          alt="Launched on LaunchPanda"
          width="260"
          height="64"
        />
      </a>

      {/* Badge for Verified DR */}
      <a
        href="https://verifieddr.com/website/easyinvoicepdf-com"
        target="_blank"
      >
        <img
          src="https://verifieddr.com/badge/easyinvoicepdf-com.svg?metric=truedr"
          alt="Verified DR - Verified Domain Rating for easyinvoicepdf.com"
          width="220"
          height="68"
        />
      </a>

      {/* Badge for Featured on Nick Launches */}
      <a
        href="https://nicklaunches.com/products/easyinvoicepdf/?utm_source=easyinvoicepdf.com&utm_medium=badge&utm_campaign=featured"
        target="_blank"
        rel="noopener"
      >
        <img
          src="https://nicklaunches.com/badges/featured.png"
          alt="EasyInvoicePDF on Nick Launches"
          width="244"
          height="56"
        />
      </a>

      {/* Badge for Featured on Huzzler */}
      <a
        href="https://huzzler.so/products/WoT22LdqV0/easyinvoicepdf?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          alt="Huzzler Embed Badge"
          src="https://huzzler.so/assets/images/embeddable-badges/featured.png"
          width="159"
          height="55"
        />
      </a>

      {/* Badge for Featured on EasyLaunch */}
      <a
        href="https://easylaunch.dev/finance/easyinvoicepdf"
        target="_blank"
        rel="noopener"
      >
        <img
          src="https://easylaunch.dev/badge/easylaunch-badge-light.svg"
          alt="Featured on EasyLaunch"
          width="188"
          height="56"
        />
      </a>

      {/* Badge for Featured on EasyDoFollow */}
      <a
        href="https://easydofollow.dev/finance/easyinvoicepdf"
        target="_blank"
        rel="noopener"
      >
        <img
          src="https://easydofollow.dev/badge/easydofollow-badge-light.svg"
          alt="Featured on EasyDoFollow"
          width="188"
          height="56"
        />
      </a>

      {/* Badge for Launched on Tiny Startups */}
      <a
        href="https://www.tinystartups.com/startup/easyinvoicepdf"
        target="_blank"
        rel="noopener"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 22px 14px 18px",
          borderRadius: 14,
          textDecoration: "none",
          fontFamily: "'Inter',system-ui,sans-serif",
          background:
            "linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#3525E6,#D81FE0,#22B8F0) border-box",
          border: "2px solid transparent",
          color: "#0E0B1F",
        }}
      >
        <svg width="56" height="56" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="tsg" x1=".1" y1="0" x2=".9" y2="1">
              <stop offset="0%" stopColor="#3525E6" />
              <stop offset="55%" stopColor="#D81FE0" />
              <stop offset="100%" stopColor="#22B8F0" />
            </linearGradient>
          </defs>
          <path
            d="M50 6C52 32 68 48 94 50C68 52 52 68 50 94C48 68 32 52 6 50C32 48 48 32 50 6Z"
            fill="url(#tsg)"
          />
        </svg>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            lineHeight: 1.15,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 0.18,
              textTransform: "uppercase",
              color: "#6A6585",
            }}
          >
            Launched on
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.025,
            }}
          >
            Tiny Startups
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#6A6585",
              marginTop: 4,
            }}
          >
            tinystartups.com
          </span>
        </span>
      </a>
    </>
  );
}
