-- Create the update timestamp function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create conversations table
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT,
  chapter TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  image_mode TEXT CHECK (image_mode IN ('solve', 'guide')),
  is_rejection BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.ai_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.ai_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.ai_conversations FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.ai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.ai_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at);

-- Create trigger
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();