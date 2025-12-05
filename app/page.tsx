"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { ChatArea } from "@/components/chat-area"
import { UserAvatar } from "@/components/user-avatar"
import { ProfileMenu } from "@/components/profile-menu"
import { useAuth } from "@/hooks/use-auth"
import { useChats } from "@/hooks/use-chats"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useBrandFolders } from "@/hooks/use-brand-folders"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatSkeleton } from "@/components/chat-skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { generateUUID, isModifierKeyPressed } from "@/lib/utils"

// Helper function to handle streaming responses
async function sendMessageWithStreaming(
  payload: any,
  onChunk: (chunk: string) => void,
  onComplete: (metadata?: any) => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch("/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // Check if response is streaming (SSE) or regular JSON
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("text/event-stream")) {
      // Handle streaming response (Assistant API)
      console.log("[Streaming] Detected SSE stream");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("[Streaming] Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                onChunk(data.content);
              } else if (data.type === "done") {
                // Pass metadata (thread_id, message_id, etc.) to onComplete
                onComplete(data);
              } else if (data.type === "error") {
                onError(data.error);
              }
            } catch (e) {
              console.error("[Streaming] Error parsing SSE data:", e);
            }
          }
        }
      }
    } else {
      // Handle regular JSON response (AI Agent via n8n - non-streaming)
      console.log("[Streaming] Detected JSON response");
      const data = await response.json();

      if (data.error) {
        onError(data.error);
      } else {
        // For non-streaming responses, simulate streaming by word
        const content = data.output || data.data?.content || "";
        const words = content.split(" ");

        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? " " : "");
          onChunk(word);
          // Small delay to simulate streaming (30ms per word)
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        onComplete(data);
      }
    }
  } catch (error) {
    console.error("[Streaming] Error:", error);
    onError(error instanceof Error ? error.message : "Unknown error");
  }
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    chats,
    loading: chatsLoading,
    deleteChat,
    setChats,
    createChat,
  } = useChats();
  const {
    brandsWithFolders,
    createChatInBrand,
    setBrandsWithFolders,
    deleteChatFromBrand,
    refetch,
  } = useBrandFolders();
  const [activeChat, setActiveChat] = useState<string>("new-chat");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("Default Agent");
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [aiRespondingChats, setAiRespondingChats] = useState<Set<string>>(
    new Set()
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [componentKey, setComponentKey] = useState(0);
  const [expandedBrandAfterRemount, setExpandedBrandAfterRemount] = useState<
    string | null
  >(null);
  const [isCreatingBrandChat, setIsCreatingBrandChat] = useState<string | null>(
    null
  );

  const isAdmin = profile?.role === "Admin";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !loading && user === null) {
      router.push("/auth/login");
    }
  }, [user, loading, router, isHydrated]);

  useEffect(() => {
    if (isHydrated && !loading && user && profile && !profileLoading) {
      console.log("[v0] Checking first sign-in status:", profile.first_sign_in);
      if (profile.first_sign_in === true) {
        console.log(
          "[v0] First sign-in detected, redirecting to change password"
        );
        router.push(`/auth/change-password?userId=${user.id}`);
      }
    }
  }, [user, profile, loading, profileLoading, router, isHydrated]);

  const handleNewChat = useCallback(() => {
    console.log(
      "[v0] handleNewChat called - selectedBrand:",
      selectedBrand,
      "user:",
      user?.id
    );

    setSelectedBrand(null);
    setSelectedAgent("Default Agent");

    if (user) {
      const newChatId = generateUUID();
      const currentTime = new Date().toISOString();

      console.log("[v0] Opening chat: New Chat with ID:", newChatId);

      const placeholderChat = {
        id: newChatId,
        user_id: user.id,
        brand_id: null,
        agent_id: null,
        title: "New Chat",
        created_at: currentTime,
        updated_at: currentTime,
        messages: [],
      };

      console.log("[v0] Creating placeholder chat:", placeholderChat);
      setChats((prevChats) => [placeholderChat, ...prevChats]);
      setActiveChat(newChatId);
      console.log("[v0] New chat created successfully");
    } else {
      console.log("[v0] No user found, setting activeChat to new-chat");
      setActiveChat("new-chat");
    }
  }, [user, setChats, setActiveChat]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        isModifierKeyPressed(event) &&
        (event.key === "k" || event.key === "K")
      ) {
        event.preventDefault();
        handleNewChat();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNewChat]);

  useEffect(() => {
    const handleProfileLogout = () => {
      handleLogout();
    };

    window.addEventListener("profileLogout", handleProfileLogout);
    return () => {
      window.removeEventListener("profileLogout", handleProfileLogout);
    };
  }, []);

  useEffect(() => {
    console.log("[v0] HomePage: Auth state - user:", user, "loading:", loading);
  }, [user, loading]);

  useEffect(() => {
    const fetchBrands = async () => {
      if (!user) return;

      try {
        const { data: brandsData, error } = await supabase
          .from("brands")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[v0] Error fetching brands:", error);
          return;
        }

        setBrands(brandsData || []);
      } catch (error) {
        console.error("[v0] Error in fetchBrands:", error);
      }
    };

    fetchBrands();

    const brandsSubscription = supabase
      .channel(`brands_updates_${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "brands",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log("[v0] Brand update detected:", payload);
          if (payload.eventType === "INSERT") {
            setBrands((prev) => [payload.new as any, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setBrands((prev) =>
              prev.filter((brand) => brand.id !== payload.old.id)
            );
          } else if (payload.eventType === "UPDATE") {
            setBrands((prev) =>
              prev.map((brand) =>
                brand.id === payload.new.id ? (payload.new as any) : brand
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      brandsSubscription.unsubscribe();
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!user) return;

    console.log("[v0] Setting up message subscription to clear isAiResponding");

    const channel = supabase
      .channel(`messages_${user.id}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `role=eq.assistant`,
        },
        (payload) => {
          console.log("[v0] New assistant message detected:", payload.new);
          const newMessage = payload.new as any;

          if (newMessage.chat_id) {
            console.log(
              "[v0] Clearing isAiResponding for chat:",
              newMessage.chat_id
            );
            setAiRespondingChats((prev) => {
              const next = new Set(prev);
              next.delete(newMessage.chat_id);
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[v0] Message subscription status:", status);
      });

    return () => {
      console.log("[v0] Cleaning up message subscription");
      channel.unsubscribe();
    };
  }, [user, supabase]);

  const getAgentIdFromName = async (
    agentName: string
  ): Promise<string | null> => {
    try {
      console.log("[v0] Looking for agent:", agentName);

      const { data: allAgents, error: allAgentsError } = await supabase
        .from("agents")
        .select("id, name");

      if (allAgentsError) {
        console.error("[v0] Error fetching all agents:", allAgentsError);
      } else {
        console.log("[v0] Available agents:", allAgents);
      }

      const { data, error } = await supabase
        .from("agents")
        .select("id, name, assistant_id")
        .eq("name", agentName)
        .maybeSingle();

      if (error) {
        console.error("[v0] Error fetching agent:", error);
        return null;
      }

      if (!data) {
        console.log("[v0] No agent found with name:", agentName);
        if (allAgents && allAgents.length > 0) {
          console.log("[v0] Using first available agent:", allAgents[0].name);
          return allAgents[0].id;
        }
        return null;
      }

      console.log("[v0] Found agent:", data);
      return data.id;
    } catch (error) {
      console.error("[v0] Error in getAgentIdFromName:", error);
      return null;
    }
  };

  const getAssistantIdFromName = async (agentName: string): Promise<string> => {
    try {
      if (agentName === "Default Agent") {
        return ""; // Empty string for default agent
      }

      const { data, error } = await supabase
        .from("agents")
        .select("assistant_id")
        .eq("name", agentName)
        .maybeSingle();

      if (error || !data) {
        console.error(
          "[v0] Error fetching assistant_id for agent:",
          agentName,
          error
        );
        return ""; // Return empty string if not found
      }

      return data.assistant_id || "";
    } catch (error) {
      console.error("[v0] Error in getAssistantIdFromName:", error);
      return "";
    }
  };

  const getBrandIdFromName = async (
    brandName: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      console.log("[v0] Looking for brand:", brandName);

      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .eq("name", brandName)
        .maybeSingle();

      if (error) {
        console.error("[v0] Error fetching brand:", error);
        return null;
      }

      if (!data) {
        console.log("[v0] No brand found with name:", brandName);
        return null;
      }

      console.log("[v0] Found brand:", data);
      return data.id;
    } catch (error) {
      console.error("[v0] Error in getBrandIdFromName:", error);
      return null;
    }
  };

  const getBrandData = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (brand) {
      return {
        name: brand.name,
        icon: brand.name.charAt(0).toUpperCase(),
        color: "bg-blue-500", // Default color for now
        image: brand.image_url,
        description: brand.description,
      };
    }

    // Fallback to static data if not found in database
    const staticBrands = {
      wama: {
        name: "Wama Underwear",
        icon: "W",
        color: "bg-orange-500",
        image: "/images/wama.png",
      },
      ctrl: {
        name: "CTRL",
        icon: "C",
        color: "bg-blue-500",
        image: "/images/ctrl.png",
      },
      boss: { name: "Boss & Co", icon: "B", color: "bg-red-500" },
    };
    return staticBrands[brandId as keyof typeof staticBrands];
  };

  // Updated handleSendMessage function with streaming support
  const handleSendMessage = async (
    content: string,
    selectedAgent = "Default Agent",
    attachments: string[] = [],
    attachmentsNames: string[] = []
  ) => {
    if (!user) return;

    let chatId = activeChat;
    const isNewChat = activeChat === "new-chat";
    const isBrandChat = selectedBrand !== null;

    if (activeChat === "new-chat") {
      chatId = generateUUID();
      setActiveChat(chatId);
    }

    if (isBrandChat && isNewChat) {
      setIsCreatingBrandChat(selectedBrand);
    }

    const currentTime = new Date().toISOString();
    const messageId = generateUUID();

    let chatTitle: string;
    if (isNewChat && attachmentsNames.length > 0 && !content.trim()) {
      chatTitle = attachmentsNames[0];
    } else if (content.trim()) {
      chatTitle =
        content.length > 30 ? content.substring(0, 30) + "..." : content;
    } else {
      chatTitle = "New Chat";
    }

    try {
      const agentId = await getAgentIdFromName(selectedAgent);
      if (!agentId) {
        console.log("[v0] Agent not found, using null agent_id");
      }

      if (isNewChat) {
        setChats((prevChats) => {
          const existingChatIndex = prevChats.findIndex((c) => c.id === chatId);
          if (existingChatIndex >= 0) {
            const updatedChats = [...prevChats];
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              agent_id: agentId,
            };
            return updatedChats;
          }
          return prevChats;
        });
      }

      const assistantId = await getAssistantIdFromName(selectedAgent);

      let brandId = null;
      if (selectedBrand) {
        brandId = selectedBrand;
        console.log("[v0] Using brand_id:", brandId);

        if (isNewChat) {
          setExpandedBrandAfterRemount(brandId);
        }
      }

      const existingChat = chats.find((chat) => chat.id === chatId);

      let threadId = "";
      let vsId = null;
      if (existingChat || !isNewChat) {
        try {
          console.log("[v0] Fetching thread_id and vs_id for chat:", chatId);
          const { data: chatData, error } = await supabase
            .from("chats")
            .select("thread_id, vs_id")
            .eq("id", chatId)
            .maybeSingle();

          if (error) {
            console.error("[v0] Error fetching thread_id and vs_id:", error);
          } else if (chatData) {
            threadId = chatData.thread_id || "";
            vsId = chatData.vs_id || null;
            console.log("[v0] Found thread_id from database:", threadId);
            console.log("[v0] Found vs_id from database:", vsId);
          } else {
            console.log("[v0] No chat data found in database for id:", chatId);
          }
        } catch (error) {
          console.error("[v0] Error in thread_id and vs_id lookup:", error);
        }
      }

      const optimisticMessage = {
        id: messageId,
        chat_id: chatId,
        content: content,
        role: "user" as const,
        created_at: currentTime,
        attachments: attachments || [],
        attachments_names: attachmentsNames || [],
      };

      const optimisticChat = {
        id: chatId,
        user_id: user.id,
        brand_id: brandId,
        agent_id: agentId,
        title:
          existingChat?.title === "New Chat"
            ? chatTitle
            : existingChat?.title || chatTitle,
        created_at: existingChat?.created_at || currentTime,
        updated_at: currentTime,
        thread_id: threadId,
        messages: existingChat
          ? [...existingChat.messages, optimisticMessage]
          : [optimisticMessage],
      };

      // Add user message to UI
      setChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex((c) => c.id === chatId);
        if (existingChatIndex >= 0) {
          const updatedChats = [...prevChats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            agent_id: agentId,
            title:
              updatedChats[existingChatIndex].title === "New Chat"
                ? chatTitle
                : updatedChats[existingChatIndex].title,
            messages: [
              ...updatedChats[existingChatIndex].messages,
              optimisticMessage,
            ],
            updated_at: currentTime,
          };
          return updatedChats;
        } else {
          return [optimisticChat, ...prevChats];
        }
      });

      if (brandId && isNewChat) {
        console.log("[v0] Adding optimistic brand chat to UI");
        setBrandsWithFolders((prev) =>
          prev.map((brand) => {
            if (brand.id === brandId) {
              const existingFolderIndex = brand.folders.findIndex(
                (folder) => folder.agent_id === agentId
              );

              if (existingFolderIndex >= 0) {
                const updatedFolders = [...brand.folders];
                updatedFolders[existingFolderIndex] = {
                  ...updatedFolders[existingFolderIndex],
                  chats: [
                    optimisticChat,
                    ...updatedFolders[existingFolderIndex].chats,
                  ],
                };
                return { ...brand, folders: updatedFolders };
              } else {
                const newFolder = {
                  id: agentId,
                  name: `${selectedAgent} Chats`,
                  agent_id: agentId,
                  chats: [optimisticChat],
                };
                return { ...brand, folders: [...brand.folders, newFolder] };
              }
            }
            return brand;
          })
        );
      } else if (brandId) {
        setBrandsWithFolders((prev) =>
          prev.map((brand) => {
            if (brand.id === brandId) {
              return {
                ...brand,
                folders: brand.folders.map((folder) => ({
                  ...folder,
                  chats: folder.chats.map((chat) =>
                    chat.id === chatId
                      ? {
                          ...chat,
                          title:
                            chat.title === "New Chat" ? chatTitle : chat.title,
                          messages: [
                            ...(chat.messages || []),
                            optimisticMessage,
                          ],
                          updated_at: currentTime,
                        }
                      : chat
                  ),
                })),
              };
            }
            return brand;
          })
        );
      }

      // IMPORTANT: Set AI responding state (this shows "Thinking..." box)
      // DON'T create empty assistant message yet
      setAiRespondingChats((prev) => new Set(prev).add(chatId));

      const webhookPayload = {
        chats: {
          id: chatId,
          user_id: user.id,
          brand_id: brandId,
          agent_id: agentId,
          title:
            existingChat?.title === "New Chat"
              ? chatTitle
              : existingChat?.title || chatTitle,
          created_at: currentTime,
          updated_at: currentTime,
          thread_id: threadId,
          vs_id: vsId,
        },
        messages: {
          id: messageId,
          chat_id: chatId,
          content: content,
          role: "user",
          created_at: currentTime,
          attachments: attachments || [],
          attachments_names: attachmentsNames || [],
        },
        assistant_id: assistantId,
        thread_id: threadId,
        vector_store_id: vsId,
      };

      console.log(
        "[v0] Sending webhook payload with streaming support:",
        webhookPayload
      );

      // Track if we've received the first chunk (to create message box)
      let hasReceivedFirstChunk = false;
      const aiMessageId = generateUUID();

      try {
        await sendMessageWithStreaming(
          webhookPayload,
          // onChunk - called for each piece of text as it arrives
          (chunk: string) => {
            // If this is the first chunk, create the empty assistant message and hide "Thinking..."
            if (!hasReceivedFirstChunk) {
              hasReceivedFirstChunk = true;
              console.log(
                "[v0] First chunk received, creating assistant message"
              );

              const emptyAiMessage = {
                id: aiMessageId,
                chat_id: chatId,
                content: chunk, // Start with first chunk
                role: "assistant" as const,
                created_at: new Date().toISOString(),
              };

              // Add assistant message to UI
              setChats((prevChats) => {
                const existingChatIndex = prevChats.findIndex(
                  (c) => c.id === chatId
                );
                if (existingChatIndex >= 0) {
                  const updatedChats = [...prevChats];
                  updatedChats[existingChatIndex] = {
                    ...updatedChats[existingChatIndex],
                    messages: [
                      ...updatedChats[existingChatIndex].messages,
                      emptyAiMessage,
                    ],
                  };
                  return updatedChats;
                }
                return prevChats;
              });

              if (selectedBrand) {
                setBrandsWithFolders((prev) =>
                  prev.map((brand) => {
                    if (brand.id === selectedBrand) {
                      return {
                        ...brand,
                        folders: brand.folders.map((folder) => ({
                          ...folder,
                          chats: folder.chats.map((chat) =>
                            chat.id === chatId
                              ? {
                                  ...chat,
                                  messages: [
                                    ...(chat.messages || []),
                                    emptyAiMessage,
                                  ],
                                }
                              : chat
                          ),
                        })),
                      };
                    }
                    return brand;
                  })
                );
              }

              // Remove "Thinking..." state
              setAiRespondingChats((prev) => {
                const next = new Set(prev);
                next.delete(chatId);
                return next;
              });
            } else {
              // Subsequent chunks - append to existing message
              setChats((prevChats) => {
                const existingChatIndex = prevChats.findIndex(
                  (c) => c.id === chatId
                );
                if (existingChatIndex >= 0) {
                  const updatedChats = [...prevChats];
                  const currentChat = updatedChats[existingChatIndex];

                  updatedChats[existingChatIndex] = {
                    ...currentChat,
                    messages: currentChat.messages.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: msg.content + chunk }
                        : msg
                    ),
                  };
                  return updatedChats;
                }
                return prevChats;
              });

              if (selectedBrand) {
                setBrandsWithFolders((prev) =>
                  prev.map((brand) => {
                    if (brand.id === selectedBrand) {
                      return {
                        ...brand,
                        folders: brand.folders.map((folder) => ({
                          ...folder,
                          chats: folder.chats.map((chat) =>
                            chat.id === chatId
                              ? {
                                  ...chat,
                                  messages: chat.messages.map((msg) =>
                                    msg.id === aiMessageId
                                      ? { ...msg, content: msg.content + chunk }
                                      : msg
                                  ),
                                }
                              : chat
                          ),
                        })),
                      };
                    }
                    return brand;
                  })
                );
              }
            }
          },
          // onComplete - called when streaming finishes
          (metadata?: any) => {
            console.log("[v0] Streaming complete, metadata:", metadata);

            // Update thread_id if returned (for new Assistant API chats)
            if (metadata?.thread_id && !threadId) {
              console.log(
                "[v0] Updating thread_id from response:",
                metadata.thread_id
              );

              setChats((prevChats) => {
                const existingChatIndex = prevChats.findIndex(
                  (c) => c.id === chatId
                );
                if (existingChatIndex >= 0) {
                  const updatedChats = [...prevChats];
                  updatedChats[existingChatIndex] = {
                    ...updatedChats[existingChatIndex],
                    thread_id: metadata.thread_id,
                  };
                  return updatedChats;
                }
                return prevChats;
              });
            }

            if (isBrandChat && isNewChat) {
              console.log(
                "[v0] New brand chat created, waiting for webhook processing and triggering remount..."
              );

              setTimeout(async () => {
                setIsCreatingBrandChat(null);
                setComponentKey((prev) => prev + 1);
                console.log(
                  "[v0] Component remount triggered after new brand chat creation"
                );
              }, 1500);
            }

            // Final cleanup - ensure AI responding state is removed
            setAiRespondingChats((prev) => {
              const next = new Set(prev);
              next.delete(chatId);
              return next;
            });

            // Update final timestamp
            const finalTimestamp = new Date().toISOString();
            setChats((prevChats) => {
              const existingChatIndex = prevChats.findIndex(
                (c) => c.id === chatId
              );
              if (existingChatIndex >= 0) {
                const updatedChats = [...prevChats];
                updatedChats[existingChatIndex] = {
                  ...updatedChats[existingChatIndex],
                  updated_at: finalTimestamp,
                };
                return updatedChats;
              }
              return prevChats;
            });

            if (selectedBrand) {
              setBrandsWithFolders((prev) =>
                prev.map((brand) => {
                  if (brand.id === selectedBrand) {
                    return {
                      ...brand,
                      folders: brand.folders.map((folder) => ({
                        ...folder,
                        chats: folder.chats.map((chat) =>
                          chat.id === chatId
                            ? { ...chat, updated_at: finalTimestamp }
                            : chat
                        ),
                      })),
                    };
                  }
                  return brand;
                })
              );
            }
          },
          // onError - called if something goes wrong
          (error: string) => {
            console.error("[v0] Streaming error:", error);

            setAiRespondingChats((prev) => {
              const next = new Set(prev);
              next.delete(chatId);
              return next;
            });

            if (isBrandChat && isNewChat) {
              setIsCreatingBrandChat(null);
            }

            // If we created a message, remove it
            if (hasReceivedFirstChunk) {
              setChats((prevChats) => {
                const existingChatIndex = prevChats.findIndex(
                  (c) => c.id === chatId
                );
                if (existingChatIndex >= 0) {
                  const updatedChats = [...prevChats];
                  updatedChats[existingChatIndex] = {
                    ...updatedChats[existingChatIndex],
                    messages: updatedChats[existingChatIndex].messages.filter(
                      (m) => m.id !== aiMessageId
                    ),
                  };
                  return updatedChats;
                }
                return prevChats;
              });

              if (selectedBrand) {
                setBrandsWithFolders((prev) =>
                  prev.map((brand) => {
                    if (brand.id === selectedBrand) {
                      return {
                        ...brand,
                        folders: brand.folders.map((folder) => ({
                          ...folder,
                          chats: folder.chats.map((chat) =>
                            chat.id === chatId
                              ? {
                                  ...chat,
                                  messages: chat.messages.filter(
                                    (m) => m.id !== aiMessageId
                                  ),
                                }
                              : chat
                          ),
                        })),
                      };
                    }
                    return brand;
                  })
                );
              }
            }

            const errorMessage = `We encountered an issue: ${error}\n\nThis is likely temporary. Please try again in a moment. If the problem continues, our support team is here to help.`;
            const errorEvent = new CustomEvent("showToast", {
              detail: { message: errorMessage, type: "error" },
            });
            window.dispatchEvent(errorEvent);
          }
        );
      } catch (error) {
        console.error("[v0] Error in streaming request:", error);

        setAiRespondingChats((prev) => {
          const next = new Set(prev);
          next.delete(chatId);
          return next;
        });

        if (isBrandChat && isNewChat) {
          setIsCreatingBrandChat(null);
        }

        // If we created a message, remove it
        if (hasReceivedFirstChunk) {
          setChats((prevChats) => {
            const existingChatIndex = prevChats.findIndex(
              (c) => c.id === chatId
            );
            if (existingChatIndex >= 0) {
              const updatedChats = [...prevChats];
              updatedChats[existingChatIndex] = {
                ...updatedChats[existingChatIndex],
                messages: updatedChats[existingChatIndex].messages.filter(
                  (m) => m.id !== aiMessageId
                ),
              };
              return updatedChats;
            }
            return prevChats;
          });

          if (selectedBrand) {
            setBrandsWithFolders((prev) =>
              prev.map((brand) => {
                if (brand.id === selectedBrand) {
                  return {
                    ...brand,
                    folders: brand.folders.map((folder) => ({
                      ...folder,
                      chats: folder.chats.map((chat) =>
                        chat.id === chatId
                          ? {
                              ...chat,
                              messages: chat.messages.filter(
                                (m) => m.id !== aiMessageId
                              ),
                            }
                          : chat
                      ),
                    })),
                  };
                }
                return brand;
              })
            );
          }
        }

        const errorMessage = `Connection issue: ${
          error instanceof Error ? error.message : "Unable to reach the server"
        }\n\nThis is usually a temporary network hiccup. Please check your connection and try again.\n\nIf the problem persists, our support team is ready to assist.`;

        const errorEvent = new CustomEvent("showToast", {
          detail: { message: errorMessage, type: "error" },
        });
        window.dispatchEvent(errorEvent);
      }
    } catch (error) {
      console.error("[v0] Error in handleSendMessage:", error);

      const errorMessage = `Unexpected error: ${
        error instanceof Error ? error.message : "Unknown error"
      }\n\nPlease try again. If this continues, contact support.`;
      const errorEvent = new CustomEvent("showToast", {
        detail: { message: errorMessage, type: "error" },
      });
      window.dispatchEvent(errorEvent);
    }
  };

  const handleBrandSelect = (brandId: string) => {
    const brand = brandsWithFolders.find((b) => b.id === brandId);
    if (!brand) {
      console.log(`[v0] Brand not found: ${brandId}`);
      return;
    }

    console.log(`[v0] Selecting brand and loading chat area: ${brandId}`);
    setActiveChat("new-chat");
    setSelectedBrand(brandId);
    setSelectedAgent("Default Agent");
  };

  const handleChatSelect = (chatId: string) => {
    const selectedChat = chats.find((chat) => chat.id === chatId);
    if (selectedChat?.brand_id) {
      setSelectedBrand(selectedChat.brand_id);
    } else {
      setSelectedBrand(null);
    }
    setSelectedAgent("Default Agent");
    setIsTransitioning(true);
    setActiveChat(chatId);
    setTimeout(() => setIsTransitioning(false), 200);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      console.log("[v0] Deleting chat:", chatId);

      const isBrandChat = brandsWithFolders.some((brand) =>
        brand.folders.some((folder) =>
          folder.chats.some((chat) => chat.id === chatId)
        )
      );

      if (isBrandChat) {
        deleteChatFromBrand(chatId);
      }

      const response = await fetch("/api/chat/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: chatId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "[v0] Delete chat API failed:",
          response.status,
          errorData
        );
        alert(`Failed to delete chat: ${errorData.error}`);
        return;
      }

      const responseData = await response.json();
      console.log("[v0] Delete chat API success:", responseData);

      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));

      if (activeChat === chatId) {
        setActiveChat("new-chat");
      }
    } catch (error) {
      console.error("[v0] Error deleting chat:", error);
      alert(
        `Error deleting chat: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleRenameChat = (chatId: string, newName: string) => {
    console.log("[v0] Renaming chat:", chatId, "to:", newName);

    // Update regular chats
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, title: newName } : chat
      )
    );
  };

  const handleClearSelectedBrand = () => {
    setSelectedBrand(null);
  };

  const currentChat = chats.find((chat) => chat.id === activeChat);
  const isInRegularChat = chats.some((chat) => chat.id === activeChat);
  const shouldShowBottomSheet = false;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const forceRemount = async () => {
    console.log("[v0] Forcing component remount and refetching all data");

    if (user) {
      try {
        const { data: brandsData, error } = await supabase
          .from("brands")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[v0] Error refetching brands:", error);
        } else {
          setBrands(brandsData || []);
          console.log(
            "[v0] Brands refetched successfully:",
            brandsData?.length
          );
        }
      } catch (error) {
        console.error("[v0] Error in refetch brands:", error);
      }
    }

    // Trigger refetch in useBrandFolders hook
    await refetch();

    // Then increment component key to force remount
    setComponentKey((prev) => prev + 1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log("[v0] handleSuggestionClick called with:", suggestion);
    console.log(
      "[v0] Window handler exists:",
      !!(window as any).__chatInputSuggestionHandler
    );
    // Call the global handler set by ChatInput
    if ((window as any).__chatInputSuggestionHandler) {
      (window as any).__chatInputSuggestionHandler(suggestion);
    } else {
      console.error("[v0] No suggestion handler found on window!");
    }
  };

  if (!isHydrated || loading || chatsLoading || user === null) {
    return (
      <div className="flex h-screen text-white overflow-hidden relative">
        <div className="absolute inset-0">
          <img
            src="/images/design-mode/Mono-Glass2%201.png%281%29%281%29.jpeg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-[6px]"></div>
          <div className="absolute inset-0 bg-[#171717]/40 backdrop-blur-[8px]"></div>
        </div>

        <div className="relative z-10 flex w-full">
          <div className="w-80 bg-[#2a2a2a]/30 backdrop-blur-[8px] p-4">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-white/10 rounded-lg" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-16 bg-white/10" />
                <div className="flex gap-2">
                  <Skeleton className="h-12 w-12 bg-white/10 rounded-lg" />
                  <Skeleton className="h-12 w-12 bg-white/10 rounded-lg" />
                  <Skeleton className="h-12 w-12 bg-white/10 rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-white/10" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-4 w-4 bg-white/10 rounded" />
                    <Skeleton className="h-4 flex-1 bg-white/10" />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3 p-2">
                  <Skeleton className="h-8 w-8 bg-white/10 rounded-full" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="h-14 bg-[#2a2a2a]/30 backdrop-blur-[8px] flex items-center justify-between px-4">
              <Skeleton className="h-4 w-4 bg-white/10" />
              <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            </div>

            <div className="flex-1 bg-[#2a2a2a]/30 backdrop-blur-[8px] relative">
              <div className="absolute inset-0 bg-[#171717]/30 backdrop-blur-[8px] rounded-tl-lg">
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center space-y-4 max-w-md">
                      <Skeleton className="h-8 w-64 bg-white/10 mx-auto" />
                      <Skeleton className="h-4 w-48 bg-white/10 mx-auto" />
                      <div className="grid grid-cols-2 gap-3 mt-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="h-12 bg-white/10 rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-[#2a2a2a]/20">
                    <div className="flex gap-2">
                      <Skeleton className="flex-1 h-12 bg-white/10 rounded-lg" />
                      <Skeleton className="h-12 w-12 bg-white/10 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen text-white overflow-hidden relative">
      <div className="absolute inset-0">
        <img
          src="/images/design-mode/Mono-Glass2%201.png%281%29%281%29.jpeg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#111111]/60 backdrop-blur-[6px]"></div>
        <div className="absolute inset-0 bg-[#171717]/40 backdrop-blur-[8px]"></div>
      </div>

      <div className="relative z-10 flex w-full bg-[#1a1a1a]/40 backdrop-blur-[12px]">
        <div
          className={`w-80 transition-transform duration-300 ease-out ${
            sidebarVisible ? "translate-x-0" : "-translate-x-full"
          } ${sidebarVisible ? "" : "absolute"} z-30`}
        >
          <Sidebar
            key={`sidebar-${componentKey}`}
            chats={chats}
            activeChat={activeChat}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
            selectedBrand={selectedBrand}
            onBrandSelect={handleBrandSelect}
            onLogout={handleLogout}
            onDeleteChat={handleDeleteChat}
            onClearSelectedBrand={handleClearSelectedBrand}
            onForceRemount={forceRemount} // Use the new forceRemount function
            onRenameChat={handleRenameChat}
            expandedBrandAfterRemount={expandedBrandAfterRemount}
            isCreatingBrandChat={isCreatingBrandChat}
          />
        </div>

        <div
          className={`flex flex-col relative transition-all duration-300 ease-out ${
            sidebarVisible ? "flex-1" : "w-full"
          }`}
        >
          <div className="h-14 flex items-center justify-end px-4 relative z-20 transition-all duration-150">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setProfileMenuOpen(true)}
                className="hover:opacity-80 transition-opacity"
              >
                <UserAvatar size="sm" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative p-4">
            <div
              className={`absolute inset-4 top-0 right-0 bottom-0 left-0 bg-[#171717]/30 backdrop-blur-[12px] rounded-tl-xl shadow-sm transition-all duration-150 ring-1 ring-white/5`}
            >
              <button
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="absolute top-4 left-4 z-10 hover:opacity-80 transition-all duration-150 p-2 hover:scale-105 rounded-lg hover:bg-white/5"
              >
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="15"
                    height="11"
                    rx="1.5"
                    stroke="#FAFAFA"
                  />
                  <path
                    d="M14 0.5C14.8284 0.5 15.5 1.17157 15.5 2V10C15.5 10.8284 14.8284 11.5 14 11.5H4.5V0.5H14Z"
                    stroke="#FAFAFA"
                  />
                </svg>
              </button>

              {isTransitioning ? (
                <ChatSkeleton />
              ) : (
                <ChatArea
                  key={`chat-area-${componentKey}`}
                  chat={currentChat}
                  onSendMessage={(
                    content,
                    selectedAgent,
                    attachments,
                    attachmentsNames
                  ) => {
                    handleSendMessage(
                      content,
                      selectedAgent,
                      attachments,
                      attachmentsNames
                    );
                  }}
                  isBottomSheetOpen={shouldShowBottomSheet}
                  isAiResponding={aiRespondingChats.has(activeChat)}
                  selectedBrand={selectedBrand}
                  brands={brandsWithFolders}
                  currentChat={currentChat}
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  onSuggestionClick={handleSuggestionClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileMenu
        isOpen={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
      />
    </div>
  );
}
