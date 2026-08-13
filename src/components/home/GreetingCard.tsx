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

type ContinueProps = {
  variant: "continue";
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  pageNumber: number;
  onResume: () => void;
};

type ColdStartProps = {
  variant: "cold-start";
  onStart: () => void;
};

type Props = ContinueProps | ColdStartProps;

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
        <View style={styles.ctaRow}>
          <ResumeButton
            theme={theme}
            styles={styles}
            isArabic={isArabic}
            label={strings.greetingStart}
            onPress={props.onStart}
          />
        </View>
      </LinearGradient>
    );
  }

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
        <Text style={styles.title}>
          {strings.greetingResumeTitle(props.surahName, props.ayahNumber)}
        </Text>
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
        <Text style={styles.subtitle}>
          {strings.greetingJuzPage(props.juzNumber, props.pageNumber)}
        </Text>
      )}
      <View style={styles.divider} />
      <View style={[styles.ctaRow, styles.ctaRowAfterDivider]}>
        <ResumeButton
          theme={theme}
          styles={styles}
          isArabic={isArabic}
          label={strings.greetingResume}
          onPress={props.onResume}
        />
      </View>
    </LinearGradient>
  );
}

function ResumeButton({
  theme,
  styles,
  isArabic,
  label,
  onPress,
}: {
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
  isArabic: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
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
          <Text style={styles.btnText}>{label}</Text>
        </View>
      )}
    </Pressable>
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
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      overflow: "hidden",
      ...theme.elevation.shadow2,
    },
    glow: {
      position: "absolute",
      top: -30,
      ...(isArabic ? { right: -30 } : { left: -30 }),
    },
    label: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 20 : 10,
      lineHeight: isArabic ? 30 : undefined,
      letterSpacing: isArabic ? 0 : 2.2,
      fontWeight: isArabic ? "normal" : "700",
      color: theme.palette.paper[50],
      opacity: 0.55,
      textTransform: isArabic ? "none" : "uppercase",
      textAlign: "left",
      writingDirection: isArabic ? "rtl" : "ltr",
    },
    title: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 24 : 22,
      color: theme.palette.paper[50],
      marginTop: theme.spacing.md,
      marginBottom: 2,
      textAlign: "left",
      writingDirection: isArabic ? "rtl" : "ltr",
      lineHeight: isArabic ? 40 : 30,
      fontWeight: isArabic ? "normal" : "700",
    },
    titleGlyph: {
      fontFamily: theme.fonts.quran,
      fontSize: 30,
      lineHeight: 40,
      color: theme.palette.paper[50],
    },
    subtitle: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 20 : 11,
      color: theme.palette.paper[50],
      opacity: 0.78,
      letterSpacing: isArabic ? 0 : 0.4,
      textAlign: "left",
      writingDirection: isArabic ? "rtl" : "ltr",
      lineHeight: isArabic ? 40 : undefined,
    },
    metaGlyph: {
      fontFamily: theme.fonts.quran,
      fontSize: 30,
      lineHeight: 30,
      color: theme.palette.paper[50],
      opacity: 0.78,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.semantic.accentSoft,
      opacity: 0.3,
      marginVertical: theme.spacing.md,
    },
    ctaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.lg,
    },
    ctaRowAfterDivider: {
      marginTop: 0,
    },
    btn: {
      direction: isArabic ? "rtl" : "ltr",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.semantic.accent,
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: theme.radii.md,
    },
    btnPressed: {
      backgroundColor: theme.palette.gold[700],
    },
    btnText: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 20 : 14,
      color: theme.semantic.fgOnGold,
      fontWeight: isArabic ? "normal" : "600",
    },
  });
}
