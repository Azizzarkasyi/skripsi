const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const {compare} = require("image-ssim");

async function prepareImage(filePath, size = 256) {
  const buffer = await fs.readFile(filePath);
  return sharp(buffer)
    .resize(size, size, {fit: "cover"})
    .grayscale()
    .raw()
    .toBuffer({resolveWithObject: true});
}

async function compareSSIM(originalPath, compressedPath) {
  const img1 = await prepareImage(originalPath);
  const img2 = await prepareImage(compressedPath);

  const ssimResult = compare(
    {data: img1.data, width: img1.info.width, height: img1.info.height},
    {data: img2.data, width: img2.info.width, height: img2.info.height}
  );

  return ssimResult.ssim;
}

(async () => {
  const imagesDir = path.join(__dirname, "storage", "images");
  const processedDir = path.join(__dirname, "storage", "processed");

  const fileNames = await fs.readdir(imagesDir);
  const imageFiles = fileNames.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

  let totalScore = 0;
  let count = 0;

  for (const fileName of imageFiles) {
    const original = path.join(imagesDir, fileName);
    const compressed = path.join(processedDir, fileName);

    try {
      // Pastikan file hasil kompresi ada
      await fs.access(compressed);
      const score = await compareSSIM(original, compressed);
      console.log(`${fileName}: SSIM Score = ${score.toFixed(4)}`);
      totalScore += score;
      count++;
    } catch (err) {
      console.warn(
        `${fileName}: Tidak ditemukan file hasil kompresi atau gagal membandingkan.`
      );
    }
  }

  if (count > 0) {
    const avg = totalScore / count;
    console.log("--------------------------------------------------");
    console.log(`Rata-rata SSIM semua gambar: ${avg.toFixed(4)}`);
  } else {
    console.log("Tidak ada gambar yang bisa dibandingkan.");
  }
})();
