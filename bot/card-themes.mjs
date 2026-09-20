const standard = {
  name: 'standard',
  svgDefinitions: `<linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050608"/><stop offset=".48" stop-color="#183042"/><stop offset="1" stop-color="#159b82"/></linearGradient>
    <radialGradient id="glow" cx="0" cy="1" r=".75"><stop stop-color="#96002e"/><stop offset="1" stop-color="#96002e" stop-opacity="0"/></radialGradient>`,
  svgLayers: '<rect width="1680" height="945" fill="url(#background)"/><rect width="820" height="945" fill="url(#glow)"/>'
};

const october = {
  name: 'october',
  svgDefinitions: `<linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#020202"/><stop offset=".48" stop-color="#090302"/><stop offset="1" stop-color="#5a1005"/></linearGradient>
    <radialGradient id="glow" cx="0" cy="1" r=".82"><stop stop-color="#e17b17"/><stop offset="1" stop-color="#e17b17" stop-opacity="0"/></radialGradient>
    <radialGradient id="autumn-shadow" cx="1" cy="1" r=".8"><stop stop-color="#8a0b12" stop-opacity=".86"/><stop offset="1" stop-color="#8a0b12" stop-opacity="0"/></radialGradient>`,
  svgLayers: '<rect width="1680" height="945" fill="url(#background)"/><rect width="980" height="945" fill="url(#glow)"/><rect width="1680" height="945" fill="url(#autumn-shadow)"/>'
};

const themes = { standard, october };

export const getCardTheme = (name) => themes[name] || standard;
