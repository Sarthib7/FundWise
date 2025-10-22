import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image 
                src="/fundflow-logo.png" 
                alt="FundFlow" 
                width={24} 
                height={24} 
                className="h-6 w-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-logo.svg';
                }}
              />
              <span className="font-semibold">FundFlow</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Privacy-preserving group fundraising on Solana using Light Protocol's ZK compression. Create groups, share
              codes, and collect funds together securely.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Light Protocol
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Solana
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© 2025 FundFlow. Built with privacy in mind.</p>
        </div>
      </div>
    </footer>
  )
}
