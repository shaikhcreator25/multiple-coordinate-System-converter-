# BasisBridge

**BasisBridge — Interactive Multiple Coordinate System Transformation Lab** is an offline-ready learning application for the Linear Algebra and Vector Calculus mini-project, Project 12. It transforms a vector through three user-defined bases, displays every intermediate result, and checks the reverse transformation.

## Aim

Transform vectors successively through different bases and verify the transformations by reconstructing the original vector.

## Mathematical conventions and formulas

Each basis matrix stores basis vectors as **columns**. For a standard-coordinate vector \(v\) and basis matrices \(B_1, B_2, B_3\):

```text
[v]B1 = inverse(B1) × v
P21   = inverse(B2) × B1
[v]B2 = P21 × [v]B1
P32   = inverse(B3) × B2
[v]B3 = P32 × [v]B2

[v]B2 = inverse(P32) × [v]B3
[v]B1 = inverse(P21) × [v]B2
v      = B1 × [v]B1
```

Every basis is checked for square dimensions, finite components, and invertibility before it can be used. The round-trip passes when the maximum absolute coordinate error is at most `1e-9`.

## Mathematical concepts

- Basis and dimension
- Change of basis and coordinate representations
- Matrix multiplication
- Linear transformations and matrix representation
- Inverse matrices and reverse transformations
- Numerical error and verification

## Technologies

- React and TypeScript
- Vite
- Tailwind CSS
- Three.js for the interactive 3D scene
- Lucide React icons
- A custom pivoted Gauss–Jordan matrix engine
- jsPDF for local PDF reports
- Vitest for mathematical engine tests

No API keys, paid services, or external computation services are required.

## Installation and development

Install Node.js, then run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To verify a production build:

```bash
npm run build
npm test
```

Regenerate the faculty presentation and viva guide PDF:

```bash
npm run generate:guide
```

## Operating the lab

1. Choose **Input configuration** and select 2D or 3D.
2. Enter the initial vector and each basis matrix. Matrix columns represent basis vectors.
3. Use **Run transformation** to inspect all coordinate changes and their matrix products.
4. Open **Matrix explorer**, **2D / 3D visualization**, and **Reverse verification** to inspect the calculations from different angles.
5. Save an experiment to browser-local history, or export the current calculation as CSV or PDF.
6. Download the [project explanation and viva guide](./public/BasisBridge-Project-and-Viva-Guide.pdf) from the Export Report page.
7. Visit the Learning Centre for short explanations of the underlying concepts.

The 3D scene supports pointer-drag rotation and scroll zoom. The gold arrow is the unchanged geometric vector; the other colors identify the three basis frames.

## Sample test case

Input:

```text
v  = [5, 4]
B1 = [[1, 0], [0, 1]]
B2 = [[1, 1], [1, -1]]
B3 = [[2, 0], [0, 1]]
```

Expected results:

```text
[v]B1 = [5, 4]
[v]B2 = [4.5, 0.5]
[v]B3 = [2.5, 4]
Reconstructed v = [5, 4]
Verification = PASS
```
