
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase'; // Initialize app properly from firebase.ts

/**
 * Uploads an image to Firebase Storage (Replacing Cloudinary due to preset errors)
 */
export const uploadImageToCloudinary = async (file: File | Blob): Promise<string> => {
  try {
    const storage = getStorage(app);
    // Create a unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `uploads/${timestamp}-${randomString}`;
    
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Firebase Storage Upload Error:', error);
    throw new Error(error.message || 'Error uploading image to storage');
  }
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
