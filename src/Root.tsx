import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/public-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/400-italic.css";
import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { FPS } from "./motion";
import { TOTAL_FRAMES } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="ArchLang-Promo" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
