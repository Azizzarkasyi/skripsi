const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
const PORT = 4000;

app.use(cors({origin: "http://localhost:3000"}));
const IMAGES_DIR = path.join(__dirname, "storage", "images2");
const PROCESSED_DIR = path.join(__dirname, "storage", "processed2");
app.use("/uploads", express.static(IMAGES_DIR));
app.use("/processed", express.static(PROCESSED_DIR));

async function createProcessedImage(imageName) {
  const originalPath = path.join(IMAGES_DIR, imageName);
  const processedPath = path.join(PROCESSED_DIR, imageName);
  const extension = path.extname(imageName).toLowerCase();

  try {
    await fs.access(processedPath);
    return;
  } catch (error) {
    console.log(`PROCESSING: Mengoptimalkan ${imageName}...`);

    const originalBuffer = await fs.readFile(originalPath);
    const originalSize = originalBuffer.length;
    let processedBuffer;

    if (extension === ".jpg" || extension === ".jpeg") {
      processedBuffer = await sharp(originalBuffer)
        .jpeg({quality: 70, mozjpeg: true})
        .toBuffer();
    } else if (extension === ".png") {
      processedBuffer = await sharp(originalBuffer)
        .png({compressionLevel: 9, palette: true})
        .toBuffer();
    } else {
      processedBuffer = originalBuffer;
    }

    const processedSize = processedBuffer.length;
    const reduction = (1 - processedSize / originalSize) * 100;

    console.log("--------------------------------------------------");
    console.log(`  Analisis untuk: ${imageName}`);
    console.log(`  -> Ukuran Asli    : ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(
      `  -> Ukuran Akhir   : ${(processedSize / 1024).toFixed(2)} KB`
    );
    console.log(`  -> Pengurangan    : ${reduction.toFixed(2)}%`);
    console.log("--------------------------------------------------");

    await fs.writeFile(processedPath, processedBuffer);
  }
}

app.get("/api/images/original", async (req, res) => {
  try {
    const fileNames = await fs.readdir(IMAGES_DIR);
    fileNames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
    const imageFiles = fileNames.filter(file =>
      /\.(png|jpg|jpeg)$/i.test(file)
    );
    const images = imageFiles.map((fileName, index) => ({
      key: `${fileName}-${index}`,
      name: fileName,
      path: `http://localhost:${PORT}/uploads/${fileName}`,
    }));
    res.json(images);
  } catch (error) {
    res.status(500).json({error: "Could not retrieve original image list."});
  }
});

app.get("/api/images/processed", async (req, res) => {
  try {
    const fileNames = await fs.readdir(PROCESSED_DIR);
    fileNames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
    const images = fileNames.map((fileName, index) => ({
      key: `${fileName}-${index}`,
      name: fileName,
      path: `http://localhost:${PORT}/processed/${fileName}`,
    }));
    res.json(images);
  } catch (error) {
    res.status(500).json({error: "Could not retrieve processed image list."});
  }
});

async function preProcessImages() {
  console.log("🚀 Memulai pra-pemrosesan semua gambar...");
  try {
    const fileNames = await fs.readdir(IMAGES_DIR);
    const imageFiles = fileNames.filter(file =>
      /\.(png|jpg|jpeg)$/i.test(file)
    );

    let totalOriginal = 0;
    let totalProcessed = 0;

    for (const imageName of imageFiles) {
      const originalPath = path.join(IMAGES_DIR, imageName);
      const processedPath = path.join(PROCESSED_DIR, imageName);

      const originalStat = await fs.stat(originalPath);
      totalOriginal += originalStat.size;

      await createProcessedImage(imageName);

      try {
        const processedStat = await fs.stat(processedPath);
        totalProcessed += processedStat.size;
      } catch (e) {}
    }

    console.log("--------------------------------------------------");
    console.log(
      `TOTAL UKURAN ASLI      : ${(totalOriginal / (1024 * 1024)).toFixed(
        2
      )} MB`
    );
    console.log(
      `TOTAL UKURAN KOMPRESI  : ${(totalProcessed / (1024 * 1024)).toFixed(
        2
      )} MB`
    );
    const reduction = (1 - totalProcessed / totalOriginal) * 100;
    console.log(`TOTAL PENGURANGAN      : ${reduction.toFixed(2)}%`);
    console.log("--------------------------------------------------");

    console.log("✅ Pra-pemrosesan selesai.");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat pra-pemrosesan:", error);
  }
}

async function ensureDirsExist() {
  await fs.mkdir(PROCESSED_DIR, {recursive: true});
  console.log(`🗂️  Direktori 'processed' sudah siap.`);
}

app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  ensureDirsExist().then(() => preProcessImages());
});
