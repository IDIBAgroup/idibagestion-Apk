import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
};
export function AuthField({
  label,
  icon,
  type = "text",
  id,
  name,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? name;
  return (
    <div
      className={`id-auth-field ${icon ? "has-icon" : ""} ${type === "password" ? "has-toggle" : ""}`}
    >
      {icon && (
        <span className="id-auth-field-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        {...props}
        id={fieldId}
        name={name}
        type={type === "password" && visible ? "text" : type}
        placeholder=" "
      />
      <label htmlFor={fieldId}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      {type === "password" && (
        <button
          type="button"
          className="id-auth-eye"
          onClick={() => setVisible(!visible)}
          disabled={props.disabled}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
  );
}
