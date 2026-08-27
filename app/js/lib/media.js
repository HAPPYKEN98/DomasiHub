import { supabase } from './supabase.js';


function safeName(file) {
    return String(file?.name || 'file')
        .replace(/[^\w.\-]+/g, '_')
        .slice(-80);
}


function validateImage(file) {

    if (!file) {
        throw new Error('No image selected.');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error(
            `${file.name} is not an image.`
        );
    }

    const max =
        15 * 1024 * 1024;

    if (file.size > max) {
        throw new Error(
            `${file.name} is larger than 15 MB.`
        );
    }
}


export async function uploadPublic(
    file,
    folder
) {

    if (!file || !file.size) {
        return null;
    }

    validateImage(file);

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(
            'Please sign in first.'
        );
    }

    const path =
        `${user.id}/${folder}/${crypto.randomUUID()}-${safeName(file)}`;

    const {
        error
    } = await supabase
        .storage
        .from('hub-public')
        .upload(
            path,
            file,
            {
                upsert: false,
                contentType: file.type,
                cacheControl: '3600'
            }
        );

    if (error) {
        throw error;
    }

    const {
        data
    } = supabase
        .storage
        .from('hub-public')
        .getPublicUrl(path);

    return data.publicUrl;
}


export async function uploadPublicMany(
    files,
    folder,
    maximum = 3
) {

    const selected =
        Array.from(files || [])
            .filter(file => file?.size)
            .slice(0, maximum);

    if (!selected.length) {
        return [];
    }

    if (selected.length > maximum) {
        throw new Error(
            `You can upload up to ${maximum} images.`
        );
    }

    const urls = [];

    for (const file of selected) {

        const url =
            await uploadPublic(
                file,
                folder
            );

        if (url) {
            urls.push(url);
        }
    }

    return urls;
}


export async function deletePublicFile(
    url
) {

    if (!url) return;

    const marker =
        '/storage/v1/object/public/hub-public/';

    const index =
        url.indexOf(marker);

    if (index === -1) {
        return;
    }

    const path =
        decodeURIComponent(
            url.slice(
                index + marker.length
            )
        );

    const {
        error
    } = await supabase
        .storage
        .from('hub-public')
        .remove([path]);

    if (error) {
        console.error(
            'Storage deletion failed:',
            error
        );
    }
}