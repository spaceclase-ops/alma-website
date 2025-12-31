import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Play, X } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

const VideoCarousel: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const videoIds = [
    'w2uTr4R4EUI',
    'H0tWwoMGRTU',
    'kMWZC5JqTC8',
    '-HdIJaIEBdY',
    'd80EhISSkh4',
    'QX5kHW3PqSU',
    'XF6Ql027j0M',
    'ijveEKP4Zxc',
    'ovbPs7tOp9c',
    'QRfc6idy2Z4'
  ];

  useEffect(() => {
    const fetchVideoTitles = async () => {
      try {
        const videoData = await Promise.all(
          videoIds.map(async (id) => {
            try {
              const response = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
              );
              if (response.ok) {
                const data = await response.json();
                return {
                  id,
                  title: data.title,
                  thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
                };
              }
            } catch (error) {
              console.error(`Error fetching video ${id}:`, error);
            }
            return {
              id,
              title: `סרטון ${videoIds.indexOf(id) + 1}`,
              thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
            };
          })
        );
        setVideos(videoData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setLoading(false);
      }
    };

    fetchVideoTitles();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, videos.length - 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const openVideo = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-alma-dark mb-4">טוען סרטונים...</h2>
          </div>
        </div>
      </section>
    );
  }

  const visibleVideos = videos.slice(currentIndex, currentIndex + 3);
  const mobileVisibleVideos = videos.slice(0, Math.min(2, videos.length));

  return (
    <>
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-alma-primary font-semibold text-lg mb-3 uppercase tracking-widest">תוכן וידאו</h2>
            <h3 className="text-4xl font-bold text-alma-dark mb-4">סרטונים מהשטח</h3>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block relative">
            <div className="overflow-hidden">
              <div 
                className="flex gap-6 transition-transform duration-500"
                style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
              >
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex-shrink-0 w-[calc(33.333%-1rem)]"
                  >
                    <div
                      onClick={() => openVideo(video.id)}
                      className="group relative aspect-[9/16] rounded-[3rem] overflow-hidden cursor-pointer bg-alma-dark shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                    >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                      }}
                    />
                    
                    {/* Overlay with title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-4">
                        <h4 className="text-white font-bold text-lg leading-tight line-clamp-2">
                          {video.title}
                        </h4>
                      </div>
                    </div>

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-full p-6 group-hover:scale-110 transition-transform duration-300">
                        <Play size={48} className="text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {videos.length > 3 && (
              <>
                <button
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-xl rounded-full p-3 hover:bg-alma-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  aria-label="סרטון קודם"
                >
                  <ChevronRight size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={currentIndex >= videos.length - 3}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-xl rounded-full p-3 hover:bg-alma-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  aria-label="סרטון הבא"
                >
                  <ChevronLeft size={24} />
                </button>
              </>
            )}
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {videos.map((video, idx) => (
                <div
                  key={video.id}
                  className="flex-shrink-0 w-[85%]"
                  style={{ marginRight: idx < videos.length - 1 ? '1rem' : '0' }}
                >
                  <div
                    onClick={() => openVideo(video.id)}
                    className="group relative aspect-[9/16] rounded-[3rem] overflow-hidden cursor-pointer bg-alma-dark shadow-xl"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                      }}
                    />
                    
                    {/* Overlay with title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 mb-3">
                        <h4 className="text-white font-bold text-base leading-tight line-clamp-2">
                          {video.title}
                        </h4>
                      </div>
                    </div>

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-full p-4">
                        <Play size={32} className="text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {videos.slice(0, Math.min(5, videos.length)).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const scrollContainer = document.querySelector('.overflow-x-auto');
                    if (scrollContainer) {
                      const cardWidth = scrollContainer.querySelector('.w-\\[85\\%]')?.clientWidth || 0;
                      scrollContainer.scrollTo({ left: idx * (cardWidth + 16), behavior: 'smooth' });
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === 0 ? 'bg-alma-primary w-8' : 'bg-gray-300'
                  }`}
                  aria-label={`עבור לסרטון ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeVideo}
          style={{
            animation: 'fadeIn 0.3s ease-out forwards'
          }}
        >
          <div className="absolute inset-0 bg-alma-dark/95 backdrop-blur-3xl" />
          <div
            className="relative w-full max-w-[420px] aspect-[9/16] rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(14,165,233,0.4)] border-[4px] border-white/10 scale-95"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'scaleUp 0.3s ease-out forwards'
            }}
          >
            <button
              onClick={closeVideo}
              className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md text-white rounded-full p-2 hover:bg-white/20 transition-all shadow-lg"
              aria-label="סגור"
            >
              <X size={24} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default VideoCarousel;

