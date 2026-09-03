const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function main() {
  const texturePath = path.join(__dirname, '..', 'public', 'branding-texture.png');
  const logoPath = path.join(__dirname, '..', 'public', 'mizaan-transparent.png');

  const textureMeta = await sharp(texturePath).metadata();
  const { width, height } = textureMeta;
  console.log(`Texture size: ${width}x${height}`);

  // 1. Get raw pixel buffer of original texture
  const { data, info } = await sharp(texturePath).raw().toBuffer({ resolveWithObject: true });

  // 2. We want to patch the center area (x: 230 to 650, y: 130 to 350) where old logo and black line exist.
  // We can sample clean texture from the left (e.g. x: 30 to 220) and right (x: 660 to 850)
  // Let's create a clean background buffer by copying natural texture tiles with subtle blending
  const cleanData = Buffer.from(data);

  // Check bottom white artifact and fix it
  for (let y = height - 25; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * info.channels;
      // If bright white or grey edge artifact at the bottom
      if (data[idx] > 180 && data[idx+1] > 180 && data[idx+2] > 180) {
        // copy from y - 30
        const srcIdx = ((y - 35) * width + x) * info.channels;
        cleanData[idx] = cleanData[srcIdx];
        cleanData[idx+1] = cleanData[srcIdx+1];
        cleanData[idx+2] = cleanData[srcIdx+2];
      }
    }
  }

  // Cover the old logo area (x: 230 to 650, y: 130 to 360)
  // We can sample texture from clean bands:
  // Source band 1: x: 40 to 220, y: 130 to 360 (width 180)
  // Source band 2: x: 670 to 850, y: 130 to 360 (width 180)
  // Source band 3: top area y: 20 to 120
  const patchMinX = 230;
  const patchMaxX = 660;
  const patchMinY = 120;
  const patchMaxY = 360;

  for (let y = patchMinY; y <= patchMaxY; y++) {
    for (let x = patchMinX; x <= patchMaxX; x++) {
      const targetIdx = (y * width + x) * info.channels;
      
      // Determine source x: alternate between left and right texture areas with subtle offset
      const useLeft = (x - patchMinX) < (patchMaxX - patchMinX) / 2;
      let srcX, srcY;
      if (useLeft) {
        srcX = 40 + ((x - patchMinX) % 170);
      } else {
        srcX = 670 + ((x - patchMinX) % 170);
      }
      srcY = 40 + ((y * 3 + x * 2) % 80); // sample from top clean leather

      const srcIdx = (srcY * width + srcX) * info.channels;

      // Soft feathering at boundaries
      const distFromEdge = Math.min(
        x - patchMinX,
        patchMaxX - x,
        y - patchMinY,
        patchMaxY - y
      );

      if (distFromEdge < 15) {
        const blend = distFromEdge / 15;
        cleanData[targetIdx] = Math.round(cleanData[targetIdx] * (1 - blend) + data[srcIdx] * blend);
        cleanData[targetIdx+1] = Math.round(cleanData[targetIdx+1] * (1 - blend) + data[srcIdx+1] * blend);
        cleanData[targetIdx+2] = Math.round(cleanData[targetIdx+2] * (1 - blend) + data[srcIdx+2] * blend);
      } else {
        cleanData[targetIdx] = data[srcIdx];
        cleanData[targetIdx+1] = data[srcIdx+1];
        cleanData[targetIdx+2] = data[srcIdx+2];
      }
    }
  }

  // Save clean leather background temporarily to check
  const cleanBackgroundBuffer = await sharp(cleanData, {
    raw: {
      width,
      height,
      channels: info.channels,
    }
  }).png().toBuffer();

  // 3. Prepare trimmed mizaan-transparent logo
  // The official logo in mizaan-transparent has double 'a' ("mizaan.")
  // We trim transparent space around it:
  const trimmedLogoBuffer = await sharp(logoPath)
    .trim()
    .toBuffer();

  const trimmedMeta = await sharp(trimmedLogoBuffer).metadata();
  console.log('Trimmed official logo:', trimmedMeta.width, 'x', trimmedMeta.height);

  // Resize trimmed logo to fit gracefully in the center
  // Original mizan mark was ~366px wide.
  // "mizaan." with double 'a' should be around 380-400px wide!
  const targetLogoWidth = 390;
  const targetLogoHeight = Math.round(trimmedMeta.height * (targetLogoWidth / trimmedMeta.width));

  const resizedLogo = await sharp(trimmedLogoBuffer)
    .resize(targetLogoWidth, targetLogoHeight, { fit: 'contain' })
    .toBuffer();

  // 4. Position:
  // Center horizontally:
  const logoLeft = Math.round((width - targetLogoWidth) / 2) - 10;
  const logoTop = 168;

  // 5. Create "technologies." text overlay SVG
  // In the original, "technologies." is aligned below the "izaan." part, around y: logoTop + targetLogoHeight + 12
  const textSvg = Buffer.from(`
    <svg width="${width}" height="${height}">
      <style>
        .tech-text {
          font-family: 'Plus Jakarta Sans', 'Outfit', system-ui, -apple-system, sans-serif;
          font-size: 27px;
          font-weight: 500;
          fill: #f1eaed;
          letter-spacing: -0.02em;
          filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));
        }
      </style>
      <text x="${logoLeft + 160}" y="${logoTop + targetLogoHeight + 28}" class="tech-text">technologies.</text>
    </svg>
  `);

  // 6. Composite the resized logo and the "technologies." text on the clean background
  const finalImageBuffer = await sharp(cleanBackgroundBuffer)
    .composite([
      {
        input: resizedLogo,
        top: logoTop,
        left: logoLeft,
      },
      {
        input: textSvg,
        top: 0,
        left: 0,
      }
    ])
    .png()
    .toBuffer();

  // Save to public/branding-texture.png (replacing old one)
  // Also backup original just in case
  if (!fs.existsSync(path.join(__dirname, '..', 'public', 'branding-texture-original.png'))) {
    fs.copyFileSync(texturePath, path.join(__dirname, '..', 'public', 'branding-texture-original.png'));
  }

  await sharp(finalImageBuffer).toFile(texturePath);
  console.log('Successfully updated branding-texture.png with double-a "mizaan" and removed black line!');
}

main().catch(console.error);
