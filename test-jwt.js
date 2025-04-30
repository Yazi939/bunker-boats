const jwt = require('jsonwebtoken');

// Тестовый токен 
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzE0NjYwNjM1LCJleHAiOjE3MTcyNTI2MzV9.AexGfKxRH1p_yMuq1SzPDXfLTKWZJZZEpjzGVMsxNc0';

try {
  const decoded = jwt.verify(token, 'JFGDJFGDJGFJTOKENSECRETKEY564373');
  console.log('Decoded token:', decoded);
} catch (err) {
  console.error('Error decoding token:', err.message);
} 