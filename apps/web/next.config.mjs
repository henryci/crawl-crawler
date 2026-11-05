import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
}

// Blog posts live in content/blog as MDX. Plugins are named as strings so
// the config stays serialisable and works under Turbopack as well as webpack.
// remark-gfm adds tables, strikethrough and autolinks.
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
  },
});

export default withMDX(nextConfig)
