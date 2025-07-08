import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Crown, 
  Star, 
  Zap, 
  Target,
  TrendingUp,
  Calendar,
  Users,
  Flame,
  CheckCircle,
  Activity,
  Award,
  Medal,
  X,
  BookOpen
} from 'lucide-react';
import { 
  POINTS_CONFIG, 
  BADGE_DEFINITIONS, 
  COMPETITIVE_BONUS_CONFIG 
} from '@/utils/tournamentUtils';
import { BadgeType } from '@/types';

interface TournamentRulebookProps {
  isOpen: boolean;
  onClose: () => void;
}

const TournamentRulebook: React.FC<TournamentRulebookProps> = ({ isOpen, onClose }) => {
  
  // Group points into logical categories for cleaner presentation
  const pointCategories = [
    {
      title: "Core Performance",
      icon: <Trophy className="h-5 w-5" />,
      color: "bg-gradient-to-br from-amber-400 to-orange-500",
      items: [
        {
          name: "Personal Records",
          points: POINTS_CONFIG.PR_ACHIEVEMENT.points,
          description: "Set a new personal best",
          detail: "Break your previous record for massive points"
        },
        {
          name: "Exercise Volume", 
          points: POINTS_CONFIG.EXERCISE_COMPLETED.points,
          description: "Per exercise completed",
          detail: "Every exercise counts towards your score"
        },
        {
          name: "Improvement Gains",
          points: POINTS_CONFIG.IMPROVEMENT_PERCENT.points,
          description: "Per 1% weight improvement", 
          detail: "Reward progressive overload and strength gains",
          multiplier: "×% improvement"
        }
      ]
    },
    {
      title: "Consistency & Habits",
      icon: <Crown className="h-5 w-5" />,
      color: "bg-gradient-to-br from-blue-400 to-purple-500",
      items: [
        {
          name: "Daily Workout Base",
          points: POINTS_CONFIG.DAILY_WORKOUT_BASE.points,
          description: "Show up and work out",
          detail: "Minimum 2 exercises required"
        },
        {
          name: "Exercise Variety",
          points: POINTS_CONFIG.EXERCISE_VARIETY_BONUS.points,
          description: "Per exercise beyond 2nd",
          detail: "Reward well-rounded workouts"
        },
        {
          name: "Consistency Streak",
          points: POINTS_CONFIG.CONSISTENCY_BONUS.points,
          description: "5+ workout days",
          detail: "Build the habit of regular training"
        }
      ]
    },
    {
      title: "Special Rewards",
      icon: <Star className="h-5 w-5" />,
      color: "bg-gradient-to-br from-emerald-400 to-teal-500",
      items: [
        {
          name: "Weekend Warrior",
          points: POINTS_CONFIG.WEEKEND_BONUS.points,
          description: "Per weekend workout",
          detail: "Extra motivation for weekend sessions"
        },
        {
          name: "Core Focus",
          points: POINTS_CONFIG.CORE_FOCUS_BONUS.points,
          description: "Per core exercise",
          detail: "Target those abs and build that foundation"
        },
        {
          name: "Category Master",
          points: POINTS_CONFIG.CATEGORY_COMPLETION.points,
          description: "Work all muscle groups",
          detail: "Complete balanced weekly training"
        }
      ]
    },
    {
      title: "Competitive Bonuses", 
      icon: <Zap className="h-5 w-5" />,
      color: "bg-gradient-to-br from-red-400 to-pink-500",
      items: [
        {
          name: "Takeover Bonus",
          points: 20,
          description: "Beat another user's PR",
          detail: "Dominate the leaderboard by surpassing friends"
        },
        {
          name: "Close Victory",
          points: 10, 
          description: "Win by less than 5%",
          detail: "Nail-biting victories earn bonus points"
        },
        {
          name: "First Timer",
          points: 10,
          description: "First log for exercise", 
          detail: "Bonus for trying new exercises"
        }
      ]
    }
  ];

  const badges = [
    {
      type: BadgeType.FIRST_PR,
      icon: <Trophy className="h-4 w-4" />,
      color: "from-amber-400 to-orange-500"
    },
    {
      type: BadgeType.CONSISTENCY_KING, 
      icon: <Crown className="h-4 w-4" />,
      color: "from-blue-400 to-purple-500"
    },
    {
      type: BadgeType.WEEKEND_WARRIOR,
      icon: <Zap className="h-4 w-4" />,
      color: "from-orange-400 to-red-500"
    },
    {
      type: BadgeType.PERFECT_WEEK,
      icon: <Flame className="h-4 w-4" />,
      color: "from-red-400 to-pink-500"
    },
    {
      type: BadgeType.VOLUME_CRUSHER,
      icon: <Activity className="h-4 w-4" />,
      color: "from-indigo-400 to-blue-500"
    },
    {
      type: BadgeType.CORE_DESTROYER,
      icon: <Target className="h-4 w-4" />,
      color: "from-emerald-400 to-green-500"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 border-0">
        {/* Header */}
        <DialogHeader className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/30 p-6 pb-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tournament Rulebook
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Dynamic scoring system • Updates automatically
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full h-10 w-10 p-0 hover:bg-muted/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Tournament Overview */}
          <Card className="border-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Crown className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">Weekly Competition</h3>
                  <p className="text-muted-foreground mb-4">
                    Compete with friends in weekly fitness challenges. Points reset every Monday, 
                    encouraging consistent training and friendly competition.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">Monday - Sunday</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-muted-foreground">Highest Score Wins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Friends & Community</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">Progressive Scoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Point Categories */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Scoring System</h2>
            
            {pointCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{category.title}</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-muted/30 rounded-xl p-4 border border-border/30">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-foreground">{item.name}</h4>
                              <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border-0">
                                {item.points} pts{item.multiplier && ` ${item.multiplier}`}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                            <p className="text-xs text-muted-foreground/80">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add improvement cap note for competitive bonuses category */}
                    {category.title === "Competitive Bonuses" && (
                      <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/30 dark:border-amber-800/30">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>Maximum {COMPETITIVE_BONUS_CONFIG.IMPROVEMENT_CAP} improvement points per exercise per week</span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Achievement Badges */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Achievement Badges</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badges.map((badge, index) => {
                  const badgeData = BADGE_DEFINITIONS[badge.type];
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${badge.color} text-white`}>
                          {badge.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{badgeData.name}</h4>
                          <p className="text-sm text-muted-foreground">{badgeData.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border-0">
                        +{badgeData.points} pts
                      </Badge>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/30 dark:border-purple-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">Pro Tip</span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Badge points stack with base scoring! Combine multiple badges in a single week for maximum points.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Tips */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Winning Strategies</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <Crown className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Consistency Beats Intensity</h4>
                    <p className="text-sm text-muted-foreground">Regular workouts with 5+ days earn big bonus points and multiple badges.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <Trophy className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Target Personal Records</h4>
                    <p className="text-sm text-muted-foreground">PRs give massive points (75+) and unlock competitive bonuses against friends.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <Activity className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Diversify Your Training</h4>
                    <p className="text-sm text-muted-foreground">Hit all muscle groups and vary exercises for category mastery and variety bonuses.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRulebook;
