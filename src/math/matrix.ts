export type Matrix = number[][]
export type Vector = number[]

export interface TransformResult {
  dimension: number
  vector: Vector
  bases: Matrix[]
  determinants: number[]
  inverses: Matrix[]
  coordinates: Vector[]
  changes: Matrix[]
  reverseChanges: Matrix[]
  reverseCoordinates: Vector[]
  reconstructed: Vector
  absoluteErrors: Vector
  maxError: number
  verified: boolean
}

export class MatrixError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MatrixError'
  }
}

export function determinant(matrix: Matrix): number {
  const n = matrix.length
  if (n === 0 || matrix.some((row) => row.length !== n)) {
    throw new MatrixError('A determinant requires a non-empty square matrix.')
  }
  const work = matrix.map((row) => [...row])
  let sign = 1
  let result = 1

  for (let column = 0; column < n; column += 1) {
    let pivotRow = column
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(work[row][column]) > Math.abs(work[pivotRow][column])) {
        pivotRow = row
      }
    }
    const pivot = work[pivotRow][column]
    if (pivot === 0) return 0
    if (pivotRow !== column) {
      ;[work[pivotRow], work[column]] = [work[column], work[pivotRow]]
      sign *= -1
    }
    result *= work[column][column]
    for (let row = column + 1; row < n; row += 1) {
      const factor = work[row][column] / work[column][column]
      for (let next = column + 1; next < n; next += 1) {
        work[row][next] -= factor * work[column][next]
      }
    }
  }
  return sign * result
}

export function inverse(matrix: Matrix): Matrix {
  const n = matrix.length
  if (n === 0 || matrix.some((row) => row.length !== n)) {
    throw new MatrixError('A basis must be a non-empty square matrix.')
  }
  if (matrix.some((row) => row.some((value) => !Number.isFinite(value)))) {
    throw new MatrixError('Every basis component must be a finite number.')
  }

  const scale = Math.max(1, ...matrix.map((row) => row.reduce((sum, value) => sum + Math.abs(value), 0)))
  const threshold = Number.EPSILON * scale * n * 16
  const work = matrix.map((row, index) => [...row, ...row.map((_, col) => Number(index === col))])

  for (let column = 0; column < n; column += 1) {
    let pivotRow = column
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(work[row][column]) > Math.abs(work[pivotRow][column])) pivotRow = row
    }
    if (Math.abs(work[pivotRow][column]) <= threshold) {
      throw new MatrixError(`Basis is singular or numerically unstable (pivot ${column + 1} is too small).`)
    }
    ;[work[pivotRow], work[column]] = [work[column], work[pivotRow]]
    const pivot = work[column][column]
    work[column] = work[column].map((value) => value / pivot)

    for (let row = 0; row < n; row += 1) {
      if (row === column) continue
      const factor = work[row][column]
      work[row] = work[row].map((value, col) => value - factor * work[column][col])
    }
  }
  return work.map((row) => row.slice(n))
}

export function multiply(left: Matrix, right: Matrix): Matrix {
  if (!left.length || !right.length || left[0].length !== right.length) {
    throw new MatrixError('Matrix multiplication dimensions do not match.')
  }
  const columns = right[0].length
  if (right.some((row) => row.length !== columns)) {
    throw new MatrixError('Matrix multiplication requires rectangular matrices.')
  }
  return left.map((row) =>
    Array.from({ length: columns }, (_, column) =>
      row.reduce((sum, value, index) => sum + value * right[index][column], 0),
    ),
  )
}

export function multiplyVector(matrix: Matrix, vector: Vector): Vector {
  if (!matrix.length || matrix[0].length !== vector.length || matrix.some((row) => row.length !== vector.length)) {
    throw new MatrixError('Matrix and vector dimensions do not match.')
  }
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0))
}

export function calculateTransformation(vector: Vector, bases: Matrix[]): TransformResult {
  const dimension = vector.length
  if (dimension !== 2 && dimension !== 3) throw new MatrixError('Choose a 2D or 3D vector space.')
  if (bases.length !== 3 || bases.some((basis) => basis.length !== dimension || basis.some((row) => row.length !== dimension))) {
    throw new MatrixError(`Each of the three bases must be a ${dimension} × ${dimension} matrix.`)
  }
  if (vector.some((value) => !Number.isFinite(value))) throw new MatrixError('Every vector component must be a finite number.')

  const determinants = bases.map(determinant)
  const inverses = bases.map(inverse)
  const coordinates: Vector[] = [multiplyVector(inverses[0], vector)]
  const changes = [
    multiply(inverses[1], bases[0]),
    multiply(inverses[2], bases[1]),
  ]
  const reverseChanges = changes.map(inverse)
  coordinates.push(multiplyVector(changes[0], coordinates[0]))
  coordinates.push(multiplyVector(changes[1], coordinates[1]))

  const reverseToBasis2 = multiplyVector(reverseChanges[1], coordinates[2])
  const reverseToBasis1 = multiplyVector(reverseChanges[0], reverseToBasis2)
  const reconstructed = multiplyVector(bases[0], reverseToBasis1)
  const absoluteErrors = reconstructed.map((value, index) => Math.abs(value - vector[index]))
  const maxError = Math.max(...absoluteErrors)

  return {
    dimension,
    vector,
    bases,
    determinants,
    inverses,
    coordinates,
    changes,
    reverseChanges,
    reverseCoordinates: [reverseToBasis2, reverseToBasis1],
    reconstructed,
    absoluteErrors,
    maxError,
    verified: Number.isFinite(maxError) && maxError <= 1e-9,
  }
}

export function formatNumber(value: number, precision = 4): string {
  if (!Number.isFinite(value)) return 'undefined'
  const rounded = Number(value.toPrecision(precision))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

export function matrixText(matrix: Matrix): string {
  return matrix.map((row) => `[ ${row.map((value) => formatNumber(value)).join('   ')} ]`).join('\n')
}

export function vectorText(vector: Vector): string {
  return `[ ${vector.map((value) => formatNumber(value)).join('   ')} ]`
}
