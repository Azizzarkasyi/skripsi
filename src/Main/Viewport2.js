import React, {useState, useEffect} from "react";
import {useInView} from "react-intersection-observer";
import image from "../data.js";
import "../style/Viewport.css";

// Format file size helper
const formatFileSize = bytes => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / 1048576).toFixed(2) + " MB";
};

// Image component with intersection observer (without compression)
const LazyImage = ({imageData}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: "100px",
  });

  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Process image when it comes into view
  useEffect(() => {
    if (inView) {
      processImage();
    }
  }, [inView]);

  // Function to load image and get its size
  const processImage = async () => {
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

      // Get image data size
      const blob = await response.blob();
      const size = blob.size;

      console.log(`Got image data, size: ${size} bytes`);

      setImageSize(size);
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

        {imageSize && (
          <div className="compression-summary">
            <p className="file-size">
              <strong>File Size:</strong> {formatFileSize(imageSize)}
            </p>
            <button
              className="view-details-button"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "View Details"}
            </button>
          </div>
        )}

        {showDetails && imageSize && (
          <div className="compression-details">
            <div className="detail-item">
              <span>File Size:</span>
              <span>{formatFileSize(imageSize)}</span>
            </div>
            <div className="detail-item">
              <span>Format:</span>
              <span>JPEG</span>
            </div>
            <div className="detail-item">
              <span>Lazy Loaded:</span>
              <span>Yes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Viewport2() {
  return (
    <div className="viewport">
      <h1>Image Gallery with Lazy Loading</h1>
      <div className="image-grid">
        {image.map(imageItem => (
          <LazyImage key={imageItem.key} imageData={imageItem} />
        ))}
      </div>
    </div>
  );
}
