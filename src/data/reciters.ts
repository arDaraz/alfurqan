export type Reciter = {
  id: string;
  nameAr: string;
  nameEn: string;
  rivayahAr: string;
  rivayahEn: string;
  bitrate: 32 | 64 | 128 | 192;
  bytesPerAyahAvg: number;
  avatarInitialAr: string;
};

export const RECITERS: Reciter[] = [
  {
    id: 'Husary_128kbps',
    nameAr: 'محمود خليل الحصري',
    nameEn: 'Mahmoud Khalil Al-Husary',
    rivayahAr: 'رواية حفص عن عاصم',
    rivayahEn: "Hafs 'an Asim",
    bitrate: 128,
    bytesPerAyahAvg: 320000,
    avatarInitialAr: 'ح',
  },
  {
    id: 'Abdul_Basit_Murattal_192kbps',
    nameAr: 'عبد الباسط عبد الصمد',
    nameEn: 'Abdul Basit Abdus Samad',
    rivayahAr: 'رواية حفص عن عاصم',
    rivayahEn: "Hafs 'an Asim",
    bitrate: 192,
    bytesPerAyahAvg: 480000,
    avatarInitialAr: 'ع',
  },
  {
    id: 'Abdurrahmaan_As-Sudais_64kbps',
    nameAr: 'عبد الرحمن السديس',
    nameEn: 'Abdul Rahman Al-Sudais',
    rivayahAr: 'رواية حفص عن عاصم',
    rivayahEn: "Hafs 'an Asim",
    bitrate: 64,
    bytesPerAyahAvg: 160000,
    avatarInitialAr: 'س',
  },
  {
    id: 'Minshawy_Murattal_128kbps',
    nameAr: 'محمد صديق المنشاوي',
    nameEn: 'Mohamed Siddiq Al-Minshawi',
    rivayahAr: 'رواية حفص عن عاصم',
    rivayahEn: "Hafs 'an Asim",
    bitrate: 128,
    bytesPerAyahAvg: 320000,
    avatarInitialAr: 'م',
  },
  {
    id: 'mahmoud_ali_al_banna_32kbps',
    nameAr: 'محمود علي البنا',
    nameEn: 'Mahmoud Ali Al-Banna',
    rivayahAr: 'رواية حفص عن عاصم',
    rivayahEn: "Hafs 'an Asim",
    bitrate: 32,
    bytesPerAyahAvg: 80000,
    avatarInitialAr: 'ب',
  },
];

export const DEFAULT_RECITER_ID = RECITERS[0].id;

export function getReciterById(id: string): Reciter {
  const reciter = RECITERS.find((item) => item.id === id);
  if (!reciter) throw new Error(`Unknown reciter: ${id}`);
  return reciter;
}
