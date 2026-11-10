/** Adds a visible Asia Electronics mark while preserving the original image separately. */
export async function applyWatermarkToImage(source: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Could not prepare image watermark."));

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const fontSize = Math.max(15, Math.round(Math.min(canvas.width, canvas.height) * 0.045));
      const padding = Math.max(10, Math.round(fontSize * 0.7));
      context.font = `700 ${fontSize}px Arial, sans-serif`;
      context.textBaseline = "middle";
      const text = "ASIA ELECTRONICS";
      const textWidth = context.measureText(text).width;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = fontSize + padding * 1.5;
      const x = canvas.width - boxWidth - padding;
      const y = canvas.height - boxHeight - padding;

      context.fillStyle = "rgba(0, 0, 0, 0.58)";
      context.fillRect(x, y, boxWidth, boxHeight);
      context.fillStyle = "rgba(255, 255, 255, 0.94)";
      context.fillText(text, x + padding, y + boxHeight / 2);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => reject(new Error("This image cannot be watermarked. Use an uploaded image or a CORS-enabled URL."));
    image.src = source;
  });
}
