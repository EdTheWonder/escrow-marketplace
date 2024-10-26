const CLOUD_NAME = 'dnwxgyfrs';
const UPLOAD_PRESET = 'ml_default'; // You'll need to create an unsigned upload preset in Cloudinary dashboard
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export async function uploadToR2(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'buyby');

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload response:', errorData);
      throw new Error('Upload failed: ' + errorData.error?.message || 'Unknown error');
    }

    const data = await response.json();
    console.log('Upload successful:', data); // Add this log
    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteFromR2(url: string) {
  // Note: Client-side deletion is not recommended for security reasons
  // You should implement this in a server API route if needed
  console.warn('Image deletion should be implemented server-side');
}
