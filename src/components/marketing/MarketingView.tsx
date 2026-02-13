import { Megaphone, TrendingUp, Target, BarChart3 } from 'lucide-react';

export function MarketingView() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Marketing Dashboard</h1>
          <p className="text-brand-textMuted mt-1">Your CMO insights and campaigns</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: '3', icon: Target, color: 'text-blue-400' },
          { label: 'Reach', value: '24.5K', icon: TrendingUp, color: 'text-green-400' },
          { label: 'Engagement', value: '8.2%', icon: BarChart3, color: 'text-yellow-400' },
          { label: 'Conversions', value: '147', icon: Megaphone, color: 'text-brand-gold' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-brand-card border border-brand-border rounded-xl p-6 hover:border-brand-gold/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-textMuted text-sm">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-brand-text">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* CMO Insights */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">CMO Insights</h2>
        <div className="space-y-4">
          <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-brand-text font-medium mb-1">LinkedIn engagement is up 45%</h3>
                <p className="text-brand-textMuted text-sm">
                  Your B2B content is resonating well. Consider increasing posting frequency.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-brand-text font-medium mb-1">New market opportunity detected</h3>
                <p className="text-brand-textMuted text-sm">
                  MENA fintech sector shows high engagement. Recommend targeted campaign.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
            <div className="flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-brand-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-brand-text font-medium mb-1">Campaign performance summary</h3>
                <p className="text-brand-textMuted text-sm">
                  Q1 campaigns delivered 147 qualified leads. ROI: 320%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-8 text-center">
        <Megaphone className="w-12 h-12 text-brand-gold mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-brand-text mb-2">
          Ready to scale your marketing?
        </h3>
        <p className="text-brand-textMuted mb-4">
          Ask Caesar to build your marketing strategy
        </p>
        <button className="px-6 py-2 bg-gradient-to-r from-brand-gold to-brand-goldBright text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-brand-gold/20 transition-all">
          Talk to Caesar
        </button>
      </div>
    </div>
  );
}
