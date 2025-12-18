/**
 * Formata um número de telefone brasileiro com máscara visual
 * Formato: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Aplica a máscara conforme o tamanho
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    // Telefone com 11 dígitos (celular)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * Remove a máscara do telefone, retornando apenas números
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

