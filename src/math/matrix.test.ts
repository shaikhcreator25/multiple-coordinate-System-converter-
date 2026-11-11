import { describe, expect, it } from 'vitest'
import { calculateTransformation, MatrixError, multiply, type Matrix } from './matrix'

describe('calculateTransformation', () => {
  it('matches the required 2D faculty demonstration and reconstructs the vector', () => {
    const result = calculateTransformation(
      [5, 4],
      [
        [[1, 0], [0, 1]],
        [[1, 1], [1, -1]],
        [[2, 0], [0, 1]],
      ],
    )

    expect(result.coordinates[0]).toEqual([5, 4])
    expect(result.coordinates[1]).toEqual([4.5, 0.5])
    expect(result.coordinates[2]).toEqual([2.5, 4])
    expect(result.reconstructed).toEqual([5, 4])
    expect(result.maxError).toBeLessThanOrEqual(1e-9)
    expect(result.verified).toBe(true)
  })

  it('calculates a 3D transformation and reverse path', () => {
    const result = calculateTransformation(
      [5, 4, 3],
      [
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        [[1, 1, 0], [1, -1, 0], [0, 0, 1]],
        [[2, 0, 0], [0, 1, 1], [0, 0, 2]],
      ],
    )

    expect(result.coordinates[0]).toEqual([5, 4, 3])
    expect(result.coordinates[1]).toEqual([4.5, 0.5, 3])
    expect(result.coordinates[2]).toEqual([2.5, 2.5, 1.5])
    expect(result.verified).toBe(true)
  })

  it('rejects a singular basis before transforming', () => {
    expect(() => calculateTransformation(
      [5, 4],
      [
        [[1, 0], [0, 1]],
        [[1, 1], [1, 1]],
        [[2, 0], [0, 1]],
      ],
    )).toThrow(MatrixError)
  })

  it('rejects invalid dimensions and non-finite input', () => {
    const validBasis: Matrix[] = [
      [[1, 0], [0, 1]],
      [[1, 1], [1, -1]],
      [[2, 0], [0, 1]],
    ]
    expect(() => calculateTransformation([1, 2], [validBasis[0]])).toThrow(/three bases/)
    expect(() => calculateTransformation([1, Number.NaN], validBasis)).toThrow(/finite number/)
  })

  it('checks matrix multiplication dimensions', () => {
    expect(multiply([[1, 2], [3, 4]], [[2], [1]])).toEqual([[4], [10]])
    expect(() => multiply([[1, 2]], [[1, 2]])).toThrow(/dimensions do not match/)
  })
})
