import React from "react";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { Text } from "../../components/ui/Text";
import { getServiceCategoryLabel } from "../../discovery/categoryMetadata";
import type { HomeStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

const SERVICE_HERO_IMAGES: Record<string, string> = {
  shoes: "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?auto=format&fit=crop&w=1600&q=85",
  laundry: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=1600&q=85",
  "dry-cleaning": "https://images.unsplash.com/photo-1594938291221-94f18cbb5660?auto=format&fit=crop&w=1600&q=85",
  "handbags-leather": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=85",
};

const BEFORE_AFTER_IMAGES: Record<string, [string, string][]> = {
  shoes: [
    [
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=75",
      "https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?auto=format&fit=crop&w=900&q=75",
    ],
    [
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=75",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=75",
    ],
  ],
};

const includedItems = ["Deep cleaning", "Sole whitening", "Leather conditioning", "Quality inspection"];

export default function ServiceDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "ServiceDetail">>();
  const { service } = route.params;
  const price = service.price_cents ? `$${Math.round(service.price_cents / 100)}` : "Quoted";
  const categoryLabel = getServiceCategoryLabel(service);
  const duration = formatDuration(service.duration_minutes);
  const providerName = "Sole Revival";

  return (
    <AppScreen
      scrollable
      contentContainerStyle={styles.container}
      stickyFooter={
        <Button
          label="Continue Booking"
          variant="gold"
          rightIcon={
            <View style={styles.ctaPrice}>
              <Text variant="button" weight="bold" color="#FFFFFF">
                {price}
              </Text>
              <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
            </View>
          }
          onPress={() => navigation.navigate("BookingDate", { service })}
        />
      }
    >
      <View style={styles.heroWrap}>
        <HeroImage categorySlug={service.category_slug} label={service.name} />
        <View style={styles.heroOverlay}>
          <View style={styles.heroTopBar}>
            <RoundIconButton icon="chevron-back" label="Go back" onPress={() => navigation.goBack()} />
            <View style={styles.heroActions}>
              <RoundIconButton icon="share-outline" label="Share service" onPress={() => undefined} />
              <RoundIconButton icon="heart-outline" label="Save service" onPress={() => undefined} />
            </View>
          </View>
        </View>
      </View>

      <Card variant="marketplace" style={styles.detailSheet}>
        <View style={styles.providerLine}>
          <Text variant="h2" weight="regular" color={theme.colors.primary}>
            {providerName}
          </Text>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.accentPressed} />
        </View>

        <Text variant="display" weight="regular" style={styles.title}>
          {service.name}
        </Text>

        <Text variant="body" color={theme.colors.textMuted} style={styles.description}>
          {service.description || "Our most comprehensive care service. We deep clean, restore, and protect your items to like-new condition."}
        </Text>

        <View style={styles.metaGrid}>
          <DetailMetric icon="pricetag-outline" label="Price" value={price} />
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.divider }]} />
          <DetailMetric icon="time-outline" label="Duration" value={duration} />
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.divider }]} />
          <DetailMetric icon="person-outline" label="Provider" value={providerName} />
        </View>

        <Card variant="outline" style={styles.includedCard}>
          <View style={styles.includedList}>
            <Text variant="h2" weight="regular" style={styles.sectionTitle}>
              What's Included
            </Text>
            {includedItems.map((item) => (
              <View key={item} style={styles.includedRow}>
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.accentPressed} />
                <Text variant="bodySmall" weight="medium">
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.guaranteeCard, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Ionicons name="shield-checkmark-outline" size={34} color={theme.colors.accentPressed} />
            <Text variant="h3" weight="regular">
              Satisfaction Guaranteed
            </Text>
            <Text variant="bodySmall" color={theme.colors.textMuted}>
              Not satisfied? We'll make it right.
            </Text>
          </View>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text variant="h2" weight="regular" style={styles.sectionTitle}>
            Customer Reviews
          </Text>
          <Text variant="bodySmall" weight="semibold" color={theme.colors.accentPressed}>
            View all
          </Text>
        </View>

        <View style={styles.reviewsRow}>
          <View style={styles.ratingSummary}>
            <Text variant="display" weight="regular" style={styles.ratingNumber}>
              4.9
            </Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons key={index} name="star" size={20} color={theme.colors.accentPressed} />
              ))}
            </View>
            <Text variant="bodySmall" color={theme.colors.textMuted}>
              (2,340 reviews)
            </Text>
          </View>

          <ReviewCard
            name="Marcus T."
            quote="Incredible results. My sneakers look better than when I first bought them."
          />
          <ReviewCard
            name="Jasmine L."
            quote="Fast, professional, and flawless every time."
          />
        </View>

        <Text variant="h2" weight="regular" style={styles.sectionTitle}>
          Before & After
        </Text>
        <View style={styles.beforeAfterRow}>
          {getBeforeAfterPairs(service.category_slug).map(([before, after], index) => (
            <BeforeAfterPair key={`${before}-${index}`} before={before} after={after} categorySlug={service.category_slug} />
          ))}
        </View>
      </Card>
    </AppScreen>
  );
}

function HeroImage({ categorySlug, label }: { categorySlug?: string | null; label: string }) {
  const [error, setError] = React.useState(false);
  if (error) {
    return <MediaPlaceholder categorySlug={categorySlug} label={label} style={styles.heroImage} />;
  }

  return (
    <ImageBackground
      source={{ uri: getHeroImage(categorySlug) }}
      resizeMode="cover"
      style={styles.heroImage}
      imageStyle={styles.heroImageRadius}
      onError={() => setError(true)}
    />
  );
}

function RoundIconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.roundIcon, theme.shadows.soft]}>
      <Ionicons name={icon} size={28} color={theme.colors.textPrimary} />
    </Pressable>
  );
}

function DetailMetric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailMetric}>
      <Ionicons name={icon} size={34} color={theme.colors.accentPressed} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodySmall" color={theme.colors.textMuted}>
          {label}
        </Text>
        <Text variant="h3" weight="regular" color={theme.colors.accentPressed} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ReviewCard({ name, quote }: { name: string; quote: string }) {
  const theme = useTheme();
  return (
    <Card variant="outline" style={styles.reviewCard}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceTint }]}>
        <Ionicons name="person" size={28} color={theme.colors.primary} />
      </View>
      <View style={styles.reviewCopy}>
        <View style={styles.reviewStars}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Ionicons key={index} name="star" size={15} color={theme.colors.accentPressed} />
          ))}
        </View>
        <Text variant="caption" numberOfLines={3}>
          {quote}
        </Text>
        <Text variant="caption" weight="semibold">
          {name}
        </Text>
        <Text variant="meta" color={theme.colors.textMuted}>
          Verified Buyer
        </Text>
      </View>
    </Card>
  );
}

function BeforeAfterPair({
  before,
  after,
  categorySlug,
}: {
  before: string;
  after: string;
  categorySlug?: string | null;
}) {
  return (
    <View style={styles.beforeAfterPair}>
      <CompareImage uri={before} label="Before" categorySlug={categorySlug} position="left" />
      <View style={styles.compareDivider}>
        <View style={styles.compareHandle}>
          <Ionicons name="chevron-forward" size={17} color="#111827" />
        </View>
      </View>
      <CompareImage uri={after} label="After" categorySlug={categorySlug} position="right" />
    </View>
  );
}

function CompareImage({
  uri,
  label,
  categorySlug,
  position,
}: {
  uri: string;
  label: string;
  categorySlug?: string | null;
  position: "left" | "right";
}) {
  const [error, setError] = React.useState(false);
  if (error) {
    return <MediaPlaceholder compact categorySlug={categorySlug} label={label} style={styles.compareImage} />;
  }

  return (
    <ImageBackground
      source={{ uri }}
      resizeMode="cover"
      style={styles.compareImage}
      imageStyle={[styles.compareImageRadius, position === "left" ? styles.compareLeftRadius : styles.compareRightRadius]}
      onError={() => setError(true)}
    >
      <View style={styles.compareLabelWrap}>
        <Text variant="bodySmall" weight="semibold" color="#FFFFFF">
          {label}
        </Text>
      </View>
    </ImageBackground>
  );
}

function getHeroImage(categorySlug?: string | null) {
  return categorySlug ? SERVICE_HERO_IMAGES[categorySlug] ?? SERVICE_HERO_IMAGES.shoes : SERVICE_HERO_IMAGES.shoes;
}

function getBeforeAfterPairs(categorySlug?: string | null) {
  return categorySlug ? BEFORE_AFTER_IMAGES[categorySlug] ?? BEFORE_AFTER_IMAGES.shoes : BEFORE_AFTER_IMAGES.shoes;
}

function formatDuration(minutes: number) {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return `${days}-${days + 1} days`;
  }
  if (minutes >= 120) {
    const days = Math.round(minutes / 480);
    return days >= 1 ? `${days}-${days + 1} days` : `${Math.round(minutes / 60)} hrs`;
  }
  return `${minutes} mins`;
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    paddingBottom: 132,
    backgroundColor: "#FAF8F4",
  },
  heroWrap: {
    height: 430,
    marginBottom: -72,
    backgroundColor: "#0B1417",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImageRadius: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroOverlay: {
    flex: 1,
    paddingTop: 54,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  heroTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroActions: {
    flexDirection: "row",
    gap: 14,
  },
  roundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  detailSheet: {
    marginHorizontal: 18,
    borderRadius: 34,
    padding: 30,
    gap: 28,
  },
  providerLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
  },
  metaGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  detailMetric: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  verticalDivider: {
    width: 1,
    height: 54,
  },
  includedCard: {
    borderRadius: 18,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  includedList: {
    flex: 1,
    gap: 13,
  },
  sectionTitle: {
    fontSize: 25,
    lineHeight: 31,
  },
  includedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  guaranteeCard: {
    width: 210,
    minHeight: 160,
    borderRadius: 18,
    padding: 22,
    justifyContent: "center",
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewsRow: {
    flexDirection: "row",
    gap: 18,
  },
  ratingSummary: {
    width: 160,
    gap: 8,
    justifyContent: "center",
  },
  ratingNumber: {
    fontSize: 54,
    lineHeight: 58,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewCard: {
    width: 300,
    minHeight: 154,
    borderRadius: 18,
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 1,
  },
  beforeAfterRow: {
    flexDirection: "row",
    gap: 18,
  },
  beforeAfterPair: {
    flex: 1,
    height: 184,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
  },
  compareImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  compareImageRadius: {
    borderRadius: 0,
  },
  compareLeftRadius: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  compareRightRadius: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  compareLabelWrap: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  compareDivider: {
    width: 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  compareHandle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 18,
  },
});
