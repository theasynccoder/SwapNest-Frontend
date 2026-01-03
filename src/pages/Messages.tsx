import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  Loader2,
  Search
} from 'lucide-react';
import { Conversation, Message, Profile } from '@/lib/types';

const ChatWindow = ({ conversationId, onBack }: { conversationId: string; onBack: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          fetchMessages(); // Refresh messages
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchConversation = async () => {
    const { data: convData, error } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(id, title, price_inr, images)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      toast.error('Failed to load conversation');
      return;
    }

    if (!convData) return;

    // Fetch buyer and seller profiles
    const { data: buyerData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_id')
      .eq('user_id', convData.buyer_id)
      .single();

    const { data: sellerData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, user_id')
      .eq('user_id', convData.seller_id)
      .single();

    setConversation({
      ...convData,
      buyer: buyerData || null,
      seller: sellerData || null,
    } as unknown as Conversation);
  };

  const fetchMessages = async () => {
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load messages');
      return;
    }

    // Fetch sender profiles for each message
    const messagesWithSenders = await Promise.all(
      (messagesData || []).map(async (msg) => {
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, user_id')
          .eq('user_id', msg.sender_id)
          .single();

        return {
          ...msg,
          sender: senderData || null,
        };
      })
    );

    setMessages(messagesWithSenders as unknown as Message[]);
    setLoading(false);

    // Mark messages as read (cannot use .neq in update, so fetch IDs first)
    if (user) {
      const { data: messagesToUpdate } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
      if (messagesToUpdate && messagesToUpdate.length > 0) {
        const ids = messagesToUpdate.map(msg => msg.id).filter(Boolean);
        if (ids.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', ids);
        }
      }
    }

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  const otherUser = user?.id === conversation.buyer_id 
    ? conversation.seller 
    : conversation.buyer;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
      {/* Chat Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar>
            {conversation.buyer?.avatar_url ? (
              <img src={conversation.buyer.avatar_url} alt={conversation.buyer.full_name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <AvatarFallback>
                {conversation.buyer?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{otherUser?.full_name || 'User'}</h3>
            {conversation.product && (
              <p className="text-sm text-muted-foreground">
                {conversation.product.title}
              </p>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              <span>Started by: </span>
              <span className="font-semibold">{conversation.buyer?.full_name || 'User'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === user?.id;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {message.sender?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-lg px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-card">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;


    const { data: conversationsData, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    // Sort in JS by last_message_at descending
    const sortedConversations = (conversationsData || []).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    if (error) {
      toast.error('Failed to load conversations');
      setLoading(false);
      return;
    }

    // Fetch buyer, seller, product, and last message for each conversation
    const conversationsWithData = await Promise.all(
      sortedConversations.map(async (conv) => {
        // Fetch buyer profile
        const { data: buyerData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, user_id')
          .eq('user_id', conv.buyer_id)
          .single();

        // Fetch seller profile
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, user_id')
          .eq('user_id', conv.seller_id)
          .single();

        // Fetch product info
        const { data: productData } = await supabase
          .from('products')
          .select('id, title, price_inr, images')
          .eq('id', conv.product_id)
          .single();

        // Fetch last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          buyer: buyerData || null,
          seller: sellerData || null,
          product: productData || null,
          last_message: lastMessage || null,
        };
      })
    );

    setConversations(conversationsWithData as unknown as Conversation[]);
    setLoading(false);
  };

  const subscribeToConversations = () => {
    if (!user) return;

    const channel = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const otherUser = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
    const productTitle = conv.product?.title || '';
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser?.full_name?.toLowerCase().includes(searchLower) ||
      productTitle.toLowerCase().includes(searchLower)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show chat window if conversationId is provided
  if (conversationId) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-full lg:w-1/3 border-r border-border hidden lg:block">
          <ConversationList 
            conversations={filteredConversations}
            currentConversationId={conversationId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={(id) => navigate(`/messages/${id}`)}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <ChatWindow 
            conversationId={conversationId}
            onBack={() => navigate('/messages')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">SwapNest</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat with buyers and sellers</p>
        </div>

        <ConversationList 
          conversations={filteredConversations}
          currentConversationId={null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={(id) => navigate(`/messages/${id}`)}
        />
      </div>
    </div>
  );
};

const ConversationList = ({
  conversations,
  currentConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
}: {
  conversations: Conversation[];
  currentConversationId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConversation: (id: string) => void;
}) => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start a conversation by contacting a seller from a product page
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => {
              const otherUser = user?.id === conversation.buyer_id 
                ? conversation.seller 
                : conversation.buyer;
              const isActive = conversation.id === currentConversationId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full p-4 hover:bg-muted/50 transition-colors text-left ${
                    isActive ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {otherUser?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{otherUser?.full_name || 'User'}</h3>
                        {conversation.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.last_message.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {conversation.product && (
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {conversation.product.title}
                        </p>
                      )}
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
