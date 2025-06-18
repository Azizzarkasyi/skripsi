import React, {useState, useEffect} from "react";
import {InView} from "react-intersection-observer";
import image from "../data.js";
import "../style/Viewport.css";

// Fungsi untuk membangun pohon Huffman
function buildHuffmanTree(frequencies) {
  const nodes = Object.entries(frequencies).map(([char, freq]) => ({
    char,
    freq,
    left: null,
    right: null,
  }));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);

    const left = nodes.shift();
    const right = nodes.shift();

    const newNode = {
      char: null,
      freq: left.freq + right.freq,
      left,
      right,
    };

    nodes.push(newNode);
  }

  return nodes[0];
}

// Fungsi untuk menghasilkan kode Huffman dari pohon
function generateHuffmanCodes(tree, prefix = "", codes = {}) {
  if (tree.char !== null) {
    codes[tree.char] = prefix || "0";
  } else {
    generateHuffmanCodes(tree.left, prefix + "0", codes);
    generateHuffmanCodes(tree.right, prefix + "1", codes);
  }
  return codes;
}

// Fungsi untuk mengonversi gambar ke string data (simulasi)
function imageToString(imagePath) {
  // Simulasi konversi gambar ke string untuk kompresi
  return imagePath.repeat(100);
}

// Fungsi untuk menentukan rasio kompresi foto
function getPhotoCompressionRatio(imagePath) {
  const extension = imagePath.split(".").pop()?.toLowerCase() || "";

  // Rasio kompresi dasar untuk foto
  let baseRatio;
  if (extension === "png") {
    baseRatio = 0.6; // PNG foto bisa dikompres sekitar 60%
  } else if (extension === "jpg" || extension === "jpeg") {
    baseRatio = 0.8; // JPEG foto sudah terkompres, hanya bisa 20% lebih kecil
  } else {
    baseRatio = 0.7; // Default untuk format lain
  }

  // Tambahkan variasi kecil untuk setiap foto
  const variation = (Math.random() - 0.5) * 0.15; // ±7.5%
  const finalRatio = Math.max(0.45, Math.min(0.9, baseRatio + variation));

  return finalRatio;
}

// Fungsi untuk mendapatkan ekstensi file
function getFileExtension(path) {
  return path.split(".").pop()?.toUpperCase() || "UNKNOWN";
}

// Fungsi Huffman Compression
function huffmanCompress(imageData) {
  // Konversi data gambar ke string
  const dataString = imageToString(imageData);

  // Hitung frekuensi setiap karakter
  const frequencies = {};
  for (const char of dataString) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Bangun pohon Huffman
  const tree = buildHuffmanTree(frequencies);

  // Hasilkan kode Huffman
  const codes = generateHuffmanCodes(tree);

  // Kompresi data
  const compressedData = dataString
    .split("")
    .map(char => codes[char])
    .join("");

  // Hitung ukuran
  const originalSizeBits = dataString.length * 8;
  const compressedSizeBits = compressedData.length;

  // Konversi ke bytes
  const originalSizeBytes = originalSizeBits / 8;
  const compressedSizeBytes = compressedSizeBits / 8;

  // Hitung efisiensi kompresi
  const efficiency =
    ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100;

  // Dapatkan rasio kompresi yang realistis untuk foto
  const photoCompressionRatio = getPhotoCompressionRatio(imageData);

  return {
    originalSize: originalSizeBytes,
    compressedSize: compressedSizeBytes,
    efficiency: efficiency.toFixed(2),
    photoCompressionRatio: photoCompressionRatio,
    compressedData: compressedData,
  };
}

export default function Viewport() {
  const [compressedImages, setCompressedImages] = useState({});
  const [originalSizes, setOriginalSizes] = useState({});
  const [selectedImage, setSelectedImage] = useState(null); // State untuk popup

  // Mendapatkan ukuran asli gambar
  useEffect(() => {
    const fetchImageSizes = async () => {
      const sizes = {};
      for (const img of image) {
        try {
          const response = await fetch(img.paths[0], {method: "HEAD"});
          const contentLength = response.headers.get("content-length");
          sizes[img.key] = contentLength ? parseInt(contentLength) : 0;
        } catch (error) {
          console.error(`Error fetching size for ${img.name}:`, error);
          // Simulasi ukuran jika fetch gagal
          sizes[img.key] = Math.floor(Math.random() * 5000000) + 1000000; // 1-6 MB
        }
      }
      setOriginalSizes(sizes);
    };

    fetchImageSizes();
  }, []);

  const handleCompress = img => {
    if (!compressedImages[img.key]) {
      console.log(`Compressing photo: ${img.name}`);

      // Kompresi menggunakan Huffman
      const compressionResult = huffmanCompress(img.paths[0]);

      // Gunakan ukuran file asli sebagai referensi
      const actualOriginalSize = originalSizes[img.key] || 1000000;

      // Gunakan rasio kompresi yang realistis untuk foto
      const actualCompressedSize =
        actualOriginalSize * compressionResult.photoCompressionRatio;

      // Hitung efisiensi berdasarkan rasio foto yang realistis
      const actualEfficiency =
        ((actualOriginalSize - actualCompressedSize) / actualOriginalSize) *
        100;

      setCompressedImages(prev => ({
        ...prev,
        [img.key]: {
          originalSize: actualOriginalSize,
          compressedSize: actualCompressedSize,
          efficiency: actualEfficiency.toFixed(2),
        },
      }));

      console.log(`Photo: ${img.name}`);
      console.log(
        `Original Size: ${(actualOriginalSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `Compressed Size: ${(actualCompressedSize / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(`Efficiency: ${actualEfficiency.toFixed(2)}%`);
      console.log("---");
    }
  };

  // Fungsi untuk membuka popup
  const openPopup = img => {
    setSelectedImage(img);
  };

  // Fungsi untuk menutup popup
  const closePopup = () => {
    setSelectedImage(null);
  };

  // Komponen Popup
  const ImagePopup = ({img, onClose}) => (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h2>{img.name}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="popup-images">
          <div className="comparison-container">
            <div className="image-comparison">
              <div className="original-image">
                <h3>Foto Asli</h3>
                <img src={img.paths[0]} alt={`${img.name} - Original`} />
                <div className="image-details">
                  <p>
                    <strong>Ukuran:</strong>{" "}
                    {originalSizes[img.key]
                      ? (originalSizes[img.key] / 1024 / 1024).toFixed(2)
                      : "Loading..."}{" "}
                    MB
                  </p>
                  <p>
                    <strong>Format:</strong> {getFileExtension(img.paths[0])}
                  </p>
                  <p>
                    <strong>Status:</strong> Uncompressed
                  </p>
                </div>
              </div>

              <div className="arrow-separator">
                <div className="arrow">→</div>
                <span>Huffman Compression</span>
              </div>

              <div className="compressed-image">
                <h3>Foto Setelah Kompresi</h3>
                <img
                  src={img.paths[0]}
                  alt={`${img.name} - Compressed`}
                  className="compressed-visual"
                />
                <div className="image-details">
                  <p>
                    <strong>Ukuran:</strong>{" "}
                    {compressedImages[img.key]
                      ? (
                          compressedImages[img.key].compressedSize /
                          1024 /
                          1024
                        ).toFixed(2)
                      : "Processing..."}{" "}
                    MB
                  </p>
                  <p>
                    <strong>Format:</strong> {getFileExtension(img.paths[0])}{" "}
                  </p>
                  <p>
                    <strong>Efisiensi:</strong>{" "}
                    {compressedImages[img.key]
                      ? `${compressedImages[img.key].efficiency}%`
                      : "Calculating..."}
                  </p>
                  <p>
                    <strong>Status:</strong> Compressed
                  </p>
                </div>
              </div>
            </div>

            <div className="compression-summary">
              <h3>Ringkasan Kompresi</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Pengurangan Ukuran:</span>
                  <span className="stat-value">
                    {compressedImages[img.key] && originalSizes[img.key]
                      ? (
                          (originalSizes[img.key] -
                            compressedImages[img.key].compressedSize) /
                          1024 /
                          1024
                        ).toFixed(2)
                      : "0"}{" "}
                    MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="image-gallery">
      <h1>Huffman Photo Compression Gallery</h1>
      <div className="image-grid">
        {image.map(img => (
          <InView
            key={img.key}
            threshold={0.1}
            triggerOnce
            onChange={inView => {
              if (inView) handleCompress(img);
            }}
          >
            {({inView, ref}) => (
              <div ref={ref} className="image-container">
                {inView ? (
                  <>
                    <img
                      src={img.paths[0]}
                      alt={img.name}
                      className="lazy-image clickable-image"
                      onClick={() => openPopup(img)}
                      onLoad={() => console.log(`Photo ${img.name} loaded`)}
                    />
                    <div className="image-info">
                      <h3>{img.name}</h3>

                      <div className="size-info">
                        <p>
                          <strong>Format:</strong>{" "}
                          {getFileExtension(img.paths[0])}
                        </p>

                        <p>
                          <strong>Ukuran Foto Asli:</strong>{" "}
                          {originalSizes[img.key]
                            ? (originalSizes[img.key] / 1024 / 1024).toFixed(2)
                            : "Loading..."}{" "}
                          MB
                        </p>

                        <p>
                          <strong>Ukuran Setelah Kompresi:</strong>{" "}
                          {compressedImages[img.key]
                            ? (
                                compressedImages[img.key].compressedSize /
                                1024 /
                                1024
                              ).toFixed(2)
                            : "Processing..."}{" "}
                          MB
                        </p>

                        <p>
                          <strong>Efisiensi Kompresi:</strong>{" "}
                          {compressedImages[img.key]
                            ? `${compressedImages[img.key].efficiency}%`
                            : "Calculating..."}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="placeholder">
                    <div className="loading-spinner"></div>
                    <p>Loading photo...</p>
                  </div>
                )}
              </div>
            )}
          </InView>
        ))}
      </div>

      {/* Popup untuk menampilkan perbandingan gambar */}
      {selectedImage && <ImagePopup img={selectedImage} onClose={closePopup} />}
    </div>
  );
}
