// Video management functions
class VideoManager {
    constructor() {
        this.supabase = window.supabase;
    }

    // Upload video to Supabase Storage
    async uploadVideo(file, title, description, onProgress = null) {
        try {
            const user = await window.authManager.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            // Validate file type
            const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Hanya file video yang diperbolehkan (MP4, MOV, AVI, MPEG)');
            }

            // Validate file size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('File terlalu besar! Maksimal 50MB.');
            }

            // Generate unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `videos/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload file to storage with progress
            const { data, error } = await this.supabase.storage
                .from('videos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                    onUploadProgress: (progress) => {
                        if (onProgress) {
                            const percentage = (progress.loaded / progress.total) * 100;
                            onProgress(percentage);
                        }
                    }
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('videos')
                .getPublicUrl(data.path);

            // Save video metadata to database
            const { error: dbError } = await this.supabase
                .from('videos')
                .insert([
                    {
                        title: title,
                        description: description,
                        file_name: file.name,
                        file_size: file.size,
                        file_type: file.type,
                        storage_path: data.path,
                        video_url: publicUrl,
                        uploaded_by: user.id,
                        duration: 0, // You can extract duration if needed
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (dbError) throw dbError;

            return { success: true, videoUrl: publicUrl };

        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all videos
    async getAllVideos() {
        try {
            // First, get all videos
            const { data: videos, error: videosError } = await this.supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (videosError) throw videosError;

            // If no videos, return empty array
            if (!videos || videos.length === 0) {
                return { success: true, videos: [] };
            }

            // Get user profiles for all uploaded_by
            const userIds = [...new Set(videos.map(video => video.uploaded_by))];
            
            const { data: profiles, error: profilesError } = await this.supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            if (profilesError) {
                console.error('Profiles fetch error:', profilesError);
                // Return videos without profiles if error
                const videosWithoutProfiles = videos.map(video => ({
                    ...video,
                    profiles: { full_name: 'Unknown User', email: 'unknown@email.com' }
                }));
                return { success: true, videos: videosWithoutProfiles };
            }

            // Combine videos with profiles
            const videosWithProfiles = videos.map(video => {
                const profile = profiles.find(p => p.id === video.uploaded_by);
                return {
                    ...video,
                    profiles: profile || { full_name: 'Unknown User', email: 'unknown@email.com' }
                };
            });

            return { success: true, videos: videosWithProfiles };

        } catch (error) {
            console.error('Get videos error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get video by ID
    async getVideoById(videoId) {
        try {
            const { data: video, error } = await this.supabase
                .from('videos')
                .select(`
                    *,
                    profiles:uploaded_by(full_name, email)
                `)
                .eq('id', videoId)
                .single();

            if (error) throw error;
            return { success: true, video: video };

        } catch (error) {
            console.error('Get video error:', error);
            return { success: false, error: error.message };
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize video manager
window.videoManager = new VideoManager();
