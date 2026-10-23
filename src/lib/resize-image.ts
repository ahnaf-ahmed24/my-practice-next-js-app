// ক্লায়েন্ট-সাইড ছবি প্রসেসিং — আপলোডের আগে ছবি ছোট করে সংকুচিত করে
// (অটলাসে ছোট ফাইল যায়, লোডও দ্রুত হয়)

// সর্বোচ্চ প্রস্থ/উচ্চতা (পিক্সেল)
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

type ResizedImage = { blob: Blob; type: string };

// ছবি লোড করে — createImageBitmap EXIF রোটেশন মেনে চলে, সাপোর্ট না থাকলে <img> দিয়ে
const loadImage = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
    try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        return await createImageBitmap(file);
    }
};

// ফাইল থেকে ছবি রিসাইজ করে JPEG ব্লব ফেরত দেয় (সর্বোচ্চ ৫১২px)
export const resizeProfileImage = async (file: File): Promise<ResizedImage> => {
    const image = await loadImage(file);
    const width = 'naturalWidth' in image ? image.naturalWidth : image.width;
    const height = 'naturalHeight' in image ? image.naturalHeight : image.height;

    if (!width || !height) throw new Error('Could not read image dimensions.');

    const longestSide = Math.max(width, height);
    // বড় হলে শুধু ছোট করি, ছোট ছবি বড় করি না
    const scale = longestSide > MAX_DIMENSION ? MAX_DIMENSION / longestSide : 1;

    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not supported in this browser.');

    // সাদা ব্যাকগ্রাউন্ড — PNG-এর স্বচ্ছ অংশ কালো না দেখাতে
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    if ('close' in image) image.close();

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) throw new Error('Could not process the image.');

    return { blob, type: blob.type || 'image/jpeg' };
};
