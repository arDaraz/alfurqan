const EVERY_AYAH_BASE_URL = 'https://everyayah.com/data';

export function urlForAyah(reciterId: string, surah: number, ayah: number): string {
  if (surah < 1 || surah > 114) throw new Error('surah must be between 1 and 114');
  if (ayah < 1 || ayah > 286) throw new Error('ayah must be between 1 and 286');

  const file = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return `${EVERY_AYAH_BASE_URL}/${reciterId}/${file}`;
}
