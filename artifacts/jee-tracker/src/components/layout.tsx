import { Link, useLocation } from "wouter";
import { BookOpen, CheckSquare, Target, FlaskConical } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const nav = [
    { href: "/", label: "Dashboard", icon: Target },
    { href: "/progress", label: "Progress", icon: BookOpen },
    { href: "/daily", label: "Daily Log", icon: CheckSquare },
    { href: "/tests", label: "Test Analysis", icon: FlaskConical },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
              J
            </div>
            <span className="font-semibold text-lg tracking-tight">JEE Tracker</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {nav.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
