import type { MetadataRoute } from "next";

const baseUrl = "https://living-substance-simulation.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/`,
      lastModified: "2026-05-07",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: "2026-05-07",
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: "2026-05-07",
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: "2026-05-07",
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}