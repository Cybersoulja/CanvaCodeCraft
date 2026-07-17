import { GameElement, Scene } from "@shared/schema";

/**
 * Returns a new scenes array with `element` appended to the scene matching
 * `sceneId`. Scenes other than the target are returned unchanged.
 */
export function addElementToScene(scenes: Scene[], sceneId: string, element: GameElement): Scene[] {
  return scenes.map((scene) =>
    scene.id === sceneId ? { ...scene, elements: [...scene.elements, element] } : scene
  );
}
