// Ambient (no top-level imports) so it merges with @types/mdx's "*.mdx" module.
declare module "*.mdx" {
  /** Every blog post exports its front matter as `meta`. */
  export const meta: import("./content/blog/types").PostMeta;
}
