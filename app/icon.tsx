import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
            width: 280,
            height: 280,
            borderRadius: "9999px",
            background: "linear-gradient(180deg, rgba(44,74,62,0.12) 0%, rgba(44,74,62,0.3) 28%, #2C4A3E 100%)",
            border: "16px solid #2C4A3E",
            boxShadow: "inset 0 0 0 10px rgba(247,244,239,0.7)"
          }}
        />
      </div>
    ),
    size
  );
}
