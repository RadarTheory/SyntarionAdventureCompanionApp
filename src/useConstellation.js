import { useEffect, useState } from 'react';
import { ALL_CLASSES } from './constants';
import { loadConstellation, classLabelOf, startingCallingOf } from './constellationAbilities';

// The constellation's data module (public/constellation/data.js), or null until it has loaded or if it can't.
export function useConstellation() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    loadConstellation().then(d => { if (live) setData(d); }).catch(() => {});
    return () => { live = false; };
  }, []);
  return data;
}

// A character's class label from their constellation build ({ name, title, iconId, others }, see classLabelOf).
// Until the data loads, or for a character with no build, it uses the creation class from constants.js.
export function useClassLabel(char) {
  const d = useConstellation();
  return classLabel(d, char);
}

export function classLabel(d, char) {
  if (!char) return null;
  if (d) {
    const label = classLabelOf(d, char);
    if (label) return label;
  }
  const id = startingCallingOf(char);
  const cls = id && ALL_CLASSES.find(c => c.id === id);
  return cls ? { name: cls.name, title: '', iconId: cls.id, others: [] } : null;
}
