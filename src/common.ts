// Get plate ID based on rating thresholds
export function getPlateId(rating: number): string {
  const levels = [1000, 2000, 4000, 7000, 10000, 12000, 13000, 14000, 14500, 15000]

  if (rating < levels[0])
    return '01'
  if (rating >= levels[9])
    return '11'

  const plateIndex = levels.findIndex((threshold, i) =>
    rating >= threshold && rating < levels[i + 1],
  )

  return plateIndex >= 0
    ? (plateIndex + 2).toString().padStart(2, '0')
    : '00'
}

// Generate SVG image with rating and plate
export function generateRatingSvg(rating: number, plate: string): string {
  const digits = rating.toString()
  const startX = 5 - digits.length - 1

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 664 130" width="100%" height="auto" style="max-width: 664px;">
    <image href="${plate}" x="0" y="0" width="664" height="130"/>
    ${digits.split('').map((char, i) => `
      <text
        x="${321 + (startX + i + 1) * 52.4}"
        y="87"
        font-family="ui-monospace, Monaco, 'JetBrains Mono Variable', 'JetBrains Mono', Monospaced, monospace, sans-serif"
        font-size="58"
        fill="#FCD41B">
        ${char}
      </text>`).join('')}
  </svg>`
}
