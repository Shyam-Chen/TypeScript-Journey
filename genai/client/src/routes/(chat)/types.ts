type UUID = string;

export type Message = {
  id: UUID;
  role: 'user' | 'assistant';
  content: string;
};
