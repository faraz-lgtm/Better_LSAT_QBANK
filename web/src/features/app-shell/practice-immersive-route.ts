/** Practice question sessions fill the viewport; app chrome is hidden. */
function isPracticeImmersiveRoute(pathname: string): boolean {
  return (
    /^\/app\/practice\/drills\/session\/[^/]+$/.test(pathname) ||
    /^\/app\/practice\/sections\/session\/[^/]+$/.test(pathname)
  )
}

export { isPracticeImmersiveRoute }
