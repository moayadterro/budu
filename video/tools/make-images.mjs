// Drawn avatars for the demo people (no real faces) and simple school logos, as PNG files.
import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'
import { toPng } from '@dicebear/converter'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const out = new URL('../assets/', import.meta.url).pathname
mkdirSync(out + 'avatars', { recursive: true })
mkdirSync(out + 'logos', { recursive: true })

// every demo person: the part before @ in their address (from the credentials file)
const md = readFileSync(new URL('../../frontend/scripts/demo-accounts.local.md', import.meta.url), 'utf8')
const keys = [...md.matchAll(/^\| ([a-z.]+)@demo\.budu\.test /gm)].map((m) => m[1])
const pastel = ['d1f4e0', 'dbeafe', 'ede9fe', 'fde2e4', 'fef3c7', 'e0f2fe', 'f3e8ff', 'dcfce7']
// women / girls by first name (Russian names; the address starts with the first name)
const female = new Set(['elena', 'maria', 'olga', 'sofia', 'alisa', 'darya', 'anna', 'viktoria', 'polina', 'dina', 'leila', 'kamila', 'sara', 'elizaveta', 'ksenia', 'natalia'])
// adults (teachers, managers, parents) may wear glasses / a light beard; students never
const adults = new Set(['elena.smirnova', 'andrey.kozlov', 'maria.belova', 'olga.kim', 'timur.khairullin', 'dina.safina', 'igor.lebedev', 'pavel.orlov', 'dmitry.nikitin', 'anna.volkova', 'sara.haddad', 'john.miller', 'oleg.tarasov', 'natalia.petrova', 'sergey.morozov'])
for (const [i, key] of keys.entries()) {
  const isF = female.has(key.split('.')[0])
  const adult = adults.has(key)
  const svg = createAvatar(avataaars, {
    seed: key,
    size: 256,
    backgroundColor: [pastel[i % pastel.length]],
    top: isF
      ? ['bigHair', 'bob', 'bun', 'curly', 'curvy', 'longButNotTooLong', 'miaWallace', 'straight01', 'straight02', 'straightAndStrand']
      : ['shortFlat', 'shortRound', 'shortWaved', 'sides', 'theCaesar', 'theCaesarAndSidePart', 'shortCurly', 'dreads01'],
    facialHairProbability: !isF && adult ? 45 : 0,
    facialHair: ['beardLight', 'moustacheFancy'],
    accessoriesProbability: adult ? 35 : 0,
    accessories: ['prescription01', 'prescription02', 'round'],
    mouth: ['smile', 'default', 'twinkle'],
    eyes: ['happy', 'default', 'wink'],
    eyebrows: ['default', 'defaultNatural', 'raisedExcited', 'raisedExcitedNatural'],
    hairColor: ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370'], // natural colours only
    facialHairColor: ['2c1b18', '4a312c', '724133', 'a55728'],
    skinColor: ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29'], // natural tones only
    clothing: ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'hoodie', 'shirtCrewNeck', 'shirtVNeck', 'graphicShirt'],
  })
  writeFileSync(`${out}avatars/${key}.png`, Buffer.from(await toPng(svg).toArrayBuffer()))
}
console.log('avatars:', keys.length)

// school logos: a one-hue rounded square with a simple mark and the initial letters
const logo = (bg1, bg2, mark, letters) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
  <rect width="512" height="512" rx="120" fill="url(#g)"/>
  ${mark}
  <text x="256" y="430" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="74" font-weight="700" fill="#ffffff" letter-spacing="4">${letters}</text>
</svg>`
const logos = {
  // Лицей «Перспектива»: a rising arrow over a horizon (perspective)
  perspektiva: logo('#6d8cff', '#3a55d9', '<path d="M120 300 L256 140 L392 300" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="M110 330 H402" stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".7"/>', 'ЛП'),
  // Школа «Новый горизонт»: a sun rising over the horizon
  gorizont: logo('#34c38f', '#15875e', '<circle cx="256" cy="290" r="96" fill="#fff"/><rect x="96" y="290" width="320" height="120" fill="url(#g)"/><path d="M96 296 H416" stroke="#fff" stroke-width="22" stroke-linecap="round"/>', 'НГ'),
  // Гимназия «Северная звезда»: a four-pointed star
  zvezda: logo('#a77bf3', '#6f3fd1', '<path d="M256 96 C270 200 312 242 416 256 C312 270 270 312 256 416 C242 312 200 270 96 256 C200 242 242 200 256 96 Z" fill="#fff" transform="translate(0 -40) scale(1) "/>', 'СЗ'),
}
for (const [name, svg] of Object.entries(logos)) writeFileSync(`${out}logos/${name}.png`, Buffer.from(await toPng(svg).toArrayBuffer()))
console.log('logos:', Object.keys(logos).length)
