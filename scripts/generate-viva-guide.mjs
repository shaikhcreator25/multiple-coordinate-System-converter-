import { mkdir, writeFile } from 'node:fs/promises'
import { jsPDF } from 'jspdf'

const outputPath = new URL('../public/BasisBridge-Project-and-Viva-Guide.pdf', import.meta.url)
const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
const pageWidth = 210
const margin = 18
const contentWidth = pageWidth - margin * 2
const ink = [28, 42, 63]
const muted = [91, 108, 129]
const blue = [62, 111, 190]
const pale = [240, 245, 251]
let y = 22
let pageNumber = 1

function footer() {
  pdf.setDrawColor(224, 231, 240)
  pdf.line(margin, 284, pageWidth - margin, 284)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...muted)
  pdf.text('BasisBridge | Project 12 | Faculty presentation and viva guide', margin, 290)
  pdf.text(String(pageNumber), pageWidth - margin, 290, { align: 'right' })
}

function newPage() {
  footer()
  pdf.addPage()
  pageNumber += 1
  y = 21
}

function ensureSpace(height = 18) {
  if (y + height > 277) newPage()
}

function section(title, subtitle) {
  ensureSpace(28)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(...ink)
  pdf.text(title, margin, y)
  y += 7
  if (subtitle) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...muted)
    pdf.text(subtitle, margin, y)
    y += 9
  } else {
    y += 4
  }
}

function heading(text) {
  ensureSpace(15)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...blue)
  pdf.text(text, margin, y)
  y += 6
}

function paragraph(text, options = {}) {
  const { size = 9.5, color = ink, indent = 0, gap = 4 } = options
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(size)
  pdf.setTextColor(...color)
  const lines = pdf.splitTextToSize(text, contentWidth - indent)
  ensureSpace(lines.length * 4.7 + gap)
  pdf.text(lines, margin + indent, y)
  y += lines.length * 4.7 + gap
}

function bullet(text) {
  ensureSpace(9)
  pdf.setFillColor(...blue)
  pdf.circle(margin + 1.4, y - 1.1, 0.75, 'F')
  paragraph(text, { indent: 5, gap: 1.5 })
}

function formula(text, options = {}) {
  const { size = 9.2, gap = 5 } = options
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(size)
  const lines = pdf.splitTextToSize(text, contentWidth - 10)
  const height = lines.length * 5 + 6
  ensureSpace(height + gap)
  pdf.setFillColor(...pale)
  pdf.setDrawColor(225, 233, 243)
  pdf.roundedRect(margin, y - 4, contentWidth, height, 2, 2, 'FD')
  pdf.setTextColor(43, 61, 85)
  pdf.text(lines, margin + 5, y + 1)
  y += height + gap
}

function qa(question, answer) {
  ensureSpace(20)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...ink)
  const qLines = pdf.splitTextToSize(`Q. ${question}`, contentWidth)
  pdf.text(qLines, margin, y)
  y += qLines.length * 4.5 + 1
  paragraph(`A. ${answer}`, { size: 9, color: muted, gap: 4 })
}

function callout(title, text) {
  const titleLines = pdf.splitTextToSize(title, contentWidth - 12)
  const bodyLines = pdf.splitTextToSize(text, contentWidth - 12)
  const height = titleLines.length * 5 + bodyLines.length * 4.5 + 11
  ensureSpace(height + 6)
  pdf.setFillColor(236, 244, 255)
  pdf.setDrawColor(202, 221, 246)
  pdf.roundedRect(margin, y - 4, contentWidth, height, 2, 2, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...blue)
  pdf.text(titleLines, margin + 6, y + 2)
  y += titleLines.length * 5 + 3
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...ink)
  pdf.text(bodyLines, margin + 6, y)
  y += bodyLines.length * 4.5 + 10
}

function beginSection(title, subtitle) {
  newPage()
  section(title, subtitle)
}

function cover() {
  pdf.setFillColor(13, 22, 36)
  pdf.rect(0, 0, pageWidth, 297, 'F')
  pdf.setFillColor(36, 67, 111)
  pdf.circle(169, 89, 49, 'F')
  pdf.setDrawColor(120, 171, 238)
  pdf.setLineWidth(0.7)
  pdf.line(128, 103, 176, 55)
  pdf.line(128, 103, 187, 105)
  pdf.line(128, 103, 122, 50)
  pdf.setFillColor(246, 201, 107)
  pdf.circle(128, 103, 2.4, 'F')
  pdf.setFillColor(105, 167, 255)
  pdf.circle(176, 55, 2, 'F')
  pdf.setFillColor(189, 139, 255)
  pdf.circle(187, 105, 2, 'F')
  pdf.setFillColor(81, 223, 190)
  pdf.circle(122, 50, 2, 'F')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(151, 191, 247)
  pdf.text('LINEAR ALGEBRA  |  PROJECT 12', margin, 45)
  pdf.setFontSize(34)
  pdf.setTextColor(245, 248, 253)
  pdf.text('BasisBridge', margin, 66)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(17)
  pdf.setTextColor(207, 220, 239)
  pdf.text('Project explanation & viva guide', margin, 79)
  pdf.setFontSize(10)
  pdf.setTextColor(165, 183, 207)
  pdf.text(pdf.splitTextToSize('Interactive Multiple Coordinate System Transformation Lab', 108), margin, 91)

  pdf.setDrawColor(78, 100, 133)
  pdf.line(margin, 130, pageWidth - margin, 130)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(224, 234, 248)
  pdf.text('A practical guide to presenting the project,', margin, 149)
  pdf.text('explaining the mathematics, and answering viva questions.', margin, 156)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(158, 177, 201)
  pdf.text('Includes a worked example, application walkthrough, implementation notes,', margin, 171)
  pdf.text('verification strategy, presentation script, and 25 questions with answers.', margin, 178)
  pdf.setFontSize(9)
  pdf.setTextColor(128, 151, 181)
  pdf.text('Prepared for an undergraduate Linear Algebra and Vector Calculus mini-project.', margin, 258)
  pdf.text('Use the explanations in your own words and be ready to demonstrate the app live.', margin, 265)
  pageNumber = 1
}

cover()

beginSection('1. Project at a glance', 'A concise, faculty-friendly explanation of what BasisBridge does and why it matters.')
heading('Project aim')
paragraph('To transform an initial vector successively through three valid coordinate bases, show every intermediate coordinate vector and change-of-basis matrix, then reverse the transformations and verify that the original vector is recovered.')
heading('Problem being solved')
paragraph('A geometric vector can be described using many different bases. Students often confuse the vector itself with the coordinate column used to describe it. BasisBridge makes the distinction visible: the geometric arrow stays fixed while its numerical coordinates change with the chosen basis.')
heading('What the application does')
bullet('Accepts a 2D or 3D vector, plus three editable basis matrices.')
bullet('Checks dimensions, finite input values, and basis invertibility before doing the conversion.')
bullet('Computes the standard-to-basis-1 conversion and the B1-to-B2 and B2-to-B3 coordinate changes.')
bullet('Displays matrices, multiplication steps, intermediate coordinates, and a reverse round-trip check.')
bullet('Provides 2D animated frames, a rotatable and zoomable 3D view, local experiment history, and PDF/CSV exports.')
callout('One-sentence summary', 'BasisBridge is an offline-ready educational lab that changes coordinate descriptions, not the underlying geometric vector, and checks its work by reversing the changes.')

heading('Learning outcomes')
paragraph('The project demonstrates basis and dimension, linear independence, change of basis, matrix multiplication, matrix representation of linear maps, inverse matrices, numerical tolerance, and round-trip verification.')

beginSection('2. Mathematical foundations', 'Know what each symbol means before describing the software.')
heading('Vectors, bases, and dimension')
paragraph('A vector space is a collection of vectors that can be added and scaled. A basis is a linearly independent set that spans the whole space. The number of vectors in a basis is the dimension. Therefore a basis of R^2 has two independent vectors and a basis of R^3 has three.')
paragraph('BasisBridge stores those basis vectors as the columns of a square matrix B. For example, if b1 = [1, 1] and b2 = [1, -1], then the corresponding basis matrix is:')
formula('B2 = [ 1   1 ]\\n     [ 1  -1 ]')
heading('A vector versus its coordinates')
paragraph('The geometric vector v is independent of the coordinate system. Its coordinate column [v]_B contains the coefficients needed to combine the basis vectors and make v. In column notation, v = B [v]_B. If B is invertible, solving this equation gives [v]_B = B^-1 v.')
formula('v = B [v]_B      therefore      [v]_B = B^-1 v')
heading('Changing coordinates between two bases')
paragraph('Suppose [v]_source gives a vector in basis B_source. First reconstruct the standard vector using B_source, then express it in B_destination. Combining the two operations gives the change-of-basis matrix:')
formula('P_destination<-source = B_destination^-1 B_source\\n[v]_destination = P_destination<-source [v]_source')
callout('Important direction convention', 'The rightmost matrix acts first. The destination basis is inverted; the source basis is not. Keep vectors as columns and multiply matrices from the left.')
heading('Why invertibility matters')
paragraph('A square matrix is invertible exactly when its columns are linearly independent. If the columns are dependent, they do not form a basis, coordinates are not unique, and the basis inverse does not exist. The app rejects singular or numerically unstable bases rather than showing a misleading result.')

beginSection('3. Worked default example', 'These are the values loaded when the lab starts. Practice explaining every line.')
heading('Inputs and coordinate bases')
formula('v = [5, 4]\\nB1 = [ 1  0 ]    B2 = [ 1   1 ]    B3 = [ 2  0 ]\\n     [ 0  1 ]         [ 1  -1 ]         [ 0  1 ]')
paragraph('B1 is the standard basis. The determinant of B2 is -2, and the determinant of B3 is 2. All three determinants are nonzero, so all three bases are valid.')
heading('Step 1: Standard coordinates into Basis 1')
formula('B1^-1 = I\\n[v]_B1 = B1^-1 v = [5, 4]')
heading('Step 2: Basis 1 into Basis 2')
formula('B2^-1 = [ 0.5   0.5 ]\\n         [ 0.5  -0.5 ]\\nP21 = B2^-1 B1 = B2^-1\\n[v]_B2 = P21 [v]_B1\\n       = [ 0.5   0.5 ] [ 5 ] = [ 4.5 ]\\n         [ 0.5  -0.5 ] [ 4 ]   [ 0.5 ]')
paragraph('Check directly: [4.5, 0.5] means 4.5 times [1, 1] plus 0.5 times [1, -1], which equals [5, 4].')
heading('Step 3: Basis 2 into Basis 3')
formula('B3^-1 = [ 0.5  0 ]\\n         [ 0    1 ]\\nP32 = B3^-1 B2 = [ 0.5   0.5 ]\\n                    [ 1    -1 ]\\n[v]_B3 = P32 [v]_B2 = [ 2.5, 4 ]')
heading('Reverse and verify')
formula('P32^-1 [v]_B3 = [4.5, 0.5] = [v]_B2\\nP21^-1 [v]_B2 = [5, 4] = [v]_B1\\nB1 [v]_B1 = [5, 4] = original v\\nMaximum absolute error = 0; verification = PASS')
callout('Quick geometric check', 'The Basis 3 coordinates [2.5, 4] mean 2.5 times [2, 0] plus 4 times [0, 1] = [5, 4]. The original vector did not move.')

beginSection('4. How the application is built', 'Explain the implementation as a sequence of understandable parts.')
heading('Technology choices')
bullet('React and TypeScript build the interactive user interface and give the matrix data explicit types.')
bullet('Vite serves the development app and produces the optimized production build.')
bullet('A custom numerical engine performs pivoted Gauss-Jordan inversion, determinants, matrix products, and vector products. No API or cloud calculation is used.')
bullet('Three.js renders the interactive 3D coordinate scene; the 2D scene uses SVG.')
bullet('Lucide React supplies interface icons; jsPDF generates reports; browser localStorage stores experiments on the device.')
heading('Calculation pipeline')
formula('1. Parse and validate vector and matrix entries.\\n2. Check three square bases of the selected dimension.\\n3. Find each determinant and inverse; reject an unstable pivot.\\n4. Compute [v]_B1 = B1^-1 v.\\n5. Compute P21 = B2^-1 B1 and [v]_B2 = P21 [v]_B1.\\n6. Compute P32 = B3^-1 B2 and [v]_B3 = P32 [v]_B2.\\n7. Reverse with P32^-1, then P21^-1, then reconstruct with B1.\\n8. Compare reconstructed and original coordinates against tolerance 1e-9.')
heading('Numerical stability and tolerance')
paragraph('Computers use floating-point numbers, so operations may introduce tiny rounding errors. The inversion routine chooses the largest available pivot in a column and rejects pivots that are too small relative to the matrix scale. The app computes the maximum absolute difference, max_i |v_reconstructed,i - v_original,i|, and passes if it is at most 1e-9.')
heading('User-facing validation')
paragraph('Blank, non-finite, wrong-dimension, singular, and numerically unstable inputs produce an actionable error. A rejected input disables run/save actions so an invalid basis cannot be treated as a successful transformation.')

beginSection('5. App demonstration and presentation', 'A short, repeatable walkthrough for a faculty demonstration.')
heading('Suggested 2-minute presentation')
paragraph('“Our project is BasisBridge, an interactive multiple coordinate system converter. Its goal is to take a vector through three bases and verify the result by reversing the transformations. I will use v = [5, 4] with an identity basis, an oblique basis, and a scaled basis.”')
bullet('Start at Dashboard and introduce the goal and mathematical concepts.')
bullet('Open Input Configuration. Point out that basis vectors are matrix columns, then identify the default example.')
bullet('Run the transformation. Explain that [v]_B1 = B1^-1 v and that P21 = B2^-1 B1.')
bullet('Read out [v]_B2 = [4.5, 0.5] and [v]_B3 = [2.5, 4]. Show the matrix explorer for the actual matrix products.')
bullet('Open visualization. Emphasize that the gold arrow is the unchanged geometric vector; the other colors identify bases.')
bullet('Open Reverse Verification. Show reconstruction [5, 4], maximum error, and PASS.')
bullet('Briefly mention that singular bases are rejected, experiments stay in local browser storage, and CSV/PDF files can be exported.')
heading('If asked to demonstrate 3D')
paragraph('Select 3D in Input Configuration. The included 3D preset supplies three invertible matrices and a three-component vector. Run it, open the 3D visualization, drag to rotate, and scroll to zoom. The coordinates and verification are recomputed by the same dimension-general matrix engine.')
heading('Presentation advice')
bullet('Say “coordinates change, vector stays the same” more than once; it is the key idea.')
bullet('Explain one matrix product clearly instead of reading every screen aloud.')
bullet('When asked about accuracy, give the tolerance (1e-9) and the maximum-error comparison.')
bullet('If you alter a basis, first predict whether its determinant is zero, then observe whether the validator accepts it.')

beginSection('6. Viva questions and answers (1-9)', 'Short answers are a starting point. Add the relevant example when answering.')
qa('What is the aim of BasisBridge?', 'To transform a vector successively through three valid bases, display intermediate coordinates and matrices, and recover the original vector through reverse transformations.')
qa('What is a basis?', 'A linearly independent set of vectors that spans the vector space. Every vector in the space has a unique coordinate representation in that basis.')
qa('What is the dimension of a vector space?', 'The number of vectors in any basis of the space. R^2 has dimension 2; R^3 has dimension 3.')
qa('How are basis vectors stored in this project?', 'As the columns of a square basis matrix. This matches the equation v = Bc for the coordinate column c.')
qa('What is the difference between a vector and its coordinate column?', 'The vector is the geometric object; its coordinate column is a list of coefficients relative to a chosen basis. The same vector can have different coordinate columns.')
qa('How do you convert standard coordinates into basis B?', 'Solve v = Bc. Since B is invertible, c = B^-1v, which the app writes as [v]_B = B^-1v.')
qa('What is the change-of-basis matrix from B1 to B2?', 'P21 = B2^-1 B1. It converts coordinates in B1 into coordinates in B2: [v]_B2 = P21 [v]_B1.')
qa('Why is the destination basis inverted?', 'We first turn the source coordinates into the geometric vector using B_source, then express that vector using the destination basis by multiplying by B_destination^-1.')
qa('Do coordinates change the geometric vector?', 'No. Under a pure change of basis the geometric vector is unchanged; only the coefficients used to describe it change.')

beginSection('7. Viva questions and answers (10-18)', 'Be prepared to explain validation and reverse verification.')
qa('What does linearly independent mean?', 'No vector in the set can be made from a linear combination of the others. Equivalently, the only combination that gives zero uses all-zero coefficients.')
qa('How is invertibility related to a basis?', 'A square matrix is invertible exactly when its columns are linearly independent. Its columns then form a basis.')
qa('What happens if a basis matrix is singular?', 'It has determinant zero and no inverse. The columns are dependent, so they do not form a basis and the coordinates may not be unique. The app stops the transformation.')
qa('What does the determinant tell you here?', 'For a square basis matrix, a nonzero determinant indicates invertibility. Its magnitude also describes volume scaling; its sign indicates orientation.')
qa('What is a linear transformation?', 'A map T that preserves addition and scalar multiplication: T(x + y) = T(x) + T(y) and T(ax) = aT(x). Matrix multiplication is a standard representation of a linear map.')
qa('Why do we use matrix multiplication?', 'It composes linear operations and transforms coordinate columns. In P21 = B2^-1 B1, the source basis is applied first, followed by the destination inverse.')
qa('How does reverse transformation verify the forward calculation?', 'It applies inverse coordinate changes in reverse order, reconstructs the vector in standard coordinates, and compares it with the original input.')
qa('Why is verification based on a tolerance instead of exact equality?', 'Floating-point arithmetic rounds results. A small difference such as 1e-15 can be normal; a tolerance like 1e-9 allows harmless rounding while detecting meaningful errors.')
qa('What is numerical stability?', 'How sensitive a calculation is to small input or rounding errors. A nearly singular matrix can amplify errors, so the app rejects pivots that are too small relative to matrix scale.')

beginSection('8. Viva questions and answers (19-25)', 'Questions about implementation, testing, visualization, and scope.')
qa('What inversion method is used?', 'A custom Gauss-Jordan elimination routine with partial pivoting: it chooses the largest-magnitude pivot in each column, normalizes the pivot row, and eliminates the other entries.')
qa('How does the app calculate a determinant?', 'It uses elimination with pivoting, multiplies the pivots, and accounts for row-swap sign changes.')
qa('How are dimensions validated?', 'The vector length must be 2 or 3; there must be exactly three basis matrices; and each must be a square matrix matching the chosen dimension.')
qa('How is the 3D view made interactive?', 'Three.js renders basis and vector arrows, grid, and axes. OrbitControls lets the viewer rotate and zoom the scene.')
qa('Where are experiment history entries stored?', 'In the browser localStorage on the current device. No account or remote service is needed; clearing browser storage can remove saved experiments.')
qa('What is tested automatically?', 'The test suite checks the required 2D example, a 3D example, reverse reconstruction, singular-basis rejection, invalid dimensions/non-finite values, and matrix multiplication dimensions.')
qa('What are limitations and possible future improvements?', 'The app uses JavaScript floating-point precision and a fixed practical tolerance. Future work could add condition-number estimates, customizable tolerances, import/export of saved experiment sets, and more basis presets.')
qa('Why is this more than a calculator?', 'It connects input, validation, intermediate matrices, coordinate explanations, visualization, learning content, history, exports, and round-trip verification in one reproducible experiment.')

beginSection('9. Final checklist and key takeaways', 'Use this page to rehearse just before the presentation.')
heading('Five facts worth memorizing')
bullet('Basis vectors are columns: v = B[v]_B.')
bullet('Standard-to-basis coordinates: [v]_B = B^-1v.')
bullet('Source-to-destination change: P_destination<-source = B_destination^-1 B_source.')
bullet('A valid square basis has nonzero determinant and an inverse.')
bullet('The vector stays the same; the coordinates change; reverse reconstruction checks the result.')
heading('Default example results')
formula('v = [5, 4]\\n[v]_B1 = [5, 4]\\n[v]_B2 = [4.5, 0.5]\\n[v]_B3 = [2.5, 4]\\nReconstructed v = [5, 4]\\nMaximum error = 0; PASS')
heading('Before you present')
bullet('Run npm run dev and open the local BasisBridge page.')
bullet('Keep the default example loaded and verify the Dashboard shows PASS.')
bullet('Know where Input Configuration, Matrix Explorer, Visualization, and Reverse Verification are in the sidebar.')
bullet('Be ready to make two columns identical to demonstrate a singular basis being rejected; restore the preset afterward.')
bullet('Do not describe a coordinate change as moving the geometric vector.')
callout('Closing sentence', 'BasisBridge demonstrates that changing a basis changes a vector’s coordinate description, while matrix inverses make conversion reversible and numerical comparison verifies the computation.')

footer()
await mkdir(new URL('../public/', import.meta.url), { recursive: true })
await writeFile(outputPath, Buffer.from(pdf.output('arraybuffer')))
console.log(`Created ${outputPath.pathname}`)
console.log(`Pages: ${pageNumber}`)
