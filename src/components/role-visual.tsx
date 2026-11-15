import type { Role } from "@/data/content"
import { DeviceDashboard } from "@/components/device-dashboard"
import { DocPipeline } from "@/components/doc-pipeline"
import { EntityTagger } from "@/components/entity-tagger"
import { IotPipeline } from "@/components/iot-pipeline"
import { VoiceCall } from "@/components/voice-call"

// Small animation shown next to the logo on a role page, one per role.
export function RoleVisual({ kind }: { kind: Role["visual"] }) {
  switch (kind) {
    case "voice":
      return <VoiceCall />
    case "docs":
      return <DocPipeline />
    case "ner":
      return <EntityTagger />
    case "iot":
      return <IotPipeline />
    case "fleet":
      return <DeviceDashboard />
    default:
      return null
  }
}
