const lucide = require('lucide');
console.log('typeof lucide:', typeof lucide);
console.log('keys (first 20):', Object.keys(lucide).slice(0, 20));
console.log('lucide.createIcons?', typeof lucide.createIcons);
// Try a few property forms
const toPascal = (name) => {
  const specials = {
    'x-circle': 'XCircle',
    'check-circle-2': 'CheckCircle2',
    'building-2': 'Building2',
    'more-vertical': 'MoreVertical',
    'map-pin-off': 'MapPinOff',
    'list-checks': 'ListChecks',
    'triangle-alert': 'TriangleAlert',
  };
  if (specials[name]) return specials[name];
  return name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};

const icons = [
  'chevron-right', 'help-circle', 'plus', 'map-pin', 'check-circle-2', 'wrench',
  'x-circle', 'search', 'filter', 'download', 'building-2', 'eye', 'more-vertical',
  'map-pin-off', 'chevron-left', 'info', 'list-checks', 'arrow-left', 'alert-circle',
  'pencil', 'power', 'copy', 'archive', 'anchor', 'key', 'triangle-alert', 'printer'
];

for (const iconName of icons) {
  const prop = toPascal(iconName);
  const icon = lucide[prop];
  if (!icon) {
    console.log('=====' + iconName + '===== NOT FOUND (prop: ' + prop + ')');
    continue;
  }
  console.log('=====' + iconName + '=====');
  // lucide icons: icon.props.d is the path data array, or icon.path
  const d = icon.props ? icon.props.d : icon.d;
  console.log(Array.isArray(d) ? d.join(' ') : d);
}
