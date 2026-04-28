
/**
 * Carga una imagen a Cloudinary de forma no firmada (unsigned)
 * y devuelve la URL de la imagen cargada.
 */
export const uploadImageToCloudinary = async (file: File | Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Debes configurar VITE_CLOUDINARY_UPLOAD_PRESET en Settings (Variables de entorno) o el código fallará.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error en Cloudinary: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url;
};

/**
 * Helper to handle file input changes and upload
 */
export const handleImageUpload = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return await uploadImageToCloudinary(file);
};
