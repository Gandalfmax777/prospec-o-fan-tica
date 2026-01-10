import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Função para formatar valor em centavos para formato brasileiro
const formatBrazilianCurrency = (value: number): string => {
  return (value / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para remover formatação e obter apenas números e vírgula
const parseFormattedValue = (formatted: string): string => {
  // Remove pontos (separadores de milhar) e mantém apenas números e vírgula
  return formatted.replace(/\./g, "").replace(/[^\d,]/g, "");
};

// Função para calcular nova posição do cursor após formatação
const calculateNewCursorPosition = (
  oldValue: string,
  newValue: string,
  oldCursorPos: number
): number => {
  // Contar caracteres numéricos (incluindo vírgula) antes do cursor na string antiga
  const beforeCursorOld = oldValue.slice(0, oldCursorPos);
  const numericCharsBeforeOld = beforeCursorOld.replace(/[^\d,]/g, "").length;

  // Encontrar posição equivalente na nova string formatada
  let newPos = 0;
  let numericCount = 0;
  for (let i = 0; i < newValue.length; i++) {
    if (/[\d,]/.test(newValue[i])) {
      numericCount++;
      if (numericCount > numericCharsBeforeOld) {
        break;
      }
    }
    newPos = i + 1;
  }

  return Math.min(newPos, newValue.length);
};

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = "0,00",
  className,
  disabled,
}: CurrencyInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const lastSyncedValueRef = useRef<number | null>(null);

  // Sincronizar apenas quando não está focado e o valor externo mudou
  // Durante o foco, ignorar mudanças externas, EXCETO quando valor muda para null (reset)
  useEffect(() => {
    // Só sincronizar se o valor externo realmente mudou
    if (value !== lastSyncedValueRef.current) {
      // Se o valor mudou para null, sempre resetar (mesmo se focado)
      if (value == null) {
        lastSyncedValueRef.current = null;
        setDisplayValue("");
        return;
      }

      // Se estiver focado e valor não é null, não sincronizar (permitir digitação)
      if (isFocused) {
        return;
      }

      // Sincronizar quando não está focado
      lastSyncedValueRef.current = value;
      const formatted = formatBrazilianCurrency(value);
      setDisplayValue(formatted);
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    const previousDisplayValue = displayValue;

    // Se o campo estiver vazio
    if (rawValue === "") {
      setDisplayValue("");
      onChange(null);
      lastSyncedValueRef.current = null;
      return;
    }

    // Remover formatação (pontos e outros caracteres não numéricos)
    const cleaned = parseFormattedValue(rawValue);

    // Permitir apenas uma vírgula
    const parts = cleaned.split(",");
    let normalized = parts[0];
    if (parts.length > 1) {
      // Limitar a 2 casas decimais após vírgula
      normalized = parts[0] + "," + parts.slice(1).join("").slice(0, 2);
    }

    // Converter para centavos
    const numericValue = normalized.replace(",", ".");
    const parsed = parseFloat(numericValue);

    let cents: number | null = null;
    if (!isNaN(parsed) && normalized !== "") {
      cents = Math.round(parsed * 100);
    }

    // Formatar com máscara brasileira
    let formatted = "";
    if (cents !== null) {
      formatted = formatBrazilianCurrency(cents);
    } else {
      // Se não conseguiu parsear, manter apenas números e vírgula
      formatted = normalized;
    }

    // Atualizar display value
    setDisplayValue(formatted);

    // Atualizar valor em centavos
    if (cents !== null) {
      // Só chamar onChange se o valor realmente mudou
      if (lastSyncedValueRef.current !== cents) {
        onChange(cents);
        lastSyncedValueRef.current = cents;
      }
    } else {
      onChange(null);
      lastSyncedValueRef.current = null;
    }

    // Calcular e preservar posição do cursor
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPosition = calculateNewCursorPosition(
          previousDisplayValue,
          formatted,
          cursorPosition
        );
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Ao focar, manter formatação se já houver valor
    if (value != null && displayValue === "") {
      const formatted = formatBrazilianCurrency(value);
      setDisplayValue(formatted);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Formatar ao perder foco
    if (value != null) {
      const formatted = formatBrazilianCurrency(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
};
