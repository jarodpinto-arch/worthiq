import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/security", "/privacy", "/terms"],
      disallow: ["/dashboard", "/connect", "/settings", "/transactions", "/api/"],
    },
    sitemap: "https://worthiq.io/sitemap.xml",
  };
}
