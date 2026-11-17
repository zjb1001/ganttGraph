import { describe, it, expect } from 'vitest'
import { PALETTE, resolveColor, inkColor, contrastRatio, getContrastColor, tint, nextPaletteColor } from '../utils/colors'

describe('palette', () => {
  it('every palette color is readable with white text (WCAG AA)', () => {
    for (const c of PALETTE) {
      expect(contrastRatio(c.hex, '#ffffff'), c.name).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('nextPaletteColor cycles through the palette', () => {
    expect(nextPaletteColor(0)).toBe(PALETTE[0].hex)
    expect(nextPaletteColor(PALETTE.length)).toBe(PALETTE[0].hex)
    expect(nextPaletteColor(-1)).toBe(PALETTE[PALETTE.length - 1].hex)
  })
})

describe('resolveColor', () => {
  it('maps legacy Fluent colors to the new palette', () => {
    expect(resolveColor('#0078d4')).toBe('#2563eb')
    expect(resolveColor('#D83B01')).toBe('#c2410c')
  })
  it('keeps custom colors and falls back for empty/invalid', () => {
    expect(resolveColor('#123456')).toBe('#123456')
    expect(resolveColor(undefined, '#c2410c')).toBe('#c2410c')
    expect(resolveColor('not-a-color', '#c2410c')).toBe('#c2410c')
  })
})

describe('inkColor', () => {
  it('darkens light colors until readable on white', () => {
    const ink = inkColor('#ffd700') // gold: unreadable as text on white
    expect(contrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
  it('leaves already-dark colors unchanged', () => {
    expect(inkColor('#1e293b')).toBe('#1e293b')
  })
})

describe('getContrastColor / tint', () => {
  it('picks dark text on light backgrounds and white on dark ones', () => {
    expect(getContrastColor('#fde047')).not.toBe('#ffffff')
    expect(getContrastColor('#2563eb')).toBe('#ffffff')
  })
  it('tint produces rgba (html2canvas-safe)', () => {
    expect(tint('#2563eb', 0.1)).toBe('rgba(37, 99, 235, 0.1)')
  })
})
