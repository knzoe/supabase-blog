'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { updatePost } from '@/lib/store/slices/blogSlice';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/lib/store/slices/blogSlice';
import { toast } from 'react-toastify';

export default function EditPost() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchPost() {
      if (!postId) {
        setError('Post ID is required');
        setLoading(false);
        return;
      }

      if (!user) {
        router.push('/signin');
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (!isMounted) return;

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        if (data.user_id !== user.id) {
          setError('You do not have permission to edit this post');
          setLoading(false);
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setError('');
      } catch (error) {
        if (isMounted) {
          setError('Failed to load post');
          console.error('Error loading post:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPost();
    return () => { isMounted = false; };
  }, [postId, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!post) {
      setError('Post not found');
      return;
    }

    try {
      setUpdating(true);
      await dispatch(updatePost({ 
        id: post.id, 
        title: title.trim(), 
        content: content.trim() 
      })).unwrap();
      toast.success('Post updated successfully!');
      router.push(`/posts/${postId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update post');
      console.error('Update post failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-pulse text-center">
          <div className="text-lg">Loading post data...</div>
        </div>
      </div>
    );
  }

  if (!post) return <div className="text-center py-8">{error || 'Post not found'}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter post title"
            disabled={updating}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Write your post content here..."
            disabled={updating}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={updating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Post'}
          </button>
        </div>
      </form>
    </div>
  );
}