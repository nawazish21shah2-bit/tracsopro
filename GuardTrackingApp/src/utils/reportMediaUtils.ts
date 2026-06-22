import { userApi } from '../services/api/userApi';

export interface ReportMediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
}

export function photoToReportMediaItem(photo: {
  id: string;
  uri: string;
  fileName: string;
  fileSize: number;
  type?: string;
}): ReportMediaItem {
  return {
    id: photo.id,
    uri: photo.uri,
    type: photo.type?.startsWith('video') ? 'video' : 'image',
    fileName: photo.fileName,
    fileSize: photo.fileSize,
  };
}

/** Upload local media URIs and return server URLs for incident report payload. */
export async function uploadReportMediaItems(
  items: ReportMediaItem[],
): Promise<{ url: string; type: 'image' | 'video'; name?: string }[]> {
  const uploaded: { url: string; type: 'image' | 'video'; name?: string }[] = [];

  for (const item of items) {
    if (item.type === 'video') {
      uploaded.push({ url: item.uri, type: 'video', name: item.fileName });
      continue;
    }

    if (item.uri.startsWith('http')) {
      uploaded.push({ url: item.uri, type: 'image', name: item.fileName });
      continue;
    }

    const result = await userApi.uploadProfilePicture(item.uri);
    if (result.success && result.data?.url) {
      uploaded.push({ url: result.data.url, type: 'image', name: item.fileName });
    }
  }

  return uploaded;
}
