import { HashRouter, Route, Routes } from "react-router-dom"

import { SiteHeader } from "@/components/site-header"
import { BlogPage } from "@/pages/blog"
import { EducationPage } from "@/pages/education"
import { ExperiencePage } from "@/pages/experience"
import { HomePage } from "@/pages/home"
import { ProjectsPage } from "@/pages/projects"

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-svh bg-background text-foreground">
        <SiteHeader />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/experience" element={<ExperiencePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/blog" element={<BlogPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
