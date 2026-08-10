/** Practice / diagnostic exam UIs fill the viewport; app chrome is hidden. */
function isPracticeImmersiveRoute(pathname: string): boolean {
  return (
    /^\/app\/practice\/drills\/session\/[^/]+$/.test(pathname) ||
    /^\/app\/practice\/sections\/session\/[^/]+$/.test(pathname) ||
    /^\/app\/practice\/blind-review\/[^/]+$/.test(pathname) ||
    /^\/app\/diagnostic\/(review|tester)$/.test(pathname) ||
    /^\/diagnostic\/(review|tester)(\/preview)?$/.test(pathname)
  )
}

export { isPracticeImmersiveRoute }
