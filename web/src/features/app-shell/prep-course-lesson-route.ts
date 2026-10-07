/** Prep lesson player has a full-width bottom action bar; chat must not cover CTAs. */
function isPrepCourseLessonRoute(pathname: string): boolean {
  return /^\/app\/prep-course\/[^/]+\/[^/]+(\/start)?$/.test(pathname)
}

export { isPrepCourseLessonRoute }
