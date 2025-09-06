const Footer = () => {
    return (
      <footer className="border-t">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-slate-700 ">
              © 2025 Excalidraw Clone. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="https://github.com/Tusharshah3" className="text-slate-800 hover:text-white">
               @github-Tushar 
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
              </a>
            </div>
          </div>
        </div>
      </footer>
    )
}

export default Footer