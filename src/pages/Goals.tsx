import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Check, Zap } from 'lucide-react';

const GoalsPage: React.FC = () => {
  return (
    <Layout title="Goals">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Goals & Challenges</h3>
            <p className="text-muted-foreground">
              This feature is coming soon! Set personal goals, track your progress, and take on new challenges.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GoalsPage; 