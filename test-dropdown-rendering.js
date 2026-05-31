const players = [
  { id: 'f74bb245-5e1b-4fcc-a87f-021b804925db', email: 'admin@gaming.local', cellphone: '1234567890' },
  { id: '2', email: 'john@example.com', cellphone: null },
  { id: '3', email: 'jane@example.com', cellphone: '9876543210' },
];

console.log('Simulating dropdown rendering with availableUsers signal:\n');
console.log('HTML Template:');
console.log(`<select formControlName="playerUsername" ...>`);
console.log(`  <option value="">Select player</option>`);
console.log(`  @for (user of availableUsers(); track user.id) {`);
console.log(`    <option [value]="user.email || user.cellphone || user.id">`);
console.log(`      {{ user.email || user.cellphone }}`);
console.log(`    </option>`);
console.log(`  }`);
console.log(`</select>\n`);

console.log('Rendered Options:');
console.log(`<option value="">Select player</option>`);
players.forEach((user, i) => {
  const value = user.email || user.cellphone || user.id;
  const display = user.email || user.cellphone;
  console.log(`<option value="${value}">${display}</option>`);
});

console.log('\n✅ Dropdown will display:');
players.forEach((user, i) => {
  const display = user.email || user.cellphone;
  console.log(`   ${i+1}. ${display}`);
});
