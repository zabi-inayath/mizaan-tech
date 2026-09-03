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
  const cleanData = Buffer.from(data);

  // Check bottom white artifact and fix it
  for (let y = height - 30; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * info.channels;
      if (data[idx] > 170 && data[idx+1] > 170 && data[idx+2] > 170) {
        const srcIdx = ((height - 40) * width + x) * info.channels;
        cleanData[idx] = cleanData[srcIdx];
        cleanData[idx+1] = cleanData[srcIdx+1];
        cleanData[idx+2] = cleanData[srcIdx+2];
      }
    }
  }

  // Cover the old logo area (x: 230 to 650, y: 120 to 360)
  const patchMinX = 230;
  const patchMaxX = 660;
  const patchMinY = 120;
  const patchMaxY = 360;

  for (let y = patchMinY; y <= patchMaxY; y++) {
    for (let x = patchMinX; x <= patchMaxX; x++) {
      const targetIdx = (y * width + x) * info.channels;
      
      const useLeft = (x - patchMinX) < (patchMaxX - patchMinX) / 2;
      let srcX;
      if (useLeft) {
        srcX = 40 + ((x - patchMinX) % 170);
      } else {
        srcX = 670 + ((x - patchMinX) % 170);
      }
      const srcY = 30 + ((y * 3 + x * 2) % 80);

      const srcIdx = (srcY * width + srcX) * info.channels;

      const distFromEdge = Math.min(
        x - patchMinX,
        patchMaxX - x,
        y - patchMinY,
        patchMaxY - y
      );

      if (distFromEdge < 18) {
        const blend = distFromEdge / 18;
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

  const cleanBackgroundBuffer = await sharp(cleanData, {
    raw: { width, height, channels: info.channels }
  }).png().toBuffer();

  // 3. Prepare trimmed mizaan-transparent logo
  const trimmedLogoBuffer = await sharp(logoPath)
    .trim()
    .toBuffer();

  const trimmedMeta = await sharp(trimmedLogoBuffer).metadata();
  console.log('Trimmed official logo:', trimmedMeta.width, 'x', trimmedMeta.height);

  // Resize trimmed logo
  const targetLogoWidth = 420;
  const targetLogoHeight = Math.round(trimmedMeta.height * (targetLogoWidth / trimmedMeta.width));

  const resizedLogo = await sharp(trimmedLogoBuffer)
    .resize(targetLogoWidth, targetLogoHeight, { fit: 'contain' })
    .toBuffer();

  const logoLeft = Math.round((width - targetLogoWidth) / 2) - 15;
  const logoTop = 165;

  // 4. "technologies." SVG
  const textSvg = Buffer.from(`
    <svg width="${width}" height="${height}">
      <text 
        x="${logoLeft + 175}" 
        y="${logoTop + targetLogoHeight + 28}" 
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="28px" 
        font-weight="500" 
        fill="#eae3e6" 
        letter-spacing="-0.02em"
        style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.6));"
      >technologies.</text>
    </svg>
  `);

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

  if (!fs.existsSync(path.join(__dirname, '..', 'public', 'branding-texture-original.png'))) {
    fs.copyFileSync(texturePath, path.join(__dirname, '..', 'public', 'branding-texture-original.png'));
  }

  await sharp(finalImageBuffer).toFile(texturePath);
  console.log('SUCCESS: branding-texture.png successfully updated!');
}

main().catch(console.error);
