import * as FileSystem from 'expo-file-system/legacy';
import type { AsrModel } from './models';

function modelsDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document directory is unavailable, cannot store speech models');
  }
  return `${FileSystem.documentDirectory}asr-models/`;
}

function localPathFor(model: AsrModel): string {
  return `${modelsDirectory()}${model.fileName}`;
}

async function storedSize(path: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && !info.isDirectory ? (info.size ?? 0) : 0;
}

/**
 * Return the model's on-device path, downloading it first when it is missing.
 * A downloaded file must match the published size, because whisper.cpp cannot
 * tell a truncated ggml file from a corrupt one. A model with no published build
 * is only checked for existence, because its size depends on who converted it.
 * The `onProgress` callback receives the fraction downloaded, from 0 to 1.
 */
export async function ensureModel(
  model: AsrModel,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const target = localPathFor(model);
  const existingSize = await storedSize(target);

  if (!model.url) {
    if (existingSize > 0) return target;
    throw new Error(
      `${model.label} has no published build. Put ${model.fileName} in the app's asr-models directory.`
    );
  }

  if (existingSize === model.sizeBytes) return target;

  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.makeDirectoryAsync(modelsDirectory(), { intermediates: true });

  const temp = `${target}.downloading`;
  await FileSystem.deleteAsync(temp, { idempotent: true });

  const download = FileSystem.createDownloadResumable(model.url, temp, {}, (event) => {
    onProgress?.(Math.min(1, event.totalBytesWritten / model.sizeBytes));
  });

  const result = await download.downloadAsync();
  if (!result || result.status >= 400) {
    await FileSystem.deleteAsync(temp, { idempotent: true });
    throw new Error(`Downloading ${model.label} failed (${result?.status ?? 'no response'})`);
  }

  const downloadedSize = await storedSize(temp);
  if (downloadedSize !== model.sizeBytes) {
    await FileSystem.deleteAsync(temp, { idempotent: true });
    throw new Error(
      `${model.label} downloaded ${downloadedSize} bytes, expected ${model.sizeBytes}`
    );
  }

  await FileSystem.moveAsync({ from: temp, to: target });
  return target;
}
