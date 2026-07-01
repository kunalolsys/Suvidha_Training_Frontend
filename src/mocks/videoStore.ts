import { videos as initialVideos, type Video } from '@/mocks/videos';

let videoStore = [...initialVideos];

export function getAllVideos(): Video[] {
  return [...videoStore];
}

export function getVideoById(id: string): Video | undefined {
  return videoStore.find((v) => v.id === id);
}

export function addVideo(video: Video): void {
  videoStore = [...videoStore, video];
}

export function updateVideo(id: string, updates: Partial<Video>): void {
  videoStore = videoStore.map((v) => (v.id === id ? { ...v, ...updates } : v));
}

export function deleteVideo(id: string): void {
  videoStore = videoStore.filter((v) => v.id !== id);
}

export function getNextVideoId(): string {
  const max = videoStore.reduce((acc, v) => {
    const num = parseInt(v.id.split('-')[1], 10);
    return Math.max(acc, num);
  }, 0);
  return `vid-${String(max + 1).padStart(3, '0')}`;
}