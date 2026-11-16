import { useState } from 'react';
import { DICE_SKINS } from './lib/astragalDice.js';

async function readArtwork(file, size) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Please choose an image under 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    if (image.width > 8192 || image.height > 8192) throw new Error('Please use an image no larger than 8192 pixels on either side.');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const ratio = Math.min(size / image.width, size / image.height), width = image.width * ratio, height = image.height * ratio;
    context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

export default function DiceDesigner({ isAdmin, onPreview, onPublish }) {
  const [name, setName] = useState('My Soterian Dice'), [base, setBase] = useState('bone'), [pattern, setPattern] = useState(null), [logo, setLogo] = useState(null);
  const [designType, setDesignType] = useState('surface'), [shellPattern, setShellPattern] = useState(null), [model, setModel] = useState(null);
  const [tint, setTint] = useState('#a7eadb'), [shellOpacity, setShellOpacity] = useState(0.28), [interiorScale, setInteriorScale] = useState(0.85);
  const [error, setError] = useState(null), [loading, setLoading] = useState(false), [notice, setNotice] = useState('');
  const [numeralColorMode, setNumeralColorMode] = useState('auto');
  const [customNumeralColor, setCustomNumeralColor] = useState('#a51653');
  if (!isAdmin) return null;
  const logoReplacesTwenty = designType === 'surface' && Boolean(logo);
  const draft = { ...DICE_SKINS[base], name: name.trim() || 'Custom Dice', designType, pattern: designType === 'interior' ? shellPattern : pattern, logo: designType === 'surface' ? logo : null,
    numeralColor: numeralColorMode === 'rose' ? '#a51653' : numeralColorMode === 'custom' ? customNumeralColor : null,
    ...(designType === 'interior' ? { tint, shellOpacity, interiorScale, interiorModel: model?.data, interiorName: model?.name, ink: '#fff0c0' } : {}) };
  const storeModel = async file => {
    if (!file.name.toLowerCase().endsWith('.glb')) throw new Error('Choose a binary glTF model (.glb).');
    const buffer = await file.arrayBuffer();
    const { validateInteriorGLB, loadInteriorModel, disposeInterior } = await import('./lib/diceInterior.js');
    const info = validateInteriorGLB(buffer);
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('The model could not be read.'));
      reader.readAsDataURL(new Blob([buffer], { type: 'model/gltf-binary' }));
    });
    const parsed = await loadInteriorModel(data); disposeInterior(parsed);
    setModel({ data, name: file.name, triangles: info.triangles });
  };
  const uploadModel = async event => {
    if (!isAdmin) return;
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setLoading(true); setError(null); setNotice('');
    try { await storeModel(file); } catch (failure) { setError(failure.message); } finally { setLoading(false); }
  };
  const loadExample = async () => {
    if (!isAdmin) return;
    setLoading(true); setError(null);
    try {
      const surfacePath = designType === 'surface' ? '/templates/01-surface-logo/surface-template.png' : '/templates/02-translucent-interior/translucent-surface-template.png';
      const image = await fetch(surfacePath); if (!image.ok) throw new Error('The example surface could not load.');
      const data = await readArtwork(new File([await image.blob()], 'surface.png', { type: 'image/png' }), 512);
      if (designType === 'surface') {
        setPattern(data); const mark = await fetch('/templates/01-surface-logo/logo-template.png');
        if (!mark.ok) throw new Error('The example logo could not load.');
        setLogo(await readArtwork(new File([await mark.blob()], 'logo.png', { type: 'image/png' }), 256));
      } else {
        setShellPattern(data); const response = await fetch('/templates/02-translucent-interior/interior-template.glb');
        if (!response.ok) throw new Error('The example model could not load.');
        await storeModel(new File([await response.arrayBuffer()], 'interior-template.glb', { type: 'model/gltf-binary' }));
      }
      setNotice('Example assets loaded. Preview in the tray, then cast.');
    } catch (failure) { setError(failure.message); } finally { setLoading(false); }
  };
  const upload = async (event, setter, size) => {
    if (!isAdmin) return;
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setLoading(true); setError(null); setNotice('');
    try { setter(await readArtwork(file, size)); }
    catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  };
  return <section className="designer"><div className="section-title"><span>03 / ADMIN DICE DESIGNER</span><span>ADMIN ONLY</span></div>
    <h2>Make your mark.</h2><p>Two ways to design your dice. The numbered faces and roll physics stay the same.</p>
    <div className="design-formats" role="group" aria-label="Dice design format"><button type="button" aria-pressed={designType === 'surface'} disabled={loading} onClick={() => { setDesignType('surface'); setError(null); setNotice(''); }}><strong>01 / Surface + logo</strong><small>Patterned finish with your emblem</small></button><button type="button" aria-pressed={designType === 'interior'} disabled={loading} onClick={() => { setDesignType('interior'); setError(null); setNotice(''); }}><strong>02 / Translucent + 3D</strong><small>A design suspended inside the die</small></button></div>
    <div className="template-downloads"><a href={designType === 'surface' ? '/templates/surface-logo-templates.zip' : '/templates/translucent-interior-templates.zip'} download>↓ Download this template pack</a><a href="/templates/README.md" target="_blank" rel="noreferrer">Asset specifications ↗</a><button type="button" disabled={loading} onClick={loadExample}>Load example assets</button></div>
    <label>Finish name<input aria-label="Finish name" value={name} maxLength={40} onChange={event => setName(event.target.value)} /></label>
    {designType === 'surface' && <label>Base material<select aria-label="Base material" value={base} onChange={event => setBase(event.target.value)}>{Object.entries(DICE_SKINS).map(([id, skin]) => <option key={id} value={id}>{skin.name}</option>)}</select></label>}
    <label>
      Number color
      <select value={numeralColorMode} onChange={event => setNumeralColorMode(event.target.value)}>
        <option value="auto">Automatic</option>
        <option value="rose">Rose pink</option>
        <option value="custom">Custom color</option>
      </select>
    </label>
    {numeralColorMode === 'custom' && <label>
      Custom number color
      <input type="color" value={customNumeralColor} onChange={event => setCustomNumeralColor(event.target.value)} />
    </label>}
    <div className="uploads">{(designType === 'surface' ? [['Surface pattern', pattern, setPattern, 512], ['Logo', logo, setLogo, 256]] : [['Translucent surface', shellPattern, setShellPattern, 512]]).map(([title, data, setter, size]) => <div key={title} className="upload-tile"><label>{data ? <img src={data} alt={`${title} preview`} /> : <span className="upload-symbol">{title === 'Logo' ? '✦' : '▧'}</span>}<strong>{title}</strong><small>PNG · JPEG · WebP / up to 5 MB</small><input aria-label={`Upload ${title.toLowerCase()}`} type="file" accept="image/png,image/jpeg,image/webp" disabled={loading} onChange={event => upload(event, setter, size)} /></label>{data && <button onClick={() => setter(null)}>Remove {title.toLowerCase()}</button>}</div>)}
    {designType === 'interior' && <div className="upload-tile"><label><span className="upload-symbol">◇</span><strong>3D design inside die</strong><small>Self-contained GLB · under 5 MB</small><input aria-label="Upload internal 3D design" type="file" accept=".glb,model/gltf-binary" disabled={loading} onChange={uploadModel} /></label>{model && <><p className="model-info">{model.name}<br />{model.triangles.toLocaleString()} triangles · fitted automatically</p><button onClick={() => setModel(null)}>Remove 3D design</button></>}</div>}</div>
    {designType === 'interior' && <div className="shell-settings"><label>Shell tint<input type="color" aria-label="Shell tint" value={tint} onChange={event => setTint(event.target.value)} /></label><label>Shell opacity <span>{Math.round(shellOpacity * 100)}%</span><input type="range" aria-label="Shell opacity" min="10" max="70" value={Math.round(shellOpacity * 100)} onChange={event => setShellOpacity(Number(event.target.value) / 100)} /></label><label>Interior size <span>{Math.round(interiorScale * 100)}%</span><input type="range" aria-label="Interior size" min="40" max="95" value={Math.round(interiorScale * 100)} onChange={event => setInteriorScale(Number(event.target.value) / 100)} /></label><p>The model is fixed inside the shell and turns with the die.</p></div>}
    {designType === 'surface' && <p>The logo replaces the 20 on a d20 and counts as a natural 20.</p>}
    <div className="finish-swatch" style={{ backgroundColor: designType === 'interior' ? tint : draft.body, backgroundImage: draft.pattern ? `url(${draft.pattern})` : undefined, color: draft.numeralColor || draft.ink }}>
      {!logoReplacesTwenty && <span>20</span>}
      {designType === 'surface' && logo && <img src={logo} alt={logoReplacesTwenty ? 'Custom logo replacing the d20’s 20' : 'Custom dice logo'} style={logoReplacesTwenty ? { width: 75, height: 75 } : undefined} />}
      {designType === 'interior' && <small>TRANSLUCENT SHELL</small>}
    </div>
    <div className="designer-actions"><button disabled={loading || (designType === 'interior' && !model)} onClick={() => { if (isAdmin) { onPreview(draft); setNotice('Draft selected. Cast the dice above to inspect it in 3D.'); } }}>Preview in tray</button><button disabled={loading || (designType === 'interior' && !model)} onClick={async () => {
      if (!isAdmin) return;
      setLoading(true); setError(null); setNotice('');
      try { await onPublish(draft); setNotice('Finish saved. It’s available in Astragal on this device.'); }
      catch (failure) { setError(failure.message); }
      finally { setLoading(false); }
    }}>Save finish</button></div>
    <p className="local-note">Saved finishes are available on this browser and device.</p>
    {loading && <p role="status">Preparing artwork…</p>}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </section>;
}
