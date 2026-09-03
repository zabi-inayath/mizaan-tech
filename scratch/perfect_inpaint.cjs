const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testInpaint() {
  const originalPath = path.join(__dirname, '..', 'public', 'branding-texture-original.png');
  const { data, info } = await sharp(originalPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isOldLogoOrArtifact = (x, y) => {
    // Bottom edge artifact
    if (y > height - 25 && x < 450) {
      const idx = (y * width + x) * channels;
      if (data[idx] > 160 && data[idx+1] > 160 && data[idx+2] > 160) return true;
    }

    // Only within center logo region
    if (x >= 230 && x <= 640 && y >= 110 && y <= 360) {
      const idx = (y * width + x) * channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];

      // Black vertical line around x: 360..370
      if (x >= 360 && x <= 370 && r < 35 && g < 15 && b < 20) {
        return true;
      }

      // Bright letters or red dot
      if ((r > 130 && g > 130 && b > 130) || (r > 140 && g < 50 && b < 50)) {
        return true;
      }
      // Anti-aliased edges of letters
      if (r > 105 && g > 65 && b > 65) {
        return true;
      }
    }
    return false;
  };

  // Create a mask buffer
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isOldLogoOrArtifact(x, y)) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Dilate mask slightly (by 2 pixels) so no fringe remains
  const dilatedMask = new Uint8Array(mask);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mask[y * width + x] === 1) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              dilatedMask[ny * width + nx] = 1;
            }
          }
        }
      }
    }
  }

  // Fill inpainted pixels using nearest valid background pixels + natural noise
  const resultData = Buffer.from(data);

  // Iterative inpainting from boundary inward
  let remaining = 0;
  for (let i = 0; i < dilatedMask.length; i++) if (dilatedMask[i] === 1) remaining++;

  console.log('Pixels to inpaint:', remaining);

  // Sample texture offsets: search for the closest non-mask pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dilatedMask[y * width + x] === 1) {
        // Find nearest clean pixel along horizontal/vertical
        let found = false;
        for (let r = 3; r < 70; r++) {
          // Check angles
          const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2, Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
          for (let a of angles) {
            const sx = Math.round(x + r * Math.cos(a));
            const sy = Math.round(y + r * Math.sin(a));
            if (sx >= 0 && sx < width && sy >= 0 && sy < height && dilatedMask[sy * width + sx] === 0) {
              const srcIdx = (sy * width + sx) * channels;
              const dstIdx = (y * width + x) * channels;
              resultData[dstIdx] = data[srcIdx];
              resultData[dstIdx+1] = data[srcIdx+1];
              resultData[dstIdx+2] = data[srcIdx+2];
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }
    }
  }

  // Save clean background
  const cleanBgBuffer = await sharp(resultData, {
    raw: { width, height, channels }
  }).png().toBuffer();

  // Now overlay the new mizaan logo
  const logoPath = path.join(__dirname, '..', 'public', 'mizaan-transparent.png');
  const trimmedLogoBuffer = await sharp(logoPath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedLogoBuffer).metadata();

  const targetLogoWidth = 420;
  const targetLogoHeight = Math.round(trimmedMeta.height * (targetLogoWidth / trimmedMeta.width));

  const resizedLogo = await sharp(trimmedLogoBuffer)
    .resize(targetLogoWidth, targetLogoHeight, { fit: 'contain' })
    .toBuffer();

  const logoLeft = Math.round((width - targetLogoWidth) / 2) - 15;
  const logoTop = 165;

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

  const finalBuffer = await sharp(cleanBgBuffer)
    .composite([
      { input: resizedLogo, top: logoTop, left: logoLeft },
      { input: textSvg, top: 0, left: 0 }
    ])
    .png()
    .toBuffer();

  const texturePath = path.join(__dirname, '..', 'public', 'branding-texture.png');
  await sharp(finalBuffer).toFile(texturePath);
  console.log('Finished perfect inpaint & composite!');
}

testInpaint().catch(console.error);
