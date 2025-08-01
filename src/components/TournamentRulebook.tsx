import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  highlightItem?: string | null; // New prop for highlighting specific items
}

const TournamentRulebook: React.FC<TournamentRulebookProps> = ({ isOpen, onClose, initialSection, highlightItem }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('performance');
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

  // Handle initial section when rulebook opens
  useEffect(() => {
    if (isOpen && initialSection) {
      setExpandedSection(initialSection);
    }
    if (isOpen && highlightItem) {
      setHighlightedItem(highlightItem);
      
      // Scroll to the highlighted item after expansion animation
      setTimeout(() => {
        const element = document.querySelector(`[data-item-name="${highlightItem}"]`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300); // Wait for expansion animation
      
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedItem(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialSection, highlightItem]);

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
      <DialogContent className="max-w-lg max-h-[95vh] flex flex-col overflow-hidden p-0 bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/20 border-0 rounded-3xl shadow-2xl">
        {/* Mobile-optimized Header */}
        <DialogHeader className="flex-shrink-0 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-border/20 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg">
                {(() => {
                  const BookOpenIcon = TOURNAMENT_ICONS.RULEBOOK;
                  return <BookOpenIcon className="h-6 w-6" />;
                })()}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Tournament Guide
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Clear & Simple Point System
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full h-10 w-10 p-0 hover:bg-muted/60 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 max-h-[calc(95vh-120px)]">
          {/* Quick Overview Card */}
          <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-3xl p-6 border border-blue-200/40 dark:border-blue-800/40 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex-shrink-0 shadow-md">
                {(() => {
                  const TrophyIcon = TOURNAMENT_ICONS.PERFORMANCE;
                  return <TrophyIcon className="h-5 w-5" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-2">Weekly Competition</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Complete Monday-Sunday. Points reset each week. Compete with friends and track your fitness progress!
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 bg-white/70 dark:bg-slate-800/70 px-3 py-4 rounded-2xl">
                {(() => {
                  const CalendarIcon = TOURNAMENT_ICONS.DAILY_WORKOUT;
                  return <CalendarIcon className="h-5 w-5 text-blue-500" />;
                })()}
                <div className="text-center">
                  <div className="font-semibold text-sm text-foreground">7 Days</div>
                  <div className="text-xs text-muted-foreground">Mon-Sun</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white/70 dark:bg-slate-800/70 px-3 py-4 rounded-2xl">
                {(() => {
                  const UsersIcon = TOURNAMENT_ICONS.USERS;
                  return <UsersIcon className="h-5 w-5 text-emerald-500" />;
                })()}
                <div className="text-center">
                  <div className="font-semibold text-sm text-foreground">Friends</div>
                  <div className="text-xs text-muted-foreground">Compete</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 bg-white/70 dark:bg-slate-800/70 px-3 py-4 rounded-2xl">
                {(() => {
                  const TrendingUpIcon = TOURNAMENT_ICONS.IMPROVEMENT_DETAIL;
                  return <TrendingUpIcon className="h-5 w-5 text-purple-500" />;
                })()}
                <div className="text-center">
                  <div className="font-semibold text-sm text-foreground">Progress</div>
                  <div className="text-xs text-muted-foreground">Track</div>
                </div>
              </div>
            </div>
          </div>

          {/* Point Categories */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              How to Earn Points
            </h2>
            
            {pointCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <button
                  onClick={() => setExpandedSection(expandedSection === category.id ? null : category.id)}
                  className={`w-full text-left transition-all duration-200 rounded-2xl p-4 border ${category.borderColor} ${category.bgColor} hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${category.color} text-white shadow-sm`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">{category.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {category.id === 'performance' ? '150+' : 
                           category.id === 'volume' ? '200+' : '125+'}
                        </div>
                        <div className="text-xs text-muted-foreground">pts max</div>
                      </div>
                      {expandedSection === category.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedSection === category.id && (
                  <div className="space-y-3 px-4 pb-4">
                    {category.items.map((item, index) => (
                      <div 
                        key={index}
                        data-item-name={item.name}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-500 ${
                          highlightedItem === item.name 
                            ? 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 ring-2 ring-teal-400/50 scale-105' 
                            : 'bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-sm text-foreground">{item.points}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground mb-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Badges Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              Achievement Badges
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {keyBadges.map((badge, index) => (
                <div key={index} className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${badge.color} text-white shadow-sm flex-shrink-0`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {BADGE_DEFINITIONS[badge.type]?.name || badge.type}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {BADGE_DEFINITIONS[badge.type]?.description || 'Special achievement badge'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-green-50/90 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-green-950/30 rounded-3xl p-6 border border-emerald-200/40 dark:border-emerald-800/40">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex-shrink-0 shadow-md">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-3">Pro Tips</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Stay Consistent:</span> Log workouts daily to earn consistency bonuses and daily workout points.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Beat Your Records:</span> Focus on gradual improvements to earn performance points and improvement bonuses.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Mix It Up:</span> Try different exercise categories to maximize variety bonuses and earn special badges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRulebook;
