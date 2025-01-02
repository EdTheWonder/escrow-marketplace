export type FeedbackType = 'positive' | 'neutral' | 'negative';

export interface Feedback {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  recipient_id: string;
  type: FeedbackType;
  comment: string;
  created_at: string;
}

