import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  Stop,
  RadialGradient as SvgRadialGradient,
} from "react-native-svg";
import { useStrings } from "../../constants/strings";
import { useTheme } from "../../hooks/useTheme";
import { useSettingsStore } from "../../stores/settingsStore";
import { toArabicIndic } from "../../utils/arabic";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

type ContinueProps = {
  variant: "continue";
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  pageNumber: number;
  lastReadAt: number;
  onResume: () => void;
};

type ColdStartProps = {
  variant: "cold-start";
  onStart: () => void;
};

type Props = ContinueProps | ColdStartProps;

/**
 * Greeting / "continue reading" card. Gradient teal with a soft gold radial
 * highlight, featuring the user's last position and a resume CTA.
 */
export function GreetingCard(props: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === "ar";
  const styles = createStyles(theme, isArabic);

  if (props.variant === "cold-start") {
    return (
      <LinearGradient
        colors={[
          theme.palette.teal[700],
          theme.palette.teal[500],
          theme.palette.teal[500],
        ]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <CardGlow theme={theme} styles={styles} />
        <Text style={styles.label}>{strings.greetingContinueLabel}</Text>
        <Text style={styles.title}>{strings.greetingBeginPrompt}</Text>
        <View style={styles.cta}>
          <Pressable
            onPress={props.onStart}
            accessibilityRole="button"
            accessibilityLabel={strings.greetingStart}
          >
            {({ pressed }) => (
              <View style={[styles.btn, pressed && styles.btnPressed]}>
                <Svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill={theme.semantic.fgOnGold}
                >
                  <Path d={isArabic ? "M16 5v14L5 12z" : "M8 5v14l11-7z"} />
                </Svg>
                <Text style={styles.btnText}>{strings.greetingStart}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const title = `Surah ${props.surahName} · Ayah ${props.ayahNumber}`;
  const subtitle = isArabic
    ? strings.greetingJuzPage(
        toArabicIndic(props.juzNumber),
        toArabicIndic(props.pageNumber),
      )
    : strings.greetingJuzPage(props.juzNumber, props.pageNumber);
  const relative = formatRelativeTime(
    Date.now(),
    props.lastReadAt,
    isArabic ? "ar" : "en",
  );

  return (
    <LinearGradient
      colors={[
        theme.palette.teal[700],
        theme.palette.teal[500],
        theme.palette.teal[500],
      ]}
      locations={[0, 0.55, 1]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <CardGlow theme={theme} styles={styles} />
      <Text style={styles.label}>{strings.greetingContinueLabel}</Text>
      {isArabic ? (
        <Text style={styles.title}>
          {`سورة ${props.surahName} · الآية `}
          <Text
            testID="greeting-title-glyph"
            style={styles.titleGlyph}
          >{`${toArabicIndic(props.ayahNumber)}`}</Text>
        </Text>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
      {isArabic ? (
        <Text style={styles.subtitle}>
          الجزء{" "}
          <Text testID="greeting-juz-glyph" style={styles.metaGlyph}>
            {toArabicIndic(props.juzNumber)}
          </Text>
          {" · "}صفحة{" "}
          <Text testID="greeting-page-glyph" style={styles.metaGlyph}>
            {toArabicIndic(props.pageNumber)}
          </Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      <View style={styles.cta}>
        <Pressable
          onPress={props.onResume}
          accessibilityRole="button"
          accessibilityLabel={strings.greetingResume}
        >
          {({ pressed }) => (
            <View style={[styles.btn, pressed && styles.btnPressed]}>
              <Svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill={theme.semantic.fgOnGold}
              >
                <Path d={isArabic ? "M16 5v14L5 12z" : "M8 5v14l11-7z"} />
              </Svg>
              <Text style={styles.btnText}>{strings.greetingResume}</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.timestamp}>{strings.greetingLastReadAgo(relative)}</Text>
      </View>
    </LinearGradient>
  );
}

function CardGlow({
  theme,
  styles,
}: {
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Svg
      style={styles.glow}
      width={180}
      height={180}
      viewBox="0 0 180 180"
      pointerEvents="none"
    >
      <Defs>
        <SvgRadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <Stop
            offset="0%"
            stopColor={theme.semantic.accentSoft}
            stopOpacity={0.18}
          />
          <Stop
            offset="60%"
            stopColor={theme.semantic.accentSoft}
            stopOpacity={0}
          />
        </SvgRadialGradient>
      </Defs>
      <Circle cx={90} cy={90} r={90} fill="url(#glowGrad)" />
    </Svg>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    card: {
      direction: isArabic ? "rtl" : "ltr",
      marginHorizontal: theme.gutter.screen - 6,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md + 2,
      borderRadius: theme.radii.xl - 6,
      overflow: "hidden",
      ...theme.elevation.shadow2,
    },
    glow: {
      position: "absolute",
      top: -30,
      left: -30,
    },
    label: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 22 : 10,
      lineHeight: isArabic ? 34 : undefined,
      letterSpacing: isArabic ? 0 : 2.2,
      fontWeight: isArabic ? "normal" : "700",
      color: theme.semantic.accentSoft,
      textTransform: isArabic ? "none" : "uppercase",
      textAlign: isArabic ? "left" : "left",
      writingDirection: isArabic ? "rtl" : "ltr",
    },
    title: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 32 : 22,
      color: theme.palette.paper[50],
      marginTop: isArabic ? 8 : 6,
      marginBottom: 2,
      textAlign: isArabic ? "left" : "left",
      writingDirection: isArabic ? "rtl" : "ltr",
      lineHeight: isArabic ? 50 : 34,
      fontWeight: isArabic ? "normal" : "700",
    },
    titleGlyph: {
      fontFamily: theme.fonts.quran,
      fontSize: 34,
      lineHeight: 50,
      color: theme.palette.paper[50],
    },
    subtitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 24 : 11,
      color: theme.palette.paper[50],
      opacity: 0.78,
      letterSpacing: isArabic ? 0 : 0.4,
      textAlign: isArabic ? "left" : "left",
      writingDirection: isArabic ? "rtl" : "ltr",
      lineHeight: isArabic ? 46 : undefined,
    },
    metaGlyph: {
      fontFamily: theme.fonts.quran,
      fontSize: 34,
      lineHeight: 46,
      color: theme.palette.paper[50],
      opacity: 0.78,
    },
    timestamp: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 24 : 11,
      color: theme.palette.paper[50],
      opacity: 0.68,
      flexShrink: 1,
      textAlign: "left",
      writingDirection: isArabic ? "rtl" : "ltr",
      lineHeight: isArabic ? 38 : undefined,
    },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.md - 2,
    },
    btn: {
      direction: isArabic ? "rtl" : "ltr",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.semantic.accent,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: theme.radii.sm + 4,
    },
    btnPressed: {
      backgroundColor: theme.palette.gold[700],
    },
    btnText: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 23 : 14,
      lineHeight: isArabic ? 36 : undefined,
      color: theme.semantic.fgOnGold,
      fontWeight: isArabic ? "normal" : "600",
    },
  });
}
