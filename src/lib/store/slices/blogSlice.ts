import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;}

interface BlogState {
  posts: BlogPost[];
  currentPost: BlogPost | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  postsPerPage: number;
}

const initialState: BlogState = {
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  postsPerPage: 10,
};

export const fetchPosts = createAsyncThunk(
  'blog/fetchPosts',
  async ({ page, perPage }: { page: number; perPage: number }) => {
    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw new Error(`Update failed: ${error.message}`);
    return { posts, count };
  }
);

export const createPost = createAsyncThunk(
  'blog/createPost',
  async ({ title, content }: { title: string; content: string }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert([{ title, content }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create post');
    }
  }
);

export const updatePost = createAsyncThunk(
  'blog/updatePost',
  async ({ id, title, content }: { id: string; title: string; content: string }) => {
    const { data, error } = await supabase
      .from('posts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Update failed: ${error.message}`);
    return data;
  }
);

export const deletePost = createAsyncThunk(
  'blog/deletePost',
  async (id: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Update failed: ${error.message}`);
    return id;
  }
);

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts;
        state.totalCount = action.payload.count ?? 0;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error instanceof Error ? action.error.message : 'Failed to fetch posts';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error instanceof Error ? action.error.message : 'Failed to create post';
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((post) => post.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        state.currentPost = action.payload;
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error instanceof Error ? action.error.message : 'Failed to update post';
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((post) => post.id !== action.payload);
        state.totalCount -= 1;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error instanceof Error ? action.error.message : 'Failed to delete post';
      });
  },
});

export const { setCurrentPost, clearError, setPage } = blogSlice.actions;
export default blogSlice.reducer;