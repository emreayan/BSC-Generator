import { supabase } from './supabaseClient';

export const storageService = {
    /**
     * Uploads a file to Supabase Storage bucket 'images'
     * @param file The file object (Blob, File, or base64 dataURL)
     * @param path The path/filename in the bucket
     * @returns The public URL of the uploaded image
     */
    async uploadImage(file: File | Blob | string, path: string): Promise<string> {
        let uploadFile: File | Blob;

        if (typeof file === 'string' && file.startsWith('data:')) {
            // Convert dataURL to Blob
            uploadFile = this.dataURLToBlob(file);
        } else if (typeof file === 'string') {
            throw new Error("Invalid file format. Expected File, Blob or DataURL.");
        } else {
            uploadFile = file;
        }

        // 1. Generate a unique filename
        const fileExt = uploadFile instanceof File ? uploadFile.name.split('.').pop() : 'jpg';
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        // 2. Upload to 'images' bucket
        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, uploadFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            throw error;
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    /**
     * Converts a Data URL (base64) to a Blob object
     */
    dataURLToBlob(dataURL: string): Blob {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
};
