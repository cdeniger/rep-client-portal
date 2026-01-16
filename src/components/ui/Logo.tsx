import { Hexagon } from 'lucide-react';

interface LogoProps {
    className?: string;
    subtitle?: string; // Optional subtitle (e.g. "Internal", "Portal")
    collapsed?: boolean; // For collapsed sidebar state if needed
}

export default function Logo({ className = "", subtitle, collapsed = false }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="h-8 w-8 bg-signal-orange rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm border border-white/10">
                <Hexagon className="h-5 w-5 text-white" fill="currentColor" strokeWidth={2.5} />
            </div>
            {!collapsed && (
                <div>
                    <h1 className="font-bold text-sm uppercase tracking-widest text-white leading-none mb-0.5">Rep.</h1>
                    {subtitle && (
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block leading-none">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
