import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Gulp - AI Assistant Platform";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#16171B",
          backgroundImage: "linear-gradient(to bottom, #16171B, #1a1b20)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <img
            src="https://saas.nbarkiya.xyz/logo/full-logo-text-white.png"
            alt="Gulp Logo"
            style={{
              height: 120,
              width: "auto",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: "bold",
                color: "#F7CE45",
                textAlign: "center",
              }}
            >
              Embed Intelligent Chatbots
            </div>
            <div
              style={{
                fontSize: 48,
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              on Your Website
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#ffffff80",
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Powered by your own documents, PDFs, and URLs
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

