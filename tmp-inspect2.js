const lucide = require('lucide');
const sample = lucide.ChevronRight;
console.log('length:', sample.length);
for (let i = 0; i < sample.length; i++) {
  console.log('--- index', i, '---');
  console.log('typeof:', typeof sample[i]);
  if (sample[i] && typeof sample[i] === 'object') {
    console.log('keys:', Object.keys(sample[i]));
    console.log('props:', JSON.stringify(sample[i].props, null, 2).slice(0, 2000));
  } else if (sample[i] && typeof sample[i] === 'function') {
    console.log('fn.name:', sample[i].name);
    console.log('fn keys:', Object.keys(sample[i]));
    console.log('fn.props:', JSON.stringify(sample[i].props, null, 2).slice(0, 2000));
  }
}
