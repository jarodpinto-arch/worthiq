import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WorthIQ — Master Your Capital with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000000 0%, #0a0c10 50%, #0d1117 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 700,
            height: 500,
            background: "radial-gradient(ellipse, rgba(70,194,233,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: -4,
            color: "#ffffff",
            display: "flex",
            alignItems: "baseline",
            gap: 0,
            marginBottom: 20,
          }}
        >
          <span>Worth</span>
          <span style={{ color: "#46c2e9" }}>IQ</span>
          <span style={{ fontSize: 20, color: "#64748b", fontWeight: 700, marginLeft: 4, marginBottom: 40 }}>™</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: -0.5,
            marginBottom: 40,
          }}
        >
          Master Your Capital with AI
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Bank-Linked Insights", "Sage AI", "Net Worth Tracking"].map((f) => (
            <div
              key={f}
              style={{
                background: "rgba(70,194,233,0.08)",
                border: "1px solid rgba(70,194,233,0.2)",
                borderRadius: 100,
                padding: "8px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "#46c2e9",
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 16,
            fontWeight: 600,
            color: "#475569",
            letterSpacing: 1,
          }}
        >
          worthiq.io
        </div>
      </div>
    ),
    { ...size }
  );
}
