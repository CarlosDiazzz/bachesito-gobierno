export default function Badge({ label, color, bgColor }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 500,
      color: color,
      background: bgColor,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
