import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { SimulateFileAudioStreamAdapter } from 'whisper.rn/realtime-transcription/adapters/SimulateFileAudioStreamAdapter';
import type { AudioStreamInterface } from 'whisper.rn/realtime-transcription/types';

import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../constants/theme';
import {
  ASR_MODELS,
  VAD_MODEL,
  WhisperAsrSource,
  ensureModel,
  scoreTranscript,
} from '../../services/asr';
import type { AsrModel, AsrTranscript, WhisperSegmentStats } from '../../services/asr';

/**
 * Throwaway screen for the Whisper go/no-go spike. It runs the real microphone
 * against each candidate model and records what the decision needs: how long a
 * transcript takes to appear, how much audio is held in memory, and how close
 * the transcript is to Al-Fatiha. Delete it once the model is chosen.
 */

const FATIHA_AYAHS = [
  'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
  'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
  'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
  'مَـٰلِكِ يَوْمِ ٱلدِّينِ',
  'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
  'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
  'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
];

const FATIHA_TEXT = FATIHA_AYAHS.join(' ');

type Phase = 'idle' | 'preparing' | 'listening' | 'stopped';

interface Measurement {
  modelId: string;
  firstTranscriptMs: number | null;
  segments: number;
  medianProcessTimeMs: number;
  worstProcessTimeMs: number;
  /** Decode time over audio length. Above 1 means the model cannot keep up with speech. */
  realtimeFactor: number;
  peakBufferedMB: number;
  listenedMs: number;
  accuracy: number;
  transcript: string;
}

function summarize(segments: WhisperSegmentStats[]) {
  const decodeTimes = segments.map((segment) => segment.processTimeMs);
  const audioMs = segments.reduce((total, segment) => total + segment.recordingTimeMs, 0);
  const decodeMs = decodeTimes.reduce((total, time) => total + time, 0);
  return {
    segments: segments.length,
    medianProcessTimeMs: median(decodeTimes),
    worstProcessTimeMs: decodeTimes.length ? Math.max(...decodeTimes) : 0,
    realtimeFactor: audioMs === 0 ? 0 : decodeMs / audioMs,
    peakBufferedMB: segments.reduce((peak, segment) => Math.max(peak, segment.bufferedMB), 0),
  };
}

/**
 * Feed the recognizer from a recorded WAV instead of the microphone. Decode,
 * memory and accuracy stay real numbers because only the capture step changes.
 * Use it when the machine running the test has no working microphone. Copy the
 * file into the app's Documents directory first, with
 * `xcrun simctl get_app_container <device> com.alfurqan.app data`.
 */
function fileAudioStream(fileName: string): AudioStreamInterface {
  return new SimulateFileAudioStreamAdapter({
    filePath: `${FileSystem.documentDirectory}${fileName}`,
    fs: {
      readFile: (path) => FileSystem.readAsStringAsync(path, { encoding: 'base64' }),
      exists: async (path) => (await FileSystem.getInfoAsync(path)).exists,
      unlink: (path) => FileSystem.deleteAsync(path, { idempotent: true }),
    },
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

export default function AsrSpikeScreen() {
  // expo-router registers every file under src/app, so a release build would still
  // answer alfurqan://dev/asr-spike. Nothing here is meant to ship.
  if (!__DEV__) return null;
  return <AsrSpike />;
}

function AsrSpike() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  // A deep link picks the model and the audio source, so a scripted run needs no
  // typing: alfurqan://dev/asr-spike?model=whisper-base&wav=fatiha-16k.wav
  const params = useLocalSearchParams<{ model?: string; wav?: string }>();

  const [model, setModel] = useState<AsrModel>(
    () => ASR_MODELS.find((candidate) => candidate.id === params.model) ?? ASR_MODELS[0]
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState('Pick a model and start listening.');
  const [transcript, setTranscript] = useState('');
  const [finalText, setFinalText] = useState('');
  const [stats, setStats] = useState<WhisperSegmentStats[]>([]);
  const [firstTranscriptMs, setFirstTranscriptMs] = useState<number | null>(null);
  const [listenedMs, setListenedMs] = useState(0);
  const [log, setLog] = useState<Measurement[]>([]);

  const sourceRef = useRef<WhisperAsrSource | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => () => {
    void sourceRef.current?.stop();
  }, []);

  const accuracy = useMemo(() => scoreTranscript(FATIHA_TEXT, finalText), [finalText]);
  const summary = useMemo(() => summarize(stats), [stats]);

  const stop = useCallback(async () => {
    const source = sourceRef.current;
    if (!source) return;
    sourceRef.current = null;
    setListenedMs(Date.now() - startedAtRef.current);
    setPhase('stopped');
    setStatus('Stopped. Numbers below cover the whole session.');
    await source.stop();
  }, []);

  const start = useCallback(async () => {
    if (sourceRef.current) return;

    setPhase('preparing');
    setTranscript('');
    setFinalText('');
    setStats([]);
    setFirstTranscriptMs(null);
    setListenedMs(0);

    try {
      const current = await getRecordingPermissionsAsync();
      const granted = current.granted || (await requestRecordingPermissionsAsync()).granted;
      if (!granted) {
        setPhase('idle');
        setStatus('Microphone permission denied. Grant it in system settings and try again.');
        return;
      }

      const prepare = (candidate: AsrModel) => {
        setStatus(`Preparing ${candidate.label}...`);
        return ensureModel(candidate, (fraction) => {
          setStatus(`${candidate.label}: ${Math.round(fraction * 100)}%`);
        });
      };

      const vadPath = await prepare(VAD_MODEL);
      const modelPath = await prepare(model);

      const source = new WhisperAsrSource({
        modelId: model.id,
        modelPath,
        vadModelPath: vadPath,
        audioStream: params.wav ? fileAudioStream(params.wav) : undefined,
        onSegmentStats: (segment) => setStats((previous) => [...previous, segment]),
      });

      startedAtRef.current = Date.now();
      await source.start({
        onTranscript: (event: AsrTranscript) => {
          setFirstTranscriptMs((previous) => previous ?? event.atMs);
          setTranscript(event.text);
          if (event.isFinal) {
            setFinalText((previous) => `${previous} ${event.text}`.trim());
          }
        },
        onError: (message) => setStatus(`Recognizer error: ${message}`),
      });

      sourceRef.current = source;
      setPhase('listening');
      setStatus(params.wav ? `Listening to ${params.wav}.` : 'Listening. Recite Al-Fatiha.');
    } catch (error) {
      setPhase('idle');
      const detail =
        error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(Object(error)));
      setStatus(`Could not start listening: ${detail}`);
    }
  }, [model, params.wav]);

  const record = useCallback(() => {
    setLog((previous) => [
      ...previous,
      {
        modelId: model.id,
        firstTranscriptMs,
        ...summary,
        listenedMs,
        accuracy: accuracy.accuracy,
        transcript: finalText,
      },
    ]);
  }, [accuracy.accuracy, finalText, firstTranscriptMs, listenedMs, model.id, summary]);

  const copyLog = useCallback(() => {
    const payload = {
      platform: `${Platform.OS} ${Platform.Version}`,
      reference: FATIHA_TEXT,
      runs: log,
    };
    void Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    setStatus('Measurements copied to the clipboard.');
  }, [log]);

  const busy = phase === 'preparing';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.headerAction}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Whisper spike</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>Model</Text>
        <View style={styles.modelRow}>
          {ASR_MODELS.map((candidate) => (
            <Pressable
              key={candidate.id}
              accessibilityRole="button"
              accessibilityState={{ selected: candidate.id === model.id }}
              disabled={phase === 'listening' || busy}
              onPress={() => setModel(candidate)}
              style={[styles.modelChip, candidate.id === model.id && styles.modelChipActive]}
            >
              <Text
                style={[
                  styles.modelChipText,
                  candidate.id === model.id && styles.modelChipTextActive,
                ]}
              >
                {candidate.label}
              </Text>
              <Text style={styles.modelChipSize}>
                {candidate.sizeBytes ? `${Math.round(candidate.sizeBytes / 1_000_000)} MB` : 'local file'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.status}>{status}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={phase === 'listening' ? 'Stop listening' : 'Start listening'}
          disabled={busy}
          onPress={() => (phase === 'listening' ? void stop() : void start())}
          style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {phase === 'listening' ? 'Stop listening' : 'Start listening'}
          </Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Live transcription</Text>
        <View style={styles.transcriptBox}>
          <Text style={styles.arabic}>{transcript || 'nothing yet'}</Text>
        </View>

        <Text style={styles.sectionLabel}>Committed transcript</Text>
        <View style={styles.transcriptBox}>
          <Text style={styles.arabic}>{finalText || 'nothing yet'}</Text>
        </View>

        <Text style={styles.sectionLabel}>Reference (Al-Fatiha)</Text>
        <View style={styles.transcriptBox}>
          {FATIHA_AYAHS.map((ayah, index) => (
            <Text key={index} style={styles.arabicSmall}>
              {ayah}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Measurements</Text>
        <Metric label="First transcript" value={firstTranscriptMs === null ? 'none' : `${firstTranscriptMs} ms`} styles={styles} />
        <Metric label="Segments transcribed" value={`${summary.segments}`} styles={styles} />
        <Metric
          label="Decode time (median / worst)"
          value={`${summary.medianProcessTimeMs} / ${summary.worstProcessTimeMs} ms`}
          styles={styles}
        />
        <Metric
          label="Realtime factor (decode / audio)"
          value={summary.realtimeFactor.toFixed(2)}
          styles={styles}
        />
        <Metric
          label="Peak audio buffered"
          value={`${summary.peakBufferedMB.toFixed(2)} MB`}
          styles={styles}
        />
        <Metric
          label="Accuracy"
          value={`${Math.round(accuracy.accuracy * 100)}% (${accuracy.correct}/${accuracy.expectedCount})`}
          styles={styles}
        />
        <Metric
          label="Wrong / skipped / extra words"
          value={`${accuracy.substituted} / ${accuracy.skipped} / ${accuracy.added}`}
          styles={styles}
        />

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={phase !== 'stopped'}
            onPress={record}
            style={[styles.secondaryButton, phase !== 'stopped' && styles.primaryButtonDisabled]}
          >
            <Text style={styles.secondaryButtonText}>Record run</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={log.length === 0}
            onPress={copyLog}
            style={[styles.secondaryButton, log.length === 0 && styles.primaryButtonDisabled]}
          >
            <Text style={styles.secondaryButtonText}>Copy {log.length} run(s)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

/** The theme stores line height as a multiple of the size, so it has to be applied, not spread. */
function type(scale: { size: number; lineHeight: number; tracking?: number }) {
  return {
    fontSize: scale.size,
    lineHeight: scale.size * scale.lineHeight,
    letterSpacing: scale.tracking ?? 0,
  };
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.semantic.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.gutter.screen,
      paddingVertical: theme.spacing.sm,
    },
    headerAction: { ...type(theme.typeScale.label), color: theme.semantic.primary, fontFamily: theme.fonts.latin },
    headerTitle: { ...type(theme.typeScale.title), color: theme.semantic.fg, fontFamily: theme.fonts.latinDisplay },
    headerSpacer: { width: 40 },
    body: { paddingHorizontal: theme.gutter.screen, paddingBottom: theme.spacing['2xl'], gap: theme.spacing.sm },
    sectionLabel: {
      ...type(theme.typeScale.caption),
      color: theme.semantic.fgMuted,
      fontFamily: theme.fonts.latin,
      textTransform: 'uppercase',
      marginTop: theme.spacing.md,
    },
    modelRow: { flexDirection: 'row', gap: theme.spacing.sm },
    modelChip: {
      flex: 1,
      padding: theme.spacing.sm,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      backgroundColor: theme.semantic.bgRaised,
    },
    modelChipActive: { borderColor: theme.semantic.primary, backgroundColor: theme.semantic.bgSunken },
    modelChipText: { ...type(theme.typeScale.label), color: theme.semantic.fg, fontFamily: theme.fonts.latin },
    modelChipTextActive: { color: theme.semantic.primary },
    modelChipSize: { ...type(theme.typeScale.caption), color: theme.semantic.fgSubtle, fontFamily: theme.fonts.latin },
    status: { ...type(theme.typeScale.label), color: theme.semantic.fgMuted, fontFamily: theme.fonts.latin, marginTop: theme.spacing.sm },
    primaryButton: {
      backgroundColor: theme.semantic.primary,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    primaryButtonDisabled: { opacity: 0.4 },
    primaryButtonText: { ...type(theme.typeScale.body), color: theme.semantic.bg, fontFamily: theme.fonts.latinDisplay },
    transcriptBox: {
      minHeight: 64,
      padding: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.semantic.bgRaised,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      gap: theme.spacing.xs,
    },
    arabic: {
      ...type(theme.typeScale.quranSm),
      color: theme.semantic.fg,
      fontFamily: theme.fonts.arabic,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    arabicSmall: {
      ...type(theme.typeScale.body),
      color: theme.semantic.fgMuted,
      fontFamily: theme.fonts.arabic,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
    },
    metricLabel: { ...type(theme.typeScale.label), color: theme.semantic.fgMuted, fontFamily: theme.fonts.latin },
    metricValue: { ...type(theme.typeScale.label), color: theme.semantic.fg, fontFamily: theme.fonts.latin },
    actionRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
    secondaryButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.semantic.primary,
    },
    secondaryButtonText: { ...type(theme.typeScale.label), color: theme.semantic.primary, fontFamily: theme.fonts.latin },
  });
}
