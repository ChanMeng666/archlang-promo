import { Config } from "@remotion/cli/config";

// PNG frames: JPEG frames make ffmpeg tag the master full-range (yuvj420p), which some players wash out
Config.setVideoImageFormat("png");
Config.setConcurrency(4);

// The compiler is isomorphic, but it carries lazy, Node-only export backends (PNG via
// @resvg/resvg-js, PDF via pdfkit, angled geometry via clipper2-wasm) that never run in
// a browser. The playground's own vite.config.js externalises the same three for the
// same reason. `url: false` stops webpack treating the PNG backend's
// `new URL("../../assets/fonts/" + file, import.meta.url)` as an asset to bundle.
Config.overrideWebpackConfig((config) => ({
  ...config,
  externals: [
    ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
    ({ request }: { request?: string }, callback: (err?: null, result?: string) => void) => {
      if (request && (/^node:/.test(request) || ["@resvg/resvg-js", "pdfkit", "clipper2-wasm"].includes(request))) return callback(null, "var {}");
      callback();
    },
  ],
  module: {
    ...config.module,
    // scoped to the compiler: css-loader's own `new URL()` font references must still resolve
    rules: [...(config.module?.rules ?? []), { test: /@chanmeng666[\\/]archlang[\\/]dist[\\/].*\.js$/, parser: { url: false } }],
  },
}));
