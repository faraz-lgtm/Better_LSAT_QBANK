const data = await adminApi.listPrepTests(pageSize, requestedPage * pageSize)
// ...
next = next.filter((row) => {
  const hasLg = Boolean(row.has_lg)
  if (activeFilter === "lg") {
    return hasLg
  }
})