// Leitura de palma com MediaPipe Hand Landmarker (roda 100% no navegador;
// modelo e WASM servidos localmente em /mediapipe, sem depender do Google).
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

let landmarkerPromise = null

export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks('/mediapipe').then((fileset) =>
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/hand_landmarker.task' },
        runningMode: 'IMAGE',
        numHands: 1,
      }),
    )
    landmarkerPromise.catch(() => (landmarkerPromise = null))
  }
  return landmarkerPromise
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export async function readPalm(image) {
  const landmarker = await loadLandmarker()
  const result = landmarker.detect(image)
  if (!result.landmarks?.length) return null
  const p = result.landmarks[0]
  const w = image.naturalWidth || image.videoWidth || image.width
  const h = image.naturalHeight || image.videoHeight || image.height
  const pt = (i) => ({ x: p[i].x * w, y: p[i].y * h })

  // Medidas em pixels (normalizar por w/h evita distorção de proporção)
  const palmWidth = dist(pt(5), pt(17))
  const palmLength = dist(pt(0), pt(9))
  const middle = dist(pt(9), pt(10)) + dist(pt(10), pt(11)) + dist(pt(11), pt(12))
  const index = dist(pt(5), pt(6)) + dist(pt(6), pt(7)) + dist(pt(7), pt(8))
  const ring = dist(pt(13), pt(14)) + dist(pt(14), pt(15)) + dist(pt(15), pt(16))

  const palmRatio = palmLength / palmWidth // > ~1.25 = palma longa
  const fingerRatio = middle / palmLength // > ~0.85 = dedos longos
  const longPalm = palmRatio > 1.25
  const longFingers = fingerRatio > 0.85
  const element = longPalm ? (longFingers ? 'water' : 'fire') : longFingers ? 'air' : 'earth'

  return {
    element,
    ringLonger: ring > index,
    handedness: result.handedness?.[0]?.[0]?.categoryName,
    landmarks: p,
    metrics: { palmRatio, fingerRatio, indexRing: index / ring },
  }
}

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
]
