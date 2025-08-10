import RexusLogo from "@/assets/Rexus_Logo.png";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header = ({ title, showBackButton, onBack }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <div className="flex flex-col">
              <img
                src={RexusLogo}
                alt="Rexus"
                className="h-6 w-auto"
              />
              <span className="text-xs text-muted-foreground">Made for everyone</span>
            </div>
          </div>
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>
      </div>
    </header>
  );
};
