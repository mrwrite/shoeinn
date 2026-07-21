import React from "react";
import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from "react-native";

export type LogoLayout = "horizontal" | "symbol";
export type LogoTone = "brand" | "light" | "black";

interface LogoProps {
  layout?: LogoLayout;
  tone?: LogoTone;
  size?: number;
  decorative?: boolean;
  style?: StyleProp<ImageStyle>;
}

const sources: Record<LogoLayout, Record<LogoTone, ImageSourcePropType>> = {
  horizontal: {
    brand: require("../../../assets/brand/skruhb-logo-deep.png"),
    light: require("../../../assets/brand/skruhb-logo-white.png"),
    black: require("../../../assets/brand/skruhb-logo-black.png"),
  },
  symbol: {
    brand: require("../../../assets/brand/skruhb-symbol-brand.png"),
    light: require("../../../assets/brand/skruhb-symbol-white.png"),
    black: require("../../../assets/brand/skruhb-symbol-black.png"),
  },
};

const HORIZONTAL_ASPECT_RATIO = 345 / 140;

export function Logo({
  layout = "horizontal",
  tone = "brand",
  size = layout === "horizontal" ? 42 : 44,
  decorative = false,
  style,
}: LogoProps) {
  const width = layout === "horizontal" ? size * HORIZONTAL_ASPECT_RATIO : size;

  return (
    <Image
      source={sources[layout][tone]}
      resizeMode="contain"
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : "Skruhb"}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={[{ width, height: size }, style]}
    />
  );
}

export default Logo;
