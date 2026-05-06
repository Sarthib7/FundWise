import { Composition } from "remotion"
import { FundwiseXClip } from "./FundwiseXClip"

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FundwiseXClip"
        component={FundwiseXClip}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ format: "landscape" }}
      />
      <Composition
        id="FundwiseXSquare"
        component={FundwiseXClip}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ format: "square" }}
      />
    </>
  )
}
