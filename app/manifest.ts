import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Train to be fit",
    short_name: "Train",
    description: "Simple offline-first strength training tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#ff7a1b",
  };
}
