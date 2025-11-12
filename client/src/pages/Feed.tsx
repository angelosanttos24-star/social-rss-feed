import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Wand2, MoreVertical, Trash2 } from 'lucide-react';
import AddFeedDialog from '@/components/AddFeedDialog';
import GeminiModal from '@/components/GeminiModal';

interface Post {
  id: string;
  platform: string;
  username: string;
  avatar_url: string | null;
  media_type: string;
  media_url: string | null;
  description: string;
  likes: number;
  comments: number;
  created_at: string;
}

export default function Feed() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiContent, setGeminiContent] = useState<{ type: 'summary' | 'reply'; content: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Queries
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = trpc.feeds.getPosts.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: feeds, isLoading: feedsLoading, refetch: refetchFeeds } = trpc.feeds.list.useQuery();

  // Mutations
  const deleteFeedMutation = trpc.feeds.delete.useMutation({
    onSuccess: () => {
      refetchFeeds();
      refetchPosts();
    },
  });

  const summarizeFeedMutation = trpc.gemini.summarizeFeed.useMutation({
    onSuccess: (data) => {
      setGeminiContent({ type: 'summary', content: data.summary });
      setShowGeminiModal(true);
    },
  });

  const summarizePostMutation = trpc.gemini.summarizePost.useMutation({
    onSuccess: (data) => {
      setGeminiContent({ type: 'summary', content: data.summary });
      setShowGeminiModal(true);
    },
  });

  const suggestRepliesMutation = trpc.gemini.suggestReplies.useMutation({
    onSuccess: (data) => {
      setGeminiContent({ type: 'reply', content: data.suggestions });
      setShowGeminiModal(true);
    },
  });

  const addFeedMutation = trpc.feeds.add.useMutation({
    onSuccess: () => {
      setShowAddDialog(false);
      refetchFeeds();
      refetchPosts();
    },
  });

  const handleAddFeed = async (platform: string, username: string) => {
    try {
      await addFeedMutation.mutateAsync({
        platform: platform as any,
        profileUrl: `https://${platform}.com/${username}`,
        username,
      });
    } catch (error) {
      console.error('Error adding feed:', error);
    }
  };

  const handleDeleteFeed = (feedId: string) => {
    deleteFeedMutation.mutate({ feedId });
  };

  const handleSummarizeFeed = () => {
    summarizeFeedMutation.mutate();
  };

  const handleSummarizePost = (post: Post) => {
    summarizePostMutation.mutate({ postId: post.id });
    setOpenMenuId(null);
  };

  const handleSuggestReplies = (post: Post) => {
    suggestRepliesMutation.mutate({ postId: post.id });
    setOpenMenuId(null);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      twitter: '𝕏',
      tiktok: '🎵',
      threads: '🧵',
      bluesky: '☁️',
    };
    return icons[platform] || '📱';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Meu Feed</h1>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handleSummarizeFeed}
              disabled={!posts || posts.length === 0 || summarizeFeedMutation.isPending}
              className="bg-purple-100 text-purple-600 hover:bg-purple-200"
              title="Resumir feed com IA"
            >
              <Wand2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setShowAddDialog(true)}
              title="Adicionar novo feed"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Loading State */}
        {postsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!postsLoading && (!posts || posts.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-slate-600 mb-4">Nenhum feed adicionado ainda</p>
            <Button onClick={() => setShowAddDialog(true)}>
              Adicionar primeiro feed
            </Button>
          </Card>
        )}

        {/* Posts Grid */}
        {posts && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Post Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {post.avatar_url && (
                      <img
                        src={post.avatar_url}
                        alt={post.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{post.username}</p>
                      <p className="text-xs text-slate-500">
                        {getPlatformIcon(post.platform)} {post.platform}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-600" />
                    </button>
                    {openMenuId === post.id && (
                      <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                        <button
                          onClick={() => handleSummarizePost(post)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                        >
                          Resumir com IA
                        </button>
                        <button
                          onClick={() => handleSuggestReplies(post)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                        >
                          Sugerir respostas
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4">
                  {post.media_url && post.media_type !== 'text' && (
                    <img
                      src={post.media_url}
                      alt="Post media"
                      className="w-full rounded-lg mb-4 max-h-96 object-cover"
                    />
                  )}
                  <p className="text-slate-700 text-sm leading-relaxed">{post.description}</p>
                </div>

                {/* Post Footer */}
                <div className="px-4 py-3 bg-slate-50 flex items-center gap-4 text-xs text-slate-600">
                  <span>❤️ {post.likes} likes</span>
                  <span>💬 {post.comments} comentários</span>
                  <span className="ml-auto">
                    {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddFeedDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddFeed={handleAddFeed}
      />

      <GeminiModal
        open={showGeminiModal}
        onOpenChange={setShowGeminiModal}
        content={geminiContent}
        isLoading={
          summarizeFeedMutation.isPending ||
          summarizePostMutation.isPending ||
          suggestRepliesMutation.isPending
        }
      />
    </div>
  );
}
