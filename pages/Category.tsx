
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  fetchTrending, 
  fetchAwardWinning, 
  fetchNetflixContent, 
  fetchAnime, 
  fetchUpcomingMovies, 
  fetchUpcomingTV,
  fetchComedyTV
} from '../services/tmdbService';
import { Movie } from '../types';
import MediaCard from '../components/MediaCard';
import { GridSkeleton } from '../components/Skeleton';

const Category: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [color, setColor] = useState('#1ce783');

  const loadData = useCallback(async (pageNum: number) => {
    setLoading(true);
    let result: { results: Movie[], totalPages: number } = { results: [], totalPages: 0 };

    try {
      switch (id) {
        case 'trending':
          setTitle('Trending Now');
          setSubtitle('Cinematic Pulse');
          setColor('#1ce783');
          result = await fetchTrending('movie', pageNum);
          break;
        case 'awards':
          setTitle('Award Winning');
          setSubtitle('Critically Acclaimed');
          setColor('#fbbf24');
          result = await fetchAwardWinning('movie', pageNum);
          break;
        case 'netflix':
          setTitle('Netflix Originals');
          setSubtitle('Global Premiere');
          setColor('#e50914');
          result = await fetchNetflixContent(pageNum);
          break;
        case 'anime':
          setTitle('Anime Hits');
          setSubtitle('Rising Sun');
          setColor('#22d3ee');
          result = await fetchAnime(pageNum);
          break;
        case 'anime-action':
          setTitle('Action Anime');
          setSubtitle('Combat & Power');
          setColor('#1ce783');
          result = await fetchAnime(pageNum, 10759);
          break;
        case 'anime-fantasy':
          setTitle('Fantasy Anime');
          setSubtitle('Other Worlds');
          setColor('#22d3ee');
          result = await fetchAnime(pageNum, 10765);
          break;
        case 'tv':
          setTitle('Popular Series');
          setSubtitle('Must Watch');
          setColor('#1ce783');
          result = await fetchTrending('tv', pageNum);
          break;
        case 'comedy-tv':
          setTitle('Comedy Series');
          setSubtitle('Laughter Guaranteed');
          setColor('#f472b6');
          result = await fetchComedyTV(pageNum);
          break;
        case 'upcoming-movies':
          setTitle('Upcoming Movies');
          setSubtitle('Future Hits');
          setColor('#1ce783');
          result = await fetchUpcomingMovies(pageNum);
          break;
        case 'upcoming-tv':
          setTitle('Upcoming Series');
          setSubtitle('Future Hits');
          setColor('#1ce783');
          result = await fetchUpcomingTV(pageNum);
          break;
        default:
          setTitle('Discovery');
          setSubtitle('Explore More');
          result = await fetchTrending('all', pageNum);
      }

      if (pageNum === 1) {
        setMovies(result.results);
      } else {
        setMovies(prev => [...prev, ...result.results]);
      }
      
      setHasMore(pageNum < result.totalPages);
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setPage(1);
    setMovies([]);
    loadData(1);
  }, [id, loadData]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  };

  return (
    <div className="pt-24 md:pt-32 pb-20 min-h-screen bg-[#121212]">
      <div className="px-6 md:px-16 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-4">
          <div className="space-y-2">
            <Link to="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              Back Home
            </Link>
            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color }}>{subtitle}</p>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
              {title.split(' ')[0]} <span style={{ color }}>{title.split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest self-start md:self-auto">
            {movies.length} Titles Loaded
          </div>
        </div>

        {movies.length === 0 && loading ? (
          <GridSkeleton count={16} />
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
              {movies.map((item, idx) => (
                <MediaCard key={`${item.id}-${idx}`} media={item} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-12 py-4 rounded-sm font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Content'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
