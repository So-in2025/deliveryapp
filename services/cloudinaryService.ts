
/**
 * Cloudinary Service for handling image uploads
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dfrb7fkni';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'; // Fallback to a default if not set

export const uploadImageToCloudinary = async (file: File | Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error uploading image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

/**
 * Helper to handle file input changes and upload
 */
export const handleImageUpload = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // You could implement progress tracking if needed using XMLHttpRequest instead of fetch
  return await uploadImage(file);
};
