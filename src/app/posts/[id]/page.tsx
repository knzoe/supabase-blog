'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { deletePost } from '@/lib/store/slices/blogSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/lib/store/slices/blogSlice';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSafeParams } from '@/lib/hooks/useSafeParams';
import { toast } from 'react-toastify';

export default function PostDetail({ params }: { params: { id: string } }) {
  const { validatedParams, error: paramError, refresh } = useSafeParams(['id']);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const user = useAppSelector(state => state.auth.user);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPostData = async (postId: string) => {
      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single();
    
        if (!isMounted) return;
    
        if (fetchError) throw new Error(fetchError.message);
        if (data) {
          setPost(data);
          setLoading(false);
          setError(null);
        } else {
          setError('Post not found');
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load post');
          setLoading(false);
        }
      }
    };
    
    if (validatedParams.id) {
      fetchPostData(validatedParams.id);
    } else if (paramError) {
      setError(paramError);
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [validatedParams.id, paramError]);

  const handleDelete = async () => {
    if (!validatedParams.id) return;
    
    try {
      await dispatch(deletePost(validatedParams.id)).unwrap();
      toast.success('Post deleted successfully!');
      router.push('/');
    } catch (error) {
      setError('Failed to delete post');
      console.error('Delete post failed:', error);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!post) return <div className="text-center py-8">Post not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <article className="prose lg:prose-xl">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="text-gray-600 mb-4">
          Posted on {format(new Date(post.created_at), 'MMM dd, yyyy')}
        </div>
        <div className="whitespace-pre-wrap mb-8">{post.content}</div>
      </article>

      {post && user && user.id === post.user_id && (
        <div className="mt-8">
          {!showDeleteConfirm ? (
            <div className="flex space-x-4">
              <Link
                href={`/posts/${post.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Post
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Post
              </button>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}