type FieldProps = {
  label: string;
  type?: 'text' | 'password' | 'email' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export function Field({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required, 
  disabled,
  style 
}: FieldProps) {
  return (
    <div style={{ marginBottom: '16px', ...style }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '6px', 
        fontSize: '14px', 
        fontWeight: 500,
        color: '#333'
      }}>
        {label} {required && <span style={{ color: '#d32f2f' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          outline: 'none',
          boxSizing: 'border-box',
          backgroundColor: disabled ? '#f5f5f5' : '#fff',
        }}
      />
    </div>
  );
}
