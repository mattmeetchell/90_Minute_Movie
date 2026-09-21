const splitTitleIntoLines = (words, lineCount) => {
  if (lineCount === 1) return [[words.join(' ')]];
  const candidates = [];
  for (let index = 1; index <= words.length - lineCount + 1; index += 1) {
    const firstLine = words.slice(0, index).join(' ');
    splitTitleIntoLines(words.slice(index), lineCount - 1).forEach((remainingLines) => {
      candidates.push([firstLine, ...remainingLines]);
    });
  }
  return candidates;
};

const fontSizeForTitleLength = (length) => {
  if (length <= 8) return 126;
  if (length <= 10) return 116;
  if (length <= 12) return 104;
  if (length <= 14) return 88;
  if (length <= 16) return 72;
  if (length <= 18) return 60;
  if (length <= 22) return 52;
  return 48;
};

export const getTitleLayout = (title) => {
  const words = title.split(/\s+/).filter(Boolean);
  if (title.length <= 15 || words.length < 2) {
    const fontSize = fontSizeForTitleLength(title.length);
    return { lines: [title], fontSize, tracking: (fontSize * 0.02).toFixed(2) };
  }

  const twoLineCandidates = splitTitleIntoLines(words, 2);
  const bestTwoLineCandidate = twoLineCandidates.sort((first, second) => (
    Math.max(...first.map((line) => line.length)) - Math.max(...second.map((line) => line.length))
  ))[0];
  const longestTwoLineLength = Math.max(...bestTwoLineCandidate.map((line) => line.length));
  const lines = longestTwoLineLength <= 18 || words.length < 3
    ? bestTwoLineCandidate
    : splitTitleIntoLines(words, 3).sort((first, second) => (
      Math.max(...first.map((line) => line.length)) - Math.max(...second.map((line) => line.length))
    ))[0];
  const fontSize = fontSizeForTitleLength(Math.max(...lines.map((line) => line.length)));
  return { lines, fontSize, tracking: (fontSize * 0.02).toFixed(2) };
};

export const getSquareTitleLayout = (title) => {
  const words = title.split(/\s+/).filter(Boolean);
  const candidates = words.length > 1 ? splitTitleIntoLines(words, 2) : [[title]];
  const lines = candidates.sort((first, second) => (
    Math.max(...first.map((line) => line.length)) - Math.max(...second.map((line) => line.length))
  ))[0];
  const longest = Math.max(...lines.map((line) => line.length));
  const fontSize = longest <= 8 ? 104 : longest <= 11 ? 92 : longest <= 14 ? 78 : longest <= 18 ? 66 : longest <= 23 ? 54 : 46;
  return { lines, fontSize, tracking: (fontSize * 0.014).toFixed(2) };
};

export const createTrackedCharacters = (line, tracking, escape) => Array.from(line).map((character, characterIndex) => (
  `<tspan dx="${characterIndex === 0 ? 0 : tracking}">${escape(character)}</tspan>`
)).join('');
