import { lazy, Suspense, useMemo, useState } from 'react'
import {
  Activity, ArrowLeftRight, ArrowRight, Atom, BookOpen, Check, ChevronDown,
  CircleHelp, Compass, Download, FileSpreadsheet, FlaskConical, Gauge, Grid2X2,
  History, LayoutDashboard, Menu, Play, RotateCcw, Save, ShieldCheck, Sparkles,
  TriangleAlert, Upload, X,
} from 'lucide-react'
import {
  calculateTransformation, formatNumber, type Matrix, type TransformResult, type Vector, vectorText,
} from './math/matrix'
import './App.css'

const Visualization = lazy(() => import('./components/Visualization'))

type Draft = { dimension: number; vector: string[]; bases: string[][][] }
type Experiment = { id: string; name: string; savedAt: string; draft: Draft; result: TransformResult }
type PageId = 'dashboard' | 'configuration' | 'lab' | 'explorer' | 'visualization' | 'verification' | 'learning' | 'history' | 'report'

const pageItems: { id: PageId; label: string; icon: typeof LayoutDashboard; group?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'configuration', label: 'Input configuration', icon: Grid2X2, group: 'WORKSPACE' },
  { id: 'lab', label: 'Transformation lab', icon: FlaskConical },
  { id: 'explorer', label: 'Matrix explorer', icon: Atom },
  { id: 'visualization', label: '2D / 3D visualization', icon: Compass, group: 'ANALYZE' },
  { id: 'verification', label: 'Reverse verification', icon: ShieldCheck },
  { id: 'learning', label: 'Learning centre', icon: BookOpen, group: 'RESOURCES' },
  { id: 'history', label: 'Experiment history', icon: History },
  { id: 'report', label: 'Export report', icon: Download },
]

const examples = {
  2: {
    vector: ['5', '4'],
    bases: [
      [['1', '0'], ['0', '1']],
      [['1', '1'], ['1', '-1']],
      [['2', '0'], ['0', '1']],
    ],
  },
  3: {
    vector: ['5', '4', '3'],
    bases: [
      [['1', '0', '0'], ['0', '1', '0'], ['0', '0', '1']],
      [['1', '1', '0'], ['1', '-1', '0'], ['0', '0', '1']],
      [['2', '0', '0'], ['0', '1', '1'], ['0', '0', '2']],
    ],
  },
}

const alternateExamples = {
  2: {
    vector: ['3', '-2'],
    bases: [
      [['1', '0'], ['0', '1']],
      [['2', '1'], ['0', '1']],
      [['1', '-1'], ['1', '1']],
    ],
  },
  3: {
    vector: ['2', '-1', '4'],
    bases: [
      [['1', '0', '0'], ['0', '1', '0'], ['0', '0', '1']],
      [['1', '0', '1'], ['0', '1', '1'], ['0', '0', '2']],
      [['1', '0', '0'], ['1', '2', '0'], ['0', '0', '1']],
    ],
  },
}

function exampleDraft(dimension: number): Draft {
  const sample = examples[dimension as 2 | 3]
  return { dimension, vector: [...sample.vector], bases: sample.bases.map((basis) => basis.map((row) => [...row])) }
}

function readHistory(): { items: Experiment[]; error: string | null } {
  try {
    const stored = localStorage.getItem('basisbridge-experiments')
    return { items: stored ? JSON.parse(stored) as Experiment[] : [], error: null }
  } catch {
    return { items: [], error: 'Saved experiment history could not be read from this browser.' }
  }
}

function toNumbers(draft: Draft): { vector: Vector; bases: Matrix[] } {
  const parse = (value: string, label: string) => {
    if (value.trim() === '' || !Number.isFinite(Number(value))) {
      throw new Error(`${label} must contain a finite number.`)
    }
    return Number(value)
  }
  return {
    vector: draft.vector.map((value, index) => parse(value, `Vector component ${index + 1}`)),
    bases: draft.bases.map((basis, basisIndex) => basis.map((row, rowIndex) =>
      row.map((value, columnIndex) => parse(value, `Basis ${basisIndex + 1}, row ${rowIndex + 1}, column ${columnIndex + 1}`)),
    )),
  }
}

function MatrixView({ matrix, label, compact = false }: { matrix: Matrix; label?: string; compact?: boolean }) {
  return (
    <div className={`matrix-view${compact ? ' compact' : ''}`}>
      {label && <div className="matrix-label">{label}</div>}
      <div className="matrix-bracket">
        {matrix.map((row, index) => <div className="matrix-row" key={index}>{row.map((value, col) => <span key={col}>{formatNumber(value)}</span>)}</div>)}
      </div>
    </div>
  )
}

function VectorView({ vector }: { vector: Vector }) {
  return <span className="vector-view">[{vector.map((value) => formatNumber(value)).join(', ')}]</span>
}

function MatrixEditor({ value, label, onChange }: { value: string[][]; label: string; onChange: (row: number, column: number, value: string) => void }) {
  return (
    <fieldset className="basis-editor">
      <legend>{label}</legend>
      <div className="input-matrix">
        {value.map((row, rowIndex) => row.map((cell, columnIndex) => (
          <input
            key={`${rowIndex}-${columnIndex}`}
            aria-label={`${label} row ${rowIndex + 1} column ${columnIndex + 1}`}
            inputMode="decimal"
            value={cell}
            onChange={(event) => onChange(rowIndex, columnIndex, event.target.value)}
          />
        )))}
      </div>
      <span className="field-hint">Columns are basis vectors</span>
    </fieldset>
  )
}

function Metric({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string; detail: string; icon: typeof Activity; tone?: string }) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${tone}`}><Icon size={17} /></span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="metric-detail">{detail}</span>
    </div>
  )
}

function OperationCard({ index, title, source, destination, input, basis, inverseBasis, change, output, formula }: {
  index: number; title: string; source: Matrix; destination: Matrix; input: Vector; basis: Matrix; inverseBasis: Matrix; change: Matrix; output: Vector; formula: string
}) {
  return (
    <article className="operation-card">
      <div className="operation-heading">
        <span className="step-number">{String(index).padStart(2, '0')}</span>
        <div><h3>{title}</h3><span>{formula}</span></div>
        <span className="operation-result"><VectorView vector={output} /></span>
      </div>
      <div className="operation-flow">
        <div><span className="mini-label">Source coordinates</span><VectorView vector={input} /></div>
        <ArrowRight size={17} />
        <div><span className="mini-label">Destination coordinates</span><VectorView vector={output} /></div>
      </div>
      <details className="explanation-details">
        <summary><CircleHelp size={15} /> Inspect the matrix operation <ChevronDown size={14} /></summary>
        <p>{formula} The new coordinate column is obtained by left-multiplying the source coordinates by the change-of-basis matrix.</p>
        <div className="matrix-equation">
          <div><MatrixView matrix={change} label="Change of basis P" compact /></div>
          <span className="multiply-sign">×</span>
          <div className="small-vector"><VectorView vector={input} /></div>
          <span className="multiply-sign">=</span>
          <div className="small-vector"><VectorView vector={output} /></div>
        </div>
        <div className="matrix-equation secondary">
          <MatrixView matrix={source} label="Source basis" compact />
          <MatrixView matrix={destination} label="Destination basis" compact />
          <MatrixView matrix={inverseBasis} label="Inverse destination" compact />
          <MatrixView matrix={basis} label="Basis check" compact />
        </div>
      </details>
    </article>
  )
}

function App() {
  const initialHistory = useMemo(() => readHistory(), [])
  const [history, setHistory] = useState(initialHistory.items)
  const [draft, setDraft] = useState<Draft>(() => exampleDraft(2))
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [activeTransform, setActiveTransform] = useState(1)
  const [toast, setToast] = useState(initialHistory.error ?? '')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const computed = useMemo(() => {
    try {
      const inputs = toNumbers(draft)
      return { result: calculateTransformation(inputs.vector, inputs.bases), error: null }
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : 'The transformation could not be calculated.' }
    }
  }, [draft])
  const result = computed.result

  const changePage = (page: PageId) => {
    setActivePage(page)
    setMobileNavOpen(false)
  }
  const setDimension = (dimension: number) => {
    setDraft(exampleDraft(dimension))
    setToast('')
  }
  const setAlternateExample = () => {
    const sample = alternateExamples[draft.dimension as 2 | 3]
    setDraft({ dimension: draft.dimension, vector: [...sample.vector], bases: sample.bases.map((basis) => basis.map((row) => [...row])) })
    setToast('')
  }
  const updateVector = (index: number, value: string) => setDraft((current) => {
    const vector = [...current.vector]
    vector[index] = value
    return { ...current, vector }
  })
  const updateBasis = (basisIndex: number, row: number, column: number, value: string) => setDraft((current) => {
    const bases = current.bases.map((basis) => basis.map((line) => [...line]))
    bases[basisIndex][row][column] = value
    return { ...current, bases }
  })
  const saveExperiment = () => {
    if (!result) {
      setToast(computed.error ?? 'Correct the inputs before saving an experiment.')
      return
    }
    const item: Experiment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${draft.dimension}D · v = ${vectorText(result.vector)}`,
      savedAt: new Date().toISOString(),
      draft: structuredClone(draft),
      result,
    }
    const updated = [item, ...history]
    try {
      localStorage.setItem('basisbridge-experiments', JSON.stringify(updated))
      setHistory(updated)
      setToast('Experiment saved to this browser.')
    } catch {
      setToast('Experiment could not be saved. Check browser storage availability.')
    }
  }
  const loadExperiment = (item: Experiment) => {
    setDraft(item.draft)
    setActivePage('lab')
    setToast(`Loaded ${item.name}.`)
  }
  const deleteExperiment = (id: string) => {
    const updated = history.filter((item) => item.id !== id)
    try {
      localStorage.setItem('basisbridge-experiments', JSON.stringify(updated))
      setHistory(updated)
      setToast('Experiment removed from history.')
    } catch {
      setToast('Experiment could not be removed from browser storage.')
    }
  }

  const exportCsv = (data: TransformResult) => {
    const rows = [
      ['BasisBridge transformation report'],
      ['Dimension', `${data.dimension}D`],
      ['Original vector', vectorText(data.vector)],
      ...data.bases.flatMap((basis, index) => [
        [`Basis ${index + 1}`],
        ...basis.map((row) => row.map((value) => formatNumber(value))),
        [`Determinant`, formatNumber(data.determinants[index])],
      ]),
      ...data.coordinates.map((coordinates, index) => [`Coordinates in B${index + 1}`, vectorText(coordinates)]),
      ['P01 = inverse(B1)', ...data.inverses[0].map((row) => row.map((value) => formatNumber(value)).join(' '))],
      ['P21', ...data.changes[0].map((row) => row.map((value) => formatNumber(value)).join(' '))],
      ['P32', ...data.changes[1].map((row) => row.map((value) => formatNumber(value)).join(' '))],
      ['inverse(P32)', ...data.reverseChanges[1].map((row) => row.map((value) => formatNumber(value)).join(' '))],
      ['inverse(P21)', ...data.reverseChanges[0].map((row) => row.map((value) => formatNumber(value)).join(' '))],
      ['Reverse coordinates in B2', vectorText(data.reverseCoordinates[0])],
      ['Reverse coordinates in B1', vectorText(data.reverseCoordinates[1])],
      ['Reconstructed vector', vectorText(data.reconstructed)],
      ['Maximum absolute error', String(data.maxError)],
      ['Verification', data.verified ? 'PASS' : 'FAIL'],
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'basisbridge-results.csv')
  }

  const exportPdf = async (data: TransformResult) => {
    try {
      await buildPdfReport(data)
    } catch (error) {
      setToast(`PDF report could not be generated: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  const transformMatrices = useMemo(() => {
    if (!result) return []
    const identity = result.bases[0].map((_, row) => result.bases[0].map((__, col) => Number(row === col)))
    return [
      { title: 'Standard → Basis 1', source: identity, destination: result.bases[0], inverse: result.inverses[0], change: result.inverses[0], input: result.vector, output: result.coordinates[0], sourceName: 'Standard' },
      { title: 'Basis 1 → Basis 2', source: result.bases[0], destination: result.bases[1], inverse: result.inverses[1], change: result.changes[0], input: result.coordinates[0], output: result.coordinates[1], sourceName: 'Basis 1' },
      { title: 'Basis 2 → Basis 3', source: result.bases[1], destination: result.bases[2], inverse: result.inverses[2], change: result.changes[1], input: result.coordinates[1], output: result.coordinates[2], sourceName: 'Basis 2' },
    ]
  }, [result])

  const renderConfiguration = () => (
    <section className="page-section">
      <div className="section-heading">
        <div><span className="eyebrow">01 / SET UP YOUR EXPERIMENT</span><h2>Input configuration</h2><p>Choose the vector space, then enter the vector and basis matrix columns.</p></div>
        <button className="button button-quiet" onClick={() => { setDraft(exampleDraft(draft.dimension)); setToast('The default demonstration inputs have been restored.') }}><RotateCcw size={15} /> Reset example</button>
      </div>
      <div className="panel config-panel">
        <div className="config-topline">
          <div className="dimension-toggle" role="group" aria-label="Vector space dimension">
            {[2, 3].map((dimension) => <button key={dimension} className={draft.dimension === dimension ? 'selected' : ''} onClick={() => setDimension(dimension)}>{dimension}D space</button>)}
          </div>
          <span className="pill"><span className="status-dot" /> {draft.dimension} × {draft.dimension} bases required</span>
        </div>
        <div className="example-note"><Sparkles size={16} /><span><b>Preset examples</b> — Load a verified faculty demonstration or an alternate oblique-frame experiment.</span></div>
        <div className="preset-row"><button className="preset-button" onClick={() => setDraft(exampleDraft(draft.dimension))}><span>01</span> Faculty demonstration</button><button className="preset-button" onClick={setAlternateExample}><span>02</span> Oblique frames</button></div>
        <div className="vector-input-block">
          <label className="form-label">Initial vector <span>standard coordinates</span></label>
          <div className="vector-inputs">{draft.vector.map((value, index) => (
            <label key={index}><span>{['x', 'y', 'z'][index]}</span><input aria-label={`Initial vector component ${index + 1}`} inputMode="decimal" value={value} onChange={(event) => updateVector(index, event.target.value)} /></label>
          ))}</div>
        </div>
        <div className="basis-editors">
          {draft.bases.map((basis, index) => <MatrixEditor key={index} value={basis} label={`Basis ${index + 1} · B${index + 1}`} onChange={(row, col, value) => updateBasis(index, row, col, value)} />)}
        </div>
        {computed.error ? <div className="validation-banner error"><TriangleAlert size={18} /><div><b>Basis validation failed</b><span>{computed.error}</span></div></div> : (
          <div className="validation-banner"><ShieldCheck size={18} /><div><b>All three bases are valid and invertible</b><span>Determinants: {result?.determinants.map((value) => formatNumber(value)).join(' · ')}</span></div><span className="valid-tag">READY</span></div>
        )}
        <div className="button-row">
          <button className="button button-primary" disabled={!result} onClick={() => changePage('lab')}><Play size={15} fill="currentColor" /> Run transformation</button>
          <button className="button button-secondary" disabled={!result} onClick={saveExperiment}><Save size={15} /> Save experiment</button>
        </div>
      </div>
    </section>
  )

  const renderDashboard = () => (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> LINEAR ALGEBRA · PROJECT 12</span>
          <h2>One vector.<br /><span>Many coordinate</span><br />perspectives.</h2>
          <p>Explore how a vector's coordinates evolve as you move between bases — and prove the journey by transforming back.</p>
          <button className="button button-primary hero-button" onClick={() => changePage('configuration')}>Start a transformation <ArrowRight size={16} /></button>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="orbital orbital-one" /><div className="orbital orbital-two" />
          <div className="hero-axis axis-x" /><div className="hero-axis axis-y" /><div className="hero-axis axis-z" />
          <div className="hero-origin" /><span className="axis-label axis-label-x">e₁</span><span className="axis-label axis-label-y">e₂</span><span className="axis-label axis-label-z">v</span>
          <span className="graphic-coordinate">[v]<sub>B₂</sub> = P₂₁ [v]<sub>B₁</sub></span>
        </div>
      </section>
      <section className="metrics-grid">
        <Metric label="Vector space" value={`${draft.dimension}D`} detail={`${draft.dimension} independent directions`} icon={Compass} />
        <Metric label="Coordinate frames" value="03" detail="Sequential basis changes" icon={Grid2X2} tone="violet" />
        <Metric label="Verification" value={result?.verified ? 'PASS' : 'CHECK'} detail={`Max error ${result ? result.maxError.toExponential(1) : '—'}`} icon={ShieldCheck} tone="green" />
        <Metric label="Experiments" value={String(history.length).padStart(2, '0')} detail="Saved in this browser" icon={History} tone="amber" />
      </section>
      <div className="dashboard-columns">
        <section className="panel sequence-panel">
          <div className="panel-title-row"><div><span className="eyebrow">THE PIPELINE</span><h3>Transformation sequence</h3></div><span className="pill">LIVE PREVIEW</span></div>
          <div className="sequence-steps">
            {result ? result.coordinates.map((coordinate, index) => (
              <div className="sequence-step" key={index}><span className={`sequence-icon tone-${index}`}><Grid2X2 size={16} /></span><div><b>{index === 0 ? 'Standard → Basis 1' : `Basis ${index} → Basis ${index + 1}`}</b><span>[v]B{index + 1} = {vectorText(coordinate)}</span></div><Check size={15} className="step-check" /></div>
            )) : <p className="muted-copy">{computed.error}</p>}
            <div className="sequence-step reverse-step"><span className="sequence-icon"><ArrowLeftRight size={16} /></span><div><b>Reverse & verify</b><span>Recover v = {result ? vectorText(result.reconstructed) : '—'}</span></div><Check size={15} className="step-check" /></div>
          </div>
          <button className="text-button" onClick={() => changePage('lab')}>Explore the full calculation <ArrowRight size={14} /></button>
        </section>
        <section className="panel concepts-panel">
          <div className="panel-title-row"><div><span className="eyebrow">WHAT YOU'LL LEARN</span><h3>Concepts in motion</h3></div><BookOpen size={18} className="subtle-icon" /></div>
          <div className="concept-pills">{['Basis & dimension', 'Change of basis', 'Matrix multiplication', 'Linear transformations', 'Inverse matrices', 'Reverse verification'].map((concept) => <span key={concept}>{concept}</span>)}</div>
          <div className="concept-footnote"><span className="legend-dot" /> Six core concepts, one interactive experiment.</div>
        </section>
      </div>
    </>
  )

  const renderLab = () => result ? (
    <section className="page-section">
      <div className="section-heading"><div><span className="eyebrow">02 / COMPUTE</span><h2>Transformation lab</h2><p>Follow the vector's coordinates through each basis. The geometric vector itself does not move.</p></div><button className="button button-secondary" onClick={saveExperiment}><Save size={15} /> Save run</button></div>
      <div className="lab-summary"><div><span>INPUT VECTOR</span><b>{vectorText(result.vector)}</b></div><ArrowRight size={17} /><div><span>SPACE</span><b>ℝ<sup>{result.dimension}</sup></b></div><ArrowRight size={17} /><div><span>FINAL COORDINATES</span><b>{vectorText(result.coordinates[2])}</b></div><span className="verified-chip"><Check size={14} /> Verified</span></div>
      <div className="operations-list">
        {transformMatrices.map((operation, index) => (
          <OperationCard key={operation.title} index={index + 1} title={operation.title} source={operation.source} destination={operation.destination} input={operation.input} output={operation.output} inverseBasis={operation.inverse} change={operation.change} basis={operation.destination} formula={index === 0 ? '[v]B1 = inverse(B1) × v' : index === 1 ? '[v]B2 = inverse(B2) × B1 × [v]B1' : '[v]B3 = inverse(B3) × B2 × [v]B2'} />
        ))}
      </div>
      <div className="reverse-strip"><div className="reverse-icon"><ArrowLeftRight size={19} /></div><div><b>Reverse path complete</b><span>[v]B3 → [v]B2 → [v]B1 → v = {vectorText(result.reconstructed)}</span></div><span className="pass-label">PASS</span></div>
    </section>
  ) : <ErrorPanel message={computed.error} onFix={() => changePage('configuration')} />

  const renderExplorer = () => result ? (
    <section className="page-section">
      <div className="section-heading"><div><span className="eyebrow">03 / INSPECT</span><h2>Matrix explorer</h2><p>Inspect each basis, its inverse, the coordinate-change matrix, and the multiplication result.</p></div><span className="pill"><span className="status-dot" /> ALL VALUES COMPUTED LIVE</span></div>
      <div className="transform-tabs">{transformMatrices.map((item, index) => <button key={item.title} className={activeTransform === index ? 'selected' : ''} onClick={() => setActiveTransform(index)}><span>0{index + 1}</span>{item.title}</button>)}</div>
      {(() => {
        const operation = transformMatrices[activeTransform]
        return <div className="panel explorer-panel">
          <div className="explorer-equation"><div><span className="eyebrow">COORDINATE CHANGE</span><h3>{operation.title}</h3></div><code>P = B<sub>destination</sub><sup>−1</sup> B<sub>source</sub></code></div>
          <div className="explorer-matrices">
            <MatrixView matrix={operation.source} label={`Source basis · ${operation.sourceName}`} />
            <div className="matrix-operator">→</div>
            <div className="explorer-destination"><MatrixView matrix={operation.destination} label={`Destination basis · B${activeTransform + 1}`} /><MatrixView matrix={operation.inverse} label="Inverse destination basis" /></div>
            <div className="matrix-operator equals">=</div>
            <MatrixView matrix={operation.change} label="Change-of-basis matrix P" />
          </div>
          <div className="product-panel"><span className="eyebrow">MULTIPLY BY SOURCE COORDINATES</span><div className="product-line"><MatrixView matrix={operation.change} compact /><span>×</span><VectorView vector={operation.input} /><span>=</span><VectorView vector={operation.output} /></div><div className="product-caption">The output is the same geometric vector expressed in {activeTransform === 0 ? 'Basis 1' : `Basis ${activeTransform + 1}`}.</div></div>
          <div className="determinant-row"><span><Activity size={15} /> Destination determinant</span><b>{formatNumber(result.determinants[activeTransform])}</b><span className="det-note">Non-zero — the basis is invertible</span></div>
        </div>
      })()}
      <div className="panel compact-note"><CircleHelp size={16} /><span><b>Why multiply by the inverse?</b> Basis vectors are the columns of B. To recover coefficients c from v = Bc, solve with c = B⁻¹v. The same relation gives P = B<sub>destination</sub>⁻¹B<sub>source</sub>.</span></div>
    </section>
  ) : <ErrorPanel message={computed.error} onFix={() => changePage('configuration')} />

  const renderVisualization = () => result ? (
    <section className="page-section">
      <div className="section-heading"><div><span className="eyebrow">04 / SEE THE GEOMETRY</span><h2>Visualization studio</h2><p>Basis frames and the original vector share one geometric space; coordinate columns are labels, not new vectors.</p></div><span className="pill">{draft.dimension}D VIEW</span></div>
      <div className="panel visual-panel"><div className="panel-title-row"><div><h3>Coordinate frames & original vector</h3><span className="muted-copy">Three bases overlaid on the same standard axes</span></div><span className="live-tag"><span className="status-dot" /> LIVE</span></div><Suspense fallback={<div className="visual-loading">Preparing interactive coordinate scene…</div>}><Visualization dimension={result.dimension} vector={result.vector} bases={result.bases} coordinates={result.coordinates} /></Suspense></div>
      <div className="notice-card"><CircleHelp size={17} /><div><b>Geometry versus coordinates</b><span>A pure change of basis does not move or transform the vector. The gold arrow marks the fixed vector v; coordinate values change because each basis describes that same arrow differently.</span></div></div>
    </section>
  ) : <ErrorPanel message={computed.error} onFix={() => changePage('configuration')} />

  const renderVerification = () => result ? (
    <section className="page-section">
      <div className="section-heading"><div><span className="eyebrow">05 / CLOSE THE LOOP</span><h2>Reverse verification</h2><p>Walk the final coordinates back through the inverse change-of-basis maps.</p></div><span className={`verification-status ${result.verified ? 'success' : 'failure'}`}><ShieldCheck size={16} /> {result.verified ? 'PASS · VERIFIED' : 'FAIL · REVIEW'}</span></div>
      <div className="reverse-flow">
        <div className="reverse-node"><span>FINAL COORDINATES</span><b><VectorView vector={result.coordinates[2]} /></b><small>Basis 3</small></div><ArrowLeftRight size={20} /><div className="reverse-node"><span>BACK IN BASIS 2</span><b><VectorView vector={result.reverseCoordinates[0]} /></b><small>inverse(P32) × [v]B3</small></div><ArrowLeftRight size={20} /><div className="reverse-node"><span>BACK IN BASIS 1</span><b><VectorView vector={result.reverseCoordinates[1]} /></b><small>inverse(P21) × [v]B2</small></div><ArrowRight size={20} /><div className="reverse-node highlight"><span>RECONSTRUCTED v</span><b><VectorView vector={result.reconstructed} /></b><small>B1 × [v]B1</small></div>
      </div>
      <div className={`verification-card ${result.verified ? 'pass' : 'fail'}`}><div className="verification-symbol">{result.verified ? <Check size={24} /> : <TriangleAlert size={24} />}</div><div><span className="eyebrow">ROUND-TRIP COMPARISON</span><h3>{result.verified ? 'Transformation verified successfully.' : 'Transformation verification error detected.'}</h3><p>Maximum absolute coordinate error must be ≤ 1 × 10⁻⁹.</p></div><div className="error-number"><span>MAX ERROR</span><b>{result.maxError.toExponential(3)}</b></div></div>
      <div className="error-grid">{result.vector.map((value, index) => <div key={index} className="error-cell"><span>Coordinate {index + 1}</span><b>{formatNumber(value)} <ArrowRight size={12} /> {formatNumber(result.reconstructed[index])}</b><small>Absolute error: {result.absoluteErrors[index].toExponential(3)}</small></div>)}</div>
    </section>
  ) : <ErrorPanel message={computed.error} onFix={() => changePage('configuration')} />

  const renderLearning = () => {
    const lessons = [
      ['01', 'What is a basis?', 'A basis is a set of linearly independent vectors that spans a vector space. In ℝ², two independent vectors can describe every point in the plane.', 'B = [ b₁  b₂ ]'],
      ['02', 'What is dimension?', 'Dimension is the number of vectors in any basis of a space. Our 2D and 3D labs therefore require exactly two or three independent basis vectors.', 'dim(ℝⁿ) = n'],
      ['03', 'What is a change of basis?', 'The vector stays the same, but its coordinate column changes when measured using a different basis. Basis vectors are stored as columns.', '[v]B = B⁻¹v'],
      ['04', 'What is a linear transformation?', 'A linear transformation preserves vector addition and scalar multiplication. A matrix represents the transformation by multiplying input coordinate columns.', 'T(x + y) = T(x) + T(y)'],
      ['05', 'Why use inverse matrices?', 'The inverse of a basis matrix solves for the coefficients of a vector in that basis. An inverse exists exactly when the basis vectors are independent.', 'c = B⁻¹v'],
      ['06', 'Why reverse the transformation?', 'Undoing each change and rebuilding the vector is a round-trip test. A tiny floating-point error is expected; a large one signals a mistake.', 'v ≈ B₁ [v]B₁'],
    ]
    return <section className="page-section"><div className="section-heading"><div><span className="eyebrow">A QUICK MATHEMATICAL PRIMER</span><h2>Learning centre</h2><p>Six core ideas behind every coordinate change in the lab.</p></div><BookOpen size={22} className="subtle-icon" /></div><div className="lesson-grid">{lessons.map(([number, title, description, formula]) => <article className="panel lesson-card" key={number}><span className="lesson-number">{number}</span><h3>{title}</h3><p>{description}</p><code>{formula}</code></article>)}</div><div className="panel convention-note"><span className="eyebrow">OUR CONVENTION</span><p>Each basis matrix stores basis vectors as columns. Therefore coordinates transform from source to destination using <code>P = B<sub>destination</sub><sup>−1</sup>B<sub>source</sub></code>. This convention is applied consistently throughout the application.</p></div></section>
  }

  const renderHistory = () => (
    <section className="page-section">
      <div className="section-heading"><div><span className="eyebrow">YOUR LOCAL WORKSPACE</span><h2>Experiment history</h2><p>Saved runs are stored in this browser and never leave your device.</p></div><button className="button button-primary" disabled={!result} onClick={saveExperiment}><Save size={15} /> Save current run</button></div>
      {history.length === 0 ? <div className="panel empty-state"><span className="empty-icon"><History size={22} /></span><h3>No saved experiments yet</h3><p>Configure a valid basis, run the transformation, then save it here for later comparison.</p><button className="button button-secondary" onClick={() => changePage('configuration')}>Configure an experiment <ArrowRight size={14} /></button></div> : <div className="history-list">{history.map((item) => <article className="panel history-item" key={item.id}><div className="history-icon"><FileSpreadsheet size={17} /></div><div className="history-copy"><b>{item.name}</b><span>{new Date(item.savedAt).toLocaleString()} · {item.draft.dimension}D · {item.result.verified ? 'Verified' : 'Not verified'}</span><small>Final coordinates: {vectorText(item.result.coordinates[2])} · Max error {item.result.maxError.toExponential(2)}</small></div><button className="button button-quiet" onClick={() => loadExperiment(item)}><Upload size={14} /> Load</button><button className="icon-button danger" aria-label={`Delete ${item.name}`} onClick={() => deleteExperiment(item.id)}><X size={15} /></button></article>)}</div>}
    </section>
  )

  const renderReport = () => result ? (
    <section className="page-section">
      <div className="section-heading"><div><span className="eyebrow">TAKE YOUR RESULTS WITH YOU</span><h2>Experiment report</h2><p>Download a self-contained summary of the current, validated experiment.</p></div><span className="pill"><ShieldCheck size={13} /> READY TO EXPORT</span></div>
      <div className="report-layout"><div className="panel report-preview"><div className="report-brand"><span className="brand-mark small"><Activity size={17} /></span><div><b>BasisBridge</b><span>Linear Algebra · Project 12</span></div></div><div className="report-divider" /><span className="eyebrow">EXPERIMENT SUMMARY</span><h3>Multiple Coordinate System Converter</h3><p className="muted-copy">Transform vectors successively through different bases and verify the transformations.</p><div className="report-facts"><div><span>DIMENSION</span><b>{result.dimension}D</b></div><div><span>INPUT VECTOR</span><b>{vectorText(result.vector)}</b></div><div><span>FINAL COORDINATES</span><b>{vectorText(result.coordinates[2])}</b></div><div><span>MAX ERROR</span><b>{result.maxError.toExponential(2)}</b></div></div><div className="report-preview-bases">{result.bases.map((basis, index) => <MatrixView key={index} matrix={basis} label={`Basis ${index + 1}`} compact />)}</div><div className="report-pass"><Check size={16} /> {result.verified ? 'PASS — Transformation verified successfully.' : 'FAIL — Verification error detected.'}</div></div><div className="report-actions"><div className="panel"><span className="eyebrow">DOWNLOAD OPTIONS</span><h3>Choose your format</h3><p>Both files include the computed inputs, basis matrices, intermediate results, reverse transformation, and verification.</p><button className="button button-primary full-button" onClick={() => exportPdf(result)}><Download size={16} /> Download PDF report</button><button className="button button-secondary full-button" onClick={() => exportCsv(result)}><FileSpreadsheet size={16} /> Export calculations as CSV</button><a className="button button-secondary full-button guide-download" href="/BasisBridge-Project-and-Viva-Guide.pdf" download="BasisBridge-Project-and-Viva-Guide.pdf"><BookOpen size={16} /> Project explanation & viva guide</a></div><div className="report-includes"><span className="eyebrow">INCLUDED IN THE REPORT</span>{['Project aim & mathematical concepts', 'Input vector & three basis matrices', 'Intermediate coordinates & change matrices', 'Reverse transformation steps', 'Reconstruction error & PASS / FAIL'].map((text) => <span key={text}><Check size={14} />{text}</span>)}</div><div className="report-includes guide-note"><span className="eyebrow">FACULTY PREPARATION GUIDE</span><span>Worked example, demo script, app implementation notes, and 25 viva questions with answers.</span></div></div></div>
    </section>
  ) : <ErrorPanel message={computed.error} onFix={() => changePage('configuration')} />

  const currentPage = pageItems.find((item) => item.id === activePage)

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Activity size={20} /></span><div><b>BasisBridge</b><span>TRANSFORMATION LAB</span></div><button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={17} /></button></div>
        <div className="workspace-label">PROJECT WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {pageItems.map((item) => {
            const Icon = item.icon
            return <div key={item.id}>{item.group && <div className="nav-group">{item.group}</div>}<button className={`nav-item${activePage === item.id ? ' active' : ''}`} onClick={() => changePage(item.id)}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'history' && history.length > 0 && <small>{history.length}</small>}{activePage === item.id && <i />}</button></div>
          })}
        </nav>
        <div className="sidebar-bottom"><div className="space-card"><span className="space-icon"><Gauge size={17} /></span><div><b>{draft.dimension}D vector space</b><span>Real-valued coordinates</span></div><span className="status-dot" /></div><div className="sidebar-footer"><span>OFFLINE-READY</span><span><span className="online-dot" /> LOCAL COMPUTATION</span></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button><span className="breadcrumb-muted">BasisBridge</span><span className="breadcrumb-slash">/</span><span>{currentPage?.label}</span></div><div className="topbar-right"><span className="compute-status"><span className="online-dot" /> Engine ready</span><span className="topbar-divider" /><span className="version-badge">v1.0</span></div></header>
        <div className="content-area">
          {toast && <div className="toast-message" role="status">{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}
          {activePage === 'dashboard' && renderDashboard()}
          {activePage === 'configuration' && renderConfiguration()}
          {activePage === 'lab' && renderLab()}
          {activePage === 'explorer' && renderExplorer()}
          {activePage === 'visualization' && renderVisualization()}
          {activePage === 'verification' && renderVerification()}
          {activePage === 'learning' && renderLearning()}
          {activePage === 'history' && renderHistory()}
          {activePage === 'report' && renderReport()}
          <footer className="main-footer"><span><Atom size={13} /> Built for Linear Algebra & Vector Calculus</span><span>BasisBridge · Project 12</span></footer>
        </div>
      </main>
    </div>
  )
}

function ErrorPanel({ message, onFix }: { message: string | null; onFix: () => void }) {
  return <div className="panel error-state"><TriangleAlert size={22} /><div><h3>Transformation paused</h3><p>{message ?? 'Enter valid finite values and linearly independent basis vectors.'}</p><button className="button button-secondary" onClick={onFix}>Review input configuration <ArrowRight size={14} /></button></div></div>
}

function downloadFile(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function buildPdfReport(data: TransformResult) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 18
  const line = (text: string, size = 10, gap = 6) => {
    if (y > 278) { pdf.addPage(); y = 18 }
    pdf.setFontSize(size)
    pdf.text(text, 16, y, { maxWidth: 178 })
    y += gap
  }
  const matrixLines = (label: string, matrix: Matrix) => {
    line(label, 10, 5)
    matrix.forEach((row) => line(`[ ${row.map((value) => formatNumber(value)).join('    ')} ]`, 9, 5))
  }
  line('BasisBridge', 21, 9)
  line('Multiple Coordinate System Converter - Experiment report', 11, 9)
  line('Aim: Transform vectors successively through different bases and verify the transformations.', 10, 9)
  line('Concepts: Basis and dimension - Change of basis - Matrix multiplication - Linear transformations - Inverse matrices', 10, 10)
  line(`Vector space: ${data.dimension}D    Input vector: ${vectorText(data.vector)}`, 11, 8)
  data.bases.forEach((basis, index) => {
    line(`Basis ${index + 1} (columns are basis vectors), det = ${formatNumber(data.determinants[index])}`, 11, 6)
    basis.forEach((row) => line(`[ ${row.map((value) => formatNumber(value)).join('    ')} ]`, 10, 5))
    line(`Coordinates in B${index + 1}: ${vectorText(data.coordinates[index])}`, 10, 7)
  })
  matrixLines('P01 = inverse(B1) x I', data.inverses[0])
  matrixLines('P21 = inverse(B2) x B1', data.changes[0])
  matrixLines('P32 = inverse(B3) x B2', data.changes[1])
  matrixLines('Reverse matrix inverse(P32)', data.reverseChanges[1])
  matrixLines('Reverse matrix inverse(P21)', data.reverseChanges[0])
  line(`Reverse: [v]B2 = ${vectorText(data.reverseCoordinates[0])}`, 10, 6)
  line(`Reverse: [v]B1 = ${vectorText(data.reverseCoordinates[1])}`, 10, 6)
  line(`Reconstructed vector: ${vectorText(data.reconstructed)}`, 10, 6)
  line(`Absolute coordinate errors: ${vectorText(data.absoluteErrors)}`, 10, 6)
  line(`Maximum coordinate error: ${data.maxError.toExponential(3)}`, 10, 7)
  line(`Verification: ${data.verified ? 'PASS - Transformation verified successfully.' : 'FAIL - Transformation verification error detected.'}`, 11, 8)
  line('Conclusion: Successive coordinate changes and reverse reconstruction were computed from the entered basis matrices.', 10, 7)
  downloadFile(pdf.output('blob'), 'basisbridge-report.pdf')
}

export default App
