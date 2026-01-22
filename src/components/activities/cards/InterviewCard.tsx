

import type { InterviewActivity } from '../../../types/activities';
import { Star, Users, MapPin } from 'lucide-react';

export default function InterviewCard({ activity }: { activity: InterviewActivity }) {
    const { round, rating, interviewers, location } = activity.metadata;

    return (
        <div className="flex gap-4 p-4 bg-white border border-amber-200 rounded-lg shadow-sm hover:border-amber-300 transition-colors relative overflow-hidden">
            {/* Visual Accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>

            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Star size={20} fill={rating ? "#f59e0b" : "none"} />
            </div>

            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-base font-bold text-stone-900">
                            {round || 'Interview'}
                        </h4>
                        {location && (
                            <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                                <MapPin size={12} /> {location}
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-stone-400 block">
                            {activity.performedAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {rating && (
                            <div className="flex items-center gap-0.5 mt-1 justify-end">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        className={i < rating ? "text-amber-400 fill-amber-400" : "text-amber-200"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {activity.notes && (
                    <p className="text-sm text-stone-700 whitespace-pre-wrap border-l-2 border-stone-100 pl-3 italic">
                        "{activity.notes}"
                    </p>
                )}

                {/* Inteviewers */}
                {interviewers && interviewers.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-50 mt-2">
                        <Users size={14} className="text-stone-400" />
                        <span className="text-xs font-medium text-stone-600">
                            {Array.isArray(interviewers) ? interviewers.join(', ') : interviewers}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
