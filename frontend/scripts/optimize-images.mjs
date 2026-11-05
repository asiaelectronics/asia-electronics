import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const imageDirectory = path.resolve("src/assets/imgs");
const heroImages = new Set(["hero-electronics-showcase.png", "hero-repair-workbench.png"]);
const ignoredImages = new Set(["logopng.png"]);

for (const fileName of await readdir(imageDirectory)) {
  if (!fileName.endsWith(".png") || ignoredImages.has(fileName)) continue;

  const isHero = heroImages.has(fileName);
  const input = path.join(imageDirectory, fileName);
  const output = input.replace(/\.png$/i, ".webp");

  await sharp(input)
    .resize({ width: isHero ? 1600 : 640, withoutEnlargement: true })
    .webp({ quality: isHero ? 78 : 76, effort: 6 })
    .toFile(output);

  if (isHero) {
    const mobileOutput = input.replace(/\.png$/i, "-mobile.webp");
    await sharp(input)
      .resize({ width: 768, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(mobileOutput);
    console.log(`Optimized mobile ${fileName} → ${path.basename(mobileOutput)}`);
  }

  console.log(`Optimized ${fileName} → ${path.basename(output)}`);
}
