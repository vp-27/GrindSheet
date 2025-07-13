import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  X,
  ChevronRight,
  ChevronDown,
  Lightbulb
} from 'lucide-react';
import { TOURNAMENT_ICONS, TOURNAMENT_GRADIENTS } from '@/utils/tournamentIcons';
import { 
  POINTS_CONFIG, 
  BADGE_DEFINITIONS, 
  COMPETITIVE_BONUS_CONFIG 
} from '@/utils/tournamentUtils';
import { BadgeType } from '@/types';

interface TournamentRulebookProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string | null;
}

const TournamentRulebook: React.FC<TournamentRulebookProps> = ({ isOpen, onClose, initialSection }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('performance');

  // Handle initial section when rulebook opens
  useEffect(() => {
    if (isOpen && initialSection) {
      setExpandedSection(initialSection);
    }
  }, [isOpen, initialSection]);

  // Streamlined point categories matching Tournament page design
  const pointCategories = [
    {
      id: 'performance',
      title: "Performance",
      subtitle: "PRs & Competition",
      icon: (() => {
        const TrophyIcon = TOURNAMENT_ICONS.PERFORMANCE;
        return <TrophyIcon className="h-4 w-4" />;
      })(),
      color: TOURNAMENT_GRADIENTS.PERFORMANCE,
      bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
      borderColor: "border-amber-200/50 dark:border-amber-700/50",
      items: [
        {
          name: "Personal Records",
          points: POINTS_CONFIG.PR_ACHIEVEMENT.points,
          description: "Set a new personal best for any exercise"
        },
        {
          name: "Improvement Bonus",
          points: `${POINTS_CONFIG.IMPROVEMENT_PERCENT.points}x`,
          description: "Extra points per 1% improvement (max 50pts) - awarded for ANY progress, even if not a PR"
        },
        {
          name: "Beat Friends",
          points: COMPETITIVE_BONUS_CONFIG.TAKEOVER.points,
          description: "Surpass another user's best weight"
        },
        {
          name: "Close Victory",
          points: COMPETITIVE_BONUS_CONFIG.CLOSE_WIN.points,
          description: "Win by less than 5% margin"
        }
      ]
    },
    {
      id: 'volume',
      title: "Volume",
      subtitle: "Work & Consistency",
      icon: (() => {
        const ActivityIcon = TOURNAMENT_ICONS.VOLUME;
        return <ActivityIcon className="h-4 w-4" />;
      })(),
      color: TOURNAMENT_GRADIENTS.VOLUME,
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
      borderColor: "border-blue-200/50 dark:border-blue-700/50",
      items: [
        {
          name: "Daily Workout",
          points: POINTS_CONFIG.DAILY_WORKOUT_BASE.points,
          description: "Complete 2+ exercises in a day"
        },
        {
          name: "Exercise Points",
          points: POINTS_CONFIG.EXERCISE_COMPLETED.points,
          description: "Points per exercise completed"
        },
        {
          name: "Exercise Variety",
          points: POINTS_CONFIG.EXERCISE_VARIETY_BONUS.points,
          description: "Bonus per exercise beyond 2nd in a day"
        },
        {
          name: "Consistency Bonus",
          points: POINTS_CONFIG.CONSISTENCY_BONUS.points,
          description: "5+ workout days in the week"
        },
        {
          name: "Weekend Warrior",
          points: POINTS_CONFIG.WEEKEND_BONUS.points,
          description: "Extra points for weekend workouts"
        }
      ]
    },
    {
      id: 'bonuses',
      title: "Bonuses",
      subtitle: "Achievements",
      icon: (() => {
        const AwardIcon = TOURNAMENT_ICONS.BONUSES;
        return <AwardIcon className="h-4 w-4" />;
      })(), 
      color: TOURNAMENT_GRADIENTS.BONUSES,
      bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200/50 dark:border-emerald-700/50",
      items: [
        {
          name: "Category Master",
          points: POINTS_CONFIG.CATEGORY_COMPLETION.points,
          description: "Work all muscle groups in a week"
        },
        {
          name: "Core Focus",
          points: POINTS_CONFIG.CORE_FOCUS_BONUS.points,
          description: "Bonus per core exercise completed"
        },
        {
          name: "First Time PR",
          points: COMPETITIVE_BONUS_CONFIG.FIRST_TIME_PR.points,
          description: "First log for any exercise"
        },
        {
          name: "New Exercise Bonus",
          points: 25,
          description: "25pts for each new unique exercise per category (up to 5 per category per user, lifetime)"
        }
      ]
    }
  ];

  // Key achievement badges for mobile display
  const keyBadges = [
    {
      type: BadgeType.PERFECT_WEEK,
      icon: (() => {
        const FlameIcon = TOURNAMENT_ICONS[BadgeType.PERFECT_WEEK];
        return <FlameIcon className="h-4 w-4" />;
      })(),
      color: TOURNAMENT_GRADIENTS[BadgeType.PERFECT_WEEK]
    },
    {
      type: BadgeType.CONSISTENCY_KING,
      icon: (() => {
        const CrownIcon = TOURNAMENT_ICONS[BadgeType.CONSISTENCY_KING];
        return <CrownIcon className="h-4 w-4" />;
      })(),
      color: TOURNAMENT_GRADIENTS[BadgeType.CONSISTENCY_KING]
    },
    {
      type: BadgeType.VOLUME_CRUSHER,
      icon: (() => {
        const ActivityIcon = TOURNAMENT_ICONS[BadgeType.VOLUME_CRUSHER];
        return <ActivityIcon className="h-4 w-4" />;
      })(),
      color: TOURNAMENT_GRADIENTS[BadgeType.VOLUME_CRUSHER]
    },
    {
      type: BadgeType.WEEKEND_WARRIOR,
      icon: (() => {
        const ZapIcon = TOURNAMENT_ICONS[BadgeType.WEEKEND_WARRIOR];
        return <ZapIcon className="h-4 w-4" />;
      })(),
      color: TOURNAMENT_GRADIENTS[BadgeType.WEEKEND_WARRIOR]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/30 border-0 rounded-3xl">
        {/* Mobile-optimized Header */}
        <DialogHeader className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-border/30 p-4 z-10 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {(() => {
                  const BookOpenIcon = TOURNAMENT_ICONS.RULEBOOK;
                  return <BookOpenIcon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Tournament Rules
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  How points are calculated
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full h-9 w-9 p-0 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Quick Overview */}
          <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-4 border border-blue-200/30 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex-shrink-0">
                {(() => {
                  const TrophyIcon = TOURNAMENT_ICONS.PERFORMANCE;
                  return <TrophyIcon className="h-4 w-4" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Weekly Competition</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Compete Monday-Sunday. Points reset each week.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                    {(() => {
                      const CalendarIcon = TOURNAMENT_ICONS.DAILY_WORKOUT;
                      return <CalendarIcon className="h-3 w-3 text-blue-500" />;
                    })()}
                    <span>Mon-Sun</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                    {(() => {
                      const UsersIcon = TOURNAMENT_ICONS.USERS;
                      return <UsersIcon className="h-3 w-3 text-emerald-500" />;
                    })()}
                    <span>Friends</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                    {(() => {
                      const TrendingUpIcon = TOURNAMENT_ICONS.IMPROVEMENT_DETAIL;
                      return <TrendingUpIcon className="h-3 w-3 text-purple-500" />;
                    })()}
                    <span>Progressive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Point Categories - Mobile Collapsible */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Point Categories</h3>
            
            {pointCategories.map((category) => (
              <div key={category.id} className={`${category.bgColor} rounded-2xl border ${category.borderColor} overflow-hidden`}>
                <button
                  onClick={() => setExpandedSection(expandedSection === category.id ? null : category.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 ease-out"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-foreground text-sm">{category.title}</h4>
                      <p className="text-xs text-muted-foreground">{category.subtitle}</p>
                    </div>
                  </div>
                  <div className={`transition-transform duration-300 ease-out ${expandedSection === category.id ? 'rotate-90' : 'rotate-0'}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-out ${
                  expandedSection === category.id 
                    ? 'max-h-[500px] opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-4 pb-4 space-y-2">
                    {category.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{item.points}pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Key Achievement Badges - Mobile Grid */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Key Achievement Badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {keyBadges.map((badge) => {
                const badgeData = BADGE_DEFINITIONS[badge.type];
                return (
                  <div key={badge.type} className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${badge.color} text-white`}>
                        {badge.icon}
                      </div>
                      <div className="text-xs font-medium text-foreground">{badgeData.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{badgeData.description}</div>
                    <div className="text-xs font-bold text-foreground">+{badgeData.points} pts</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Tips - Mobile Optimized */}
          <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-4 border border-emerald-200/30 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Lightbulb className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Pro Tips</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium">Consistency beats intensity</span>
                  <div className="text-xs text-muted-foreground">5+ workout days = 60pt bonus</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium">Any progress earns points</span>
                  <div className="text-xs text-muted-foreground">Improvement bonus for ANY weight gain, PRs get extra 50pts</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium">Diversify your training</span>
                  <div className="text-xs text-muted-foreground">All muscle groups = 50pt bonus</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium">Try new exercises for bonus points</span>
                  <div className="text-xs text-muted-foreground">25pts for each new unique exercise per category (max 5 per category, lifetime)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs text-muted-foreground py-2">
            Rules update automatically • Points calculated in real-time
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRulebook;
