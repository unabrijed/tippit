import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F4EF"
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: "9999px",
            background: "linear-gradient(180deg, rgba(44,74,62,0.12) 0%, rgba(44,74,62,0.32) 28%, #2C4A3E 100%)",
            border: "10px solid #2C4A3E",
            boxShadow: "inset 0 0 0 6px rgba(247,244,239,0.7)"
          }}
        />
      </div>
    ),
    size
  );
}
