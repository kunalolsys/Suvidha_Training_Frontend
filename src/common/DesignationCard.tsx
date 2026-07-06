import { useState } from "react";

export default function DesignationGrid({ videosByDesg, designationIcons }) {
  // 1. Configure threshold limits (e.g., 6 cards default for a clean 3-column start)
  const INITIAL_VISIBLE_COUNT = 6;
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Slice dataset dynamically based on toggled viewing state
  const visibleCards = isExpanded 
    ? videosByDesg 
    : videosByDesg.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Counter Banner to inform the Admin */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-500 bg-background-100 px-2.5 py-1 rounded-full">
          Showing {visibleCards.length} of {videosByDesg.length} Designations
        </span>
      </div>

      {/* ─── GRID CONTAINER LAYER ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((item) => (
          <div
            key={item.designationId || item.designation}
            className="bg-background-50 border border-background-200 rounded-xl p-5 hover:border-primary-300 transition-all hover:shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-100 text-accent-600">
                <i className={`${designationIcons[item.designation] || designationIcons['Default'] || 'ri-video-line'} text-xl`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground-900 truncate" title={item.designation}>
                  {item.designation}
                </h4>
                <p className="text-xs text-foreground-500 mt-0.5">
                  {item.employees} {item.employees === 1 ? 'employee' : 'employees'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-background-100 rounded-lg px-3 py-2.5">
                <p className="text-lg font-semibold text-foreground-900">{item.trainingVideos}</p>
                <p className="text-xs text-foreground-500">training videos</p>
              </div>
              <div className="flex-1 bg-background-100 rounded-lg px-3 py-2.5">
                <p className="text-lg font-semibold text-foreground-900">{item.employees}</p>
                <p className="text-xs text-foreground-500">{item.employees === 1 ? 'employee' : 'employees'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── DYNAMIC COLLAPSIBLE EXPANSION ACTION BAR ─── */}
      {videosByDesg.length > INITIAL_VISIBLE_COUNT && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 px-5 py-2.5 bg-background-50 border border-background-300 rounded-xl text-sm font-medium text-foreground-700 hover:bg-background-100 hover:text-primary-600 transition-all shadow-sm cursor-pointer"
          >
            <span>{isExpanded ? "Show Less" : `View All (${videosByDesg.length})`}</span>
            <i className={`text-base transition-transform duration-200 
              ${isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line group-hover:translate-y-0.5"}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}