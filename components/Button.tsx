import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'white';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-alma-primary to-alma-accent text-white hover:shadow-lg shadow-alma-primary/30",
    outline: "border-2 border-alma-primary text-alma-primary hover:bg-alma-primary hover:text-white",
    white: "bg-white text-alma-dark hover:bg-gray-100 shadow-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;