import { useState, useEffect, useRef } from "react";
import { Search, Plus, Phone, Video, MoreVertical, Paperclip, Send, Smile, X, Loader2, File, Download, Check, CheckCheck, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWebRTCContext } from "@/components/nexus/WebRTCProvider";
import { socketService } from "@/services/socket";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ChatUser {
  _id: string;
  name: string;
  online: boolean;
  avatar?: string;
  nexusId: string;
}

interface Attachment {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface Message {
  _id: string;
  content: string;
  attachment?: Attachment;
  sender: string;
  receiver: string;
  createdAt: string;
  status: "PENDING" | "DELIVERED" | "SEEN";
}

interface Conversation {
  user: ChatUser;
  lastMessage: Message;
}

export function Messages() {
  // Chat Interface Component
  const { token, user: currentUser } = useAuth();
  const { startCall } = useWebRTCContext();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Queries ---
  const { data: onlineUsers, error: onlineError } = useQuery({
    queryKey: ['onlineUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/chat/online`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch online users");
      return res.json() as Promise<ChatUser[]>;
    },
    refetchInterval: 10000,
    enabled: !!token
  });

  const { data: conversations, error: convError } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch conversations");
      }
      return res.json() as Promise<Conversation[]>;
    },
    refetchInterval: 5000,
    enabled: !!token
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', activeChat],
    queryFn: async () => {
      if (!activeChat) return [];
      const res = await fetch(`${API_BASE_URL}/chat/messages?userId=${activeChat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<Message[]>;
    },
    enabled: !!activeChat && !!token,
    refetchInterval: 3000
  });

  // --- Mutations ---
  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { content?: string, attachment?: Attachment }) => {
      if (!activeChat) throw new Error("No active chat");
      const res = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: activeChat, ...payload })
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      setShowEmoji(false);
      queryClient.invalidateQueries({ queryKey: ['messages', activeChat] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Also invalidate online users to refresh last message snippet if one exists there
      queryClient.invalidateQueries({ queryKey: ['onlineUsers'] });
    },
    onError: () => {
      toast.error("Failed to send message");
    }
  });

  const markSeenMutation = useMutation({
    mutationFn: async (senderId: string) => {
      await fetch(`${API_BASE_URL}/chat/seen`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ senderId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleSend = () => {
    if (!messageInput.trim() || !activeChat) return;
    const content = messageInput;
    setMessageInput(""); // Clear immediately for better UX
    sendMessageMutation.mutate({ content });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput(prev => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      // Send as structured attachment
      const attachment: Attachment = {
        url: `${API_BASE_URL}${data.url}`,
        filename: data.filename,
        size: file.size, // Use file.size for actual size
        mimeType: file.type
      };

      sendMessageMutation.mutate({ attachment });
      toast.success("File uploaded");
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as seen when opening chat
  useEffect(() => {
    if (activeChat) {
      markSeenMutation.mutate(activeChat);
    }
  }, [activeChat]);


  // Derive active user details
  const activeConversationUser =
    (Array.isArray(conversations) ? conversations.find(c => c.user._id === activeChat)?.user : undefined) ||
    (Array.isArray(onlineUsers) ? onlineUsers.find(u => u._id === activeChat) : undefined);

  // Socket Listener for Real-time Messages
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleIncomingMessage = (newMessage: Message) => {
      // If the message is relevant to the current chat
      if (activeChat && (newMessage.sender === activeChat || newMessage.receiver === activeChat)) {
        queryClient.setQueryData(['messages', activeChat], (oldData: Message[] | undefined) => {
          if (!oldData) return [newMessage];
          // Prevent duplicates
          if (oldData.some(m => m._id === newMessage._id)) return oldData;
          return [...oldData, newMessage];
        });

        // Notify server of delivery
        socket.emit("message-delivered", newMessage._id);

        // If we (receiver) are currently looking at this chat, mark as seen immediately
        if (newMessage.sender === activeChat) {
          markSeenMutation.mutate(activeChat);
        }
      }

      // Always refresh conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleMessagesSeen = (data: { viewerId: string }) => {
      if (activeChat === data.viewerId) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeChat] });
      }
    }

    socket.on("incoming-message", handleIncomingMessage);
    socket.on("messages-seen", handleMessagesSeen);

    return () => {
      socket.off("incoming-message", handleIncomingMessage);
      socket.off("messages-seen", handleMessagesSeen);
    };
  }, [activeChat, queryClient]);


  // Filter conversations
  const filteredConversations = conversations?.filter(chat => {
    const query = searchQuery.toLowerCase();
    const name = (chat.user.name || "").toLowerCase();
    const nexusId = (chat.user.nexusId || "").toLowerCase();
    return name.includes(query) || nexusId.includes(query);
  });

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] max-w-7xl mx-auto flex gap-4 overflow-hidden relative">
      {/* Sidebar - Contacts */}
      <div className={cn(
        "w-full md:w-96 flex-col glass-panel rounded-2xl border border-primary/10 overflow-hidden transition-all duration-300 absolute md:relative z-10 h-full",
        activeChat ? "-translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto" : "translate-x-0 opacity-100 pointer-events-auto flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-foreground">Messages</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 bg-secondary/30 border-primary/10 focus:border-primary/40 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Online Now */}
        <div className="p-4 border-b border-primary/5">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase">Online Now</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {onlineUsers?.map(user => (
              <button
                key={user._id}
                className="flex flex-col items-center gap-1 min-w-[3rem] cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setActiveChat(user._id)}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 text-primary font-medium overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : (user.name?.[0]?.toUpperCase() || "?")}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-nexus-green border-2 border-background shadow-[0_0_8px_#22c55e]" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-14 text-center">{user.nexusId || user.name || "User"}</span>
              </button>
            ))}
            {(!onlineUsers || onlineUsers.length === 0) && (
              <span className="text-xs text-muted-foreground">No one online</span>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20">
          <h3 className="px-4 pt-4 text-xs font-medium text-muted-foreground mb-2 uppercase">All Messages</h3>
          <div className="space-y-1 p-2">
            {filteredConversations?.map(chat => (
              <button
                key={chat.user._id}
                onClick={() => setActiveChat(chat.user._id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group cursor-pointer",
                  activeChat === chat.user._id
                    ? "bg-primary/10 border border-primary/30 shadow-[0_0_15px_-5px_hsl(var(--primary))]"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-medium overflow-hidden",
                    activeChat === chat.user._id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground group-hover:text-foreground"
                  )}>
                    {chat.user.avatar ? <img src={chat.user.avatar} alt={chat.user.name} className="w-full h-full object-cover" /> : (chat.user.name?.[0]?.toUpperCase() || "?")}
                  </div>
                  {chat.user.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background shadow-[0_0_8px_#22c55e]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn(
                      "font-medium text-sm truncate",
                      activeChat === chat.user._id ? "text-primary" : "text-foreground"
                    )}>
                      {chat.user.name || chat.user.nexusId || "Unknown User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    "text-muted-foreground" // Todo: Highlight unread
                  )}>
                    {chat.lastMessage.attachment ? `📎 File: ${chat.lastMessage.attachment.filename}` :
                      (chat.lastMessage.sender === currentUser?.id ? "You: " : "") + chat.lastMessage.content}
                  </p>
                </div>
              </button>
            ))}
            {(!conversations || conversations.length === 0) ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
            ) : filteredConversations?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No matches found</div>
            ) : null}
          </div>
        </div >
      </div >

      {/* Chat Area */}
      < div className={
        cn(
          "w-full md:flex-1 flex flex-col glass-panel rounded-2xl border border-primary/10 overflow-hidden relative transition-all duration-300 absolute md:relative h-full",
          activeChat ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
        )
      } >
        {
          activeChat ? (
            <>
              {/* Chat Header */}
              < div className="p-4 border-b border-primary/10 flex items-center justify-between bg-black/20 backdrop-blur-md" >
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="md:hidden -ml-2 text-muted-foreground hover:text-primary"
                    onClick={() => setActiveChat(null)}
                  >
                    <ArrowUpDown className="w-5 h-5 rotate-90" />
                  </Button>

                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 text-primary font-medium overflow-hidden">
                      {activeConversationUser?.avatar
                        ? <img src={activeConversationUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        : (activeConversationUser?.name?.[0]?.toUpperCase() || "?")}
                    </div>
                    {activeConversationUser?.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background shadow-[0_0_8px_#22c55e]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {activeConversationUser?.name || activeConversationUser?.nexusId || "Unknown User"}
                      {activeConversationUser?.name && activeConversationUser?.nexusId && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">({activeConversationUser.nexusId})</span>
                      )}
                    </h3>
                    <p className="text-xs text-primary animate-pulse">{activeConversationUser?.online ? "Online" : "Offline"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => activeChat && startCall(activeChat)}
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => activeChat && startCall(activeChat)}
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div >

              {/* Chat Messages */}
              < div className="flex-1 overflow-y-auto p-4 space-y-4" >
                {messages?.map(msg => (
                  <div key={msg._id} className={cn("flex", msg.sender === currentUser?.id ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all",
                      msg.sender === currentUser?.id
                        ? "bg-primary/90 text-primary-foreground rounded-br-none shadow-primary/10"
                        : "bg-secondary/50 text-foreground border border-primary/10 rounded-bl-none backdrop-blur-sm"
                    )}>
                      {msg.attachment ? (
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <File className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{msg.attachment.filename}</p>
                            <p className="text-[10px] opacity-70">{(msg.attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <a
                            href={msg.attachment.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      <div className={cn("flex items-center justify-end gap-1 mt-1 opacity-70", msg.sender === currentUser?.id ? "text-primary-foreground" : "text-muted-foreground")}>
                        <p className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {msg.sender === currentUser?.id && (
                          msg.status === "SEEN" ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                            msg.status === "DELIVERED" ? <CheckCheck className="w-3 h-3" /> :
                              <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
                }
                <div ref={messagesEndRef} />
              </div >

              {/* Emoji Picker */}
              {
                showEmoji && (
                  <div className="absolute bottom-20 left-4 z-50">
                    <div className="relative">
                      <Button
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-secondary text-foreground hover:bg-destructive hover:text-white z-10 shadow-md"
                        onClick={() => setShowEmoji(false)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={Theme.DARK as any}
                        width={300}
                        height={400}
                      />
                    </div>
                  </div>
                )
              }

              {/* Chat Input */}
              <div className="p-4 border-t border-primary/10 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2 bg-secondary/30 rounded-full p-2 border border-primary/10 focus-within:border-primary/30 transition-colors">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setShowEmoji(!showEmoji)}
                  >
                    <Smile className="w-5 h-5" />
                  </Button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </Button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sendMessageMutation.isPending || (!messageInput.trim() && !isUploading)}
                    className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95">
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 animate-pulse">
                <Send className="w-8 h-8 text-primary/50" />
              </div>
              <p>Select a conversation or online user to start messaging</p>
            </div>
          )}
      </div >
    </div >
  );
}
