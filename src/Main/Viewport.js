import React, {useState, useEffect, useRef} from "react";
import {useInView} from "react-intersection-observer";
import image from "../data.js";
import "../style/Viewport.css";

// Huffman Node for building compression tree
class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
    this.code = "";
  }
}

// Format file size helper
const formatFileSize = bytes => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / 1048576).toFixed(2) + " MB";
};

// Custom Huffman encoding implementation
const buildHuffmanTree = data => {
  // Count frequency of each byte
  const freqMap = {};
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    freqMap[byte] = (freqMap[byte] || 0) + 1;
  }

  // Create nodes for each byte
  let nodes = Object.keys(freqMap).map(
    char => new HuffmanNode(char, freqMap[char])
  );

  // Handle edge cases
  if (nodes.length <= 1) {
    const node = nodes[0] || new HuffmanNode("0", 1);
    const codes = {};
    codes[node.char] = "0";
    return {tree: node, codes};
  }

  // Build Huffman tree
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
    nodes.push(parent);
  }

  // Generate codes
  const huffmanCodes = {};
  const root = nodes[0];

  const assignCodes = (node, code) => {
    if (node) {
      node.code = code;
      if (node.char) {
        huffmanCodes[node.char] = code;
      }
      assignCodes(node.left, code + "0");
      assignCodes(node.right, code + "1");
    }
  };

  assignCodes(root, "");
  return {tree: root, codes: huffmanCodes};
};

// Function to compress data using Huffman codes
const compressData = (data, codes) => {
  let compressed = "";
  for (let i = 0; i < data.length; i++) {
    compressed += codes[data[i]];
  }

  // Convert bit string to byte array for size calculation
  const compressedData = new Uint8Array(Math.ceil(compressed.length / 8));
  for (let i = 0; i < compressed.length; i += 8) {
    const byte = compressed.substr(i, 8).padEnd(8, "0");
    compressedData[i / 8] = parseInt(byte, 2);
  }

  return compressedData;
};

// Image component with intersection observer and Huffman compression
const LazyImage = ({imageData}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: "100px",
  });

  const [loaded, setLoaded] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Process image when it comes into view
  useEffect(() => {
    if (inView) {
      processImageWithHuffman();
    }
  }, [inView]);

  // Function to load image and apply Huffman compression
  const processImageWithHuffman = async () => {
    try {
      // Try loading image from different paths
      let response = null;
      for (const path of imageData.paths) {
        try {
          console.log(`Trying to load from: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            console.log(`Successfully loaded from: ${path}`);
            break;
          }
        } catch (e) {
          console.log(`Failed to load from ${path}:`, e);
        }
      }

      if (!response || !response.ok) {
        console.error(`Failed to load image: ${imageData.name}`);
        return;
      }

      // Get image data as array buffer for compression
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log(`Got image data, size: ${uint8Array.length} bytes`);

      // Apply Huffman compression using our custom implementation
      console.time("Huffman compression");
      const {codes} = buildHuffmanTree(uint8Array);
      const compressed = compressData(uint8Array, codes);
      console.timeEnd("Huffman compression");

      // Calculate compression stats
      const originalSize = uint8Array.length;
      const compressedSize = compressed.length;
      const compressionRatio = compressedSize / originalSize;
      const savings = ((1 - compressionRatio) * 100).toFixed(2);

      console.log(`Original size: ${originalSize} bytes`);
      console.log(`Compressed size: ${compressedSize} bytes`);
      console.log(`Compression ratio: ${compressionRatio}`);
      console.log(`Space savings: ${savings}%`);

      setCompressionInfo({
        originalSize,
        compressedSize,
        compressionRatio,
        savings,
      });

      setLoaded(true);
    } catch (error) {
      console.error(`Error processing image: ${error.message}`, error);
    }
  };

  return (
    <div ref={ref} className="image-item">
      <div className="image-container">
        {inView ? (
          <img
            src={imageData.paths[0]}
            alt={imageData.name}
            className={`lazy-image ${loaded ? "loaded" : ""}`}
            onLoad={() => setLoaded(true)}
            onError={e => {
              console.log(`Error loading image from ${e.target.src}`);
              // Try alternative paths if first one fails
              if (
                imageData.paths.length > 1 &&
                e.target.src === imageData.paths[0]
              ) {
                console.log(`Trying alternative path: ${imageData.paths[1]}`);
                e.target.src = imageData.paths[1];
              } else if (
                imageData.paths.length > 2 &&
                e.target.src === imageData.paths[1]
              ) {
                console.log(`Trying alternative path: ${imageData.paths[2]}`);
                e.target.src = imageData.paths[2];
              }
            }}
          />
        ) : (
          <div className="image-placeholder">Loading...</div>
        )}
      </div>

      <div className="image-info">
        <h3>{imageData.name}</h3>

        {compressionInfo && (
          <div className="compression-summary">
            <p className="compression-ratio">
              <strong>Compression:</strong> {compressionInfo.savings}% reduced
            </p>
            <button
              className="view-details-button"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "View Details"}
            </button>
          </div>
        )}

        {showDetails && compressionInfo && (
          <div className="compression-details">
            <div className="detail-item">
              <span>Original Size:</span>
              <span>{formatFileSize(compressionInfo.originalSize)}</span>
            </div>
            <div className="detail-item">
              <span>Compressed Size:</span>
              <span>{formatFileSize(compressionInfo.compressedSize)}</span>
            </div>
            <div className="detail-item">
              <span>Compression Ratio:</span>
              <span>
                {(compressionInfo.compressionRatio * 100).toFixed(2)}%
              </span>
            </div>
            <div className="detail-item">
              <span>Space Savings:</span>
              <span>{compressionInfo.savings}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Viewport() {
  return (
    <div className="viewport">
      <h1>Image Gallery with Lazy Loading & Huffman Compression</h1>
      <div className="image-grid">
        {image.map(imageItem => (
          <LazyImage key={imageItem.key} imageData={imageItem} />
        ))}
      </div>
    </div>
  );
}
