const MEME_EXPRESSIONS = ['happy', 'sad', 'surprise'] as const;

export type MemeExpression = (typeof MEME_EXPRESSIONS)[number];

export type MemeScene = {
  expression: MemeExpression;
  imageSrc: string;
  audioSrc?: string;
};

const imageModules = import.meta.glob('../assets/meme-media/**/*.{png,jpg,jpeg,webp,gif,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const audioModules = import.meta.glob('../assets/meme-audio/**/*.{mp3,wav,ogg,m4a,aac,mpeg}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const compareAssetPath = (left: string, right: string) => {
  const leftIsPlaceholder = left.includes('placeholder');
  const rightIsPlaceholder = right.includes('placeholder');

  if (leftIsPlaceholder !== rightIsPlaceholder) {
    return leftIsPlaceholder ? 1 : -1;
  }

  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
};

const extractExpression = (assetPath: string): MemeExpression | null => {
  const match = assetPath.match(/\/(happy|sad|surprise)\//);
  return (match?.[1] as MemeExpression | undefined) ?? null;
};

const buildAssetMap = (): Record<MemeExpression, string[]> => ({
  happy: [],
  sad: [],
  surprise: [],
});

const memeImages = buildAssetMap();
const memeAudio = buildAssetMap();

Object.entries(imageModules).forEach(([assetPath, assetUrl]) => {
  const expression = extractExpression(assetPath);
  if (expression) {
    memeImages[expression].push(assetUrl);
  }
});

Object.entries(audioModules).forEach(([assetPath, assetUrl]) => {
  const expression = extractExpression(assetPath);
  if (expression) {
    memeAudio[expression].push(assetUrl);
  }
});

const pickRandom = (items: string[]) => items[Math.floor(Math.random() * items.length)];

Object.values(memeImages).forEach((images) => images.sort(compareAssetPath));
Object.values(memeAudio).forEach((audio) => audio.sort(compareAssetPath));

export const getMemeTitle = (expression: MemeExpression) => expression.charAt(0).toUpperCase() + expression.slice(1);

export const getMemePalette = (expression: MemeExpression) => {
  switch (expression) {
    case 'happy':
      return ['#ffd166', '#ef476f', '#f9844a'];
    case 'sad':
      return ['#4d7cfe', '#1d3557', '#8ecae6'];
    case 'surprise':
      return ['#90be6d', '#577590', '#f9c74f'];
  }
};

export const getRandomMemeScene = (exclude?: MemeExpression): MemeScene => {
  let expression = MEME_EXPRESSIONS[Math.floor(Math.random() * MEME_EXPRESSIONS.length)];

  while (exclude && expression === exclude) {
    expression = MEME_EXPRESSIONS[Math.floor(Math.random() * MEME_EXPRESSIONS.length)];
  }

  const images = memeImages[expression];
  const audio = memeAudio[expression];

  return {
    expression,
    imageSrc: pickRandom(images),
    audioSrc: audio.length > 0 ? pickRandom(audio) : undefined,
  };
};

export const getMemeSceneForExpression = (expression: MemeExpression, previousImageSrc?: string): MemeScene => {
  const images = memeImages[expression];
  const audio = memeAudio[expression];

  if (images.length === 0) {
    throw new Error(`No meme images found for "${expression}"`);
  }

  const currentIndex = previousImageSrc ? images.indexOf(previousImageSrc) : -1;
  const nextIndex = images.length === 1 ? 0 : (currentIndex + 1) % images.length;

  return {
    expression,
    imageSrc: images[nextIndex],
    audioSrc: audio.length > 0 ? audio[nextIndex % audio.length] : undefined,
  };
};
