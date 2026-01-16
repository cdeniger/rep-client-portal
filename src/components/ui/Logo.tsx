// Hexagon icon removed in favor of typographic logo

interface LogoProps {
    className?: string;
    subtitle?: string; // Optional subtitle (e.g. "Internal", "Portal")
    collapsed?: boolean; // For collapsed sidebar state if needed
}

export default function Logo({ className = "", subtitle, collapsed = false }: LogoProps) {
    return (
        <div className={`flex items-baseline gap-2 ${className}`}>
            {/* Main Wordmark "Rep." */}
            {!collapsed ? (
                <div className="flex flex-col">
                    <h1
                        className="font-sans font-black text-2xl tracking-tighter text-white leading-none relative"
                        style={{ letterSpacing: '-0.05em' }}
                    >
                        Rep<span className="text-signal-orange">.</span>
                    </h1>
                </div>
            ) : (
                // Collapsed state: just the "R."
                <h1 className="font-sans font-black text-2xl tracking-tighter text-white leading-none">
                    R<span className="text-signal-orange">.</span>
                </h1>
            )}

            {/* Subtitle (Portal / Internal) */}
            {!collapsed && subtitle && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest self-center pt-1 border-l border-white/20 pl-2 ml-1">
                    {subtitle}
                </span>
            )}
        </div>
    );
}
