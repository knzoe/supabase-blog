'use client';


import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { fetchPosts, setPage } from '@/lib/store/slices/blogSlice';
import Link from 'next/link';
import { format } from 'date-fns';

export default function Home() {
  const dispatch = useAppDispatch();
  const { posts, loading, error, currentPage, postsPerPage, totalCount } = useAppSelector(
    (state) => state.blog
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchPosts({ page: currentPage, perPage: postsPerPage }));
  }, [dispatch, currentPage, postsPerPage]);

  const totalPages = Math.ceil(totalCount / postsPerPage);

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        {user && (
          <Link
            href="/create"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Post
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
  
            <h2 className="text-2xl font-semibold mb-2">
              <Link href={`/posts/${post.id}`} className="hover:text-blue-500">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 mb-4">
              {post.content.length > 200
                ? `${post.content.substring(0, 200)}...`
                : post.content}
            </p>
            <div className="text-sm text-gray-500">
              Posted on {format(new Date(post.created_at), 'MMM dd, yyyy')}
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
