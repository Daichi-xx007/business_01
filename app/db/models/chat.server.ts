import { db } from "~/db/database.server";

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "model";
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  session_id: string;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateConversation(sessionId: string): Promise<ChatConversation> {
  let res = await db.query("SELECT * FROM chat_conversations WHERE session_id = $1", [sessionId]);
  
  if (res.rows.length === 0) {
    res = await db.query(
      "INSERT INTO chat_conversations (session_id) VALUES ($1) RETURNING *",
      [sessionId]
    );
  }
  return res.rows[0];
}

export async function addMessage(conversationId: number, role: "user" | "model", content: string): Promise<ChatMessage> {
  const res = await db.query(
    "INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *",
    [conversationId, role, content]
  );
  await db.query("UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [conversationId]);
  return res.rows[0];
}

export async function getConversationMessages(conversationId: number, limit = 50): Promise<ChatMessage[]> {
  const res = await db.query(
    "SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2",
    [conversationId, limit]
  );
  return res.rows;
}

export async function getFrequentQuestions(limit = 5): Promise<string[]> {
  // A naive approach: look at the most common user messages
  const res = await db.query(`
    SELECT content, COUNT(*) as count 
    FROM chat_messages 
    WHERE role = 'user' 
    GROUP BY content 
    ORDER BY count DESC 
    LIMIT $1
  `, [limit]);
  return res.rows.map((r: any) => r.content);
}
