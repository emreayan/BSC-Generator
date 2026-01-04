
/**
 * Compresses and resizes an image file to ensure it's small enough for database storage.
 * @param file The original File object
 * @param maxWidth The maximum width allowed (default 1024px)
 * @param quality The JPEG quality (0 to 1, default 0.7)
 * @returns Promise resolving to the base64 string
 */
export const compressImage = (file: File, maxWidth = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;

        const ctx = elem.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failure'));
          return;
        }

        // CRITICAL: Clear canvas to ensure it is transparent before drawing
        // This prevents black backgrounds on transparent PNGs
        ctx.clearRect(0, 0, width, height);

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        // STRICTLY use PNG if input is PNG, WebP or GIF to preserve transparency
        let outputFormat = 'image/jpeg';
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        if (
            fileType.includes('png') || 
            fileType.includes('webp') || 
            fileType.includes('gif') || 
            fileName.endsWith('.png') ||
            fileName.endsWith('.webp')
        ) {
            outputFormat = 'image/png';
        }

        // Convert to Base64
        // Note: 'quality' argument is generally ignored for image/png
        const dataUrl = elem.toDataURL(outputFormat, quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
