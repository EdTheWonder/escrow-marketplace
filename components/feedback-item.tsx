import { Card } from "./ui/card";

interface FeedbackItemProps {
  feedback: {
    id: string;
    type: 'positive' | 'neutral' | 'negative';
    reviewer: any;
    // ... add other feedback properties you need
  }
}

export function FeedbackItem({ feedback }: FeedbackItemProps) {
  return (
    <Card className="p-4">
      {/* Add your feedback item content here */}
    </Card>
  );
}

