const cache = Object.create(null)

export default word => {
  if (!cache[word]) {
    cache[word] = word.replace(
      /-([a-z])/g,
      (_, char) => char.toUpperCase()
    )
  }
  return cache[word]
}
