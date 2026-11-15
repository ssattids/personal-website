import { Mail } from "lucide-react"

import { profile } from "@/data/content"
import { GlowHero } from "@/components/glow-hero"

export function Hero() {
  const [first] = profile.name.split(" ")

  return (
    <GlowHero
      id="top"
      badge={{ label: "Now", text: profile.current, href: "#experience" }}
      title={
        <>
          {profile.name}
          <br />
          {profile.role}
        </>
      }
      description={profile.about}
      cta={{ label: "Get in touch", href: `mailto:${profile.email}`, icon: <Mail /> }}
      watermark={first}
    />
  )
}
