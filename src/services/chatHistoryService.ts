import { supabase } from "@/integrations/supabase/client";
import { Message } from "./doubtSolverService";

export interface Conversation {
  id: string;
  user_id: string;
  subject: string | null;
  chapter: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  image_mode: "solve" | "guide" | null;
  is_rejection: boolean;
  created_at: string;
}

// Create a new conversation
export async function createConversation(
  userId: string,
  subject?: string,
  chapter?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      subject,
      chapter,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
  return data.id;
}

// Update conversation title (auto-generated from first message)
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const { error } = await supabase
    .from("ai_conversations")
    .update({ title: title.slice(0, 100) })
    .eq("id", conversationId);

  if (error) {
    console.error("Error updating conversation title:", error);
    return false;
  }
  return true;
}

// Save a message to the database
export async function saveMessage(
  conversationId: string,
  message: Message
): Promise<boolean> {
  const { error } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    image_url: message.imageUrl || null,
    image_mode: message.imageMode || null,
    is_rejection: message.isRejection || false,
  });

  if (error) {
    console.error("Error saving message:", error);
    return false;
  }
  return true;
}

// Get all conversations for a user
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
  return data || [];
}

// Get messages for a conversation
export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return (data || []).map((msg: DbMessage) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: new Date(msg.created_at),
    imageUrl: msg.image_url || undefined,
    imageMode: msg.image_mode || undefined,
    isRejection: msg.is_rejection,
  }));
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }
  return true;
}
